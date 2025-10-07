import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedOrderWorkflow } from '@/hooks/useEnhancedOrderWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getStatusLabel, getStatusColor, getStatusBadgeVariant } from '@/lib/orderStatus';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  Package,
  RefreshCw,
  Info
} from 'lucide-react';

interface OrderItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  qty_picked: number;
  notes?: string;
  shopping_status?: string;
}

interface Order {
  id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
}

export default function SimpleShopperDashboard() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === '1';
  
  const { user } = useAuth();
  const { toast } = useToast();
  const workflow = useEnhancedOrderWorkflow();
  
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [shopperQueue, setShopperQueue] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string>('');

  const openOrder = (order: Order) => {
    setCurrentOrder(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({
      title: "Order opened",
      description: `Now viewing order for ${order.customer_name}`
    });
  };

  // Load available orders
  const loadAvailableOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('status', 'placed')
        .is('assigned_shopper_id', null)
        .limit(10);
      
      if (error) throw error;
      
      const formattedOrders = (data || []).map(order => ({
        ...order,
        items: order.order_items || []
      }));
      
      setAvailableOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading available orders:', error);
    }
  };

  // Load shopper queue
  const loadShopperQueue = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('assigned_shopper_id', user.id)
        .in('status', ['claimed', 'shopping'])
        .order('created_at');
      
      if (error) throw error;
      
      const formattedOrders = (data || []).map(order => ({
        ...order,
        items: order.order_items || []
      }));
      
      setShopperQueue(formattedOrders);
    } catch (error) {
      console.error('Error loading shopper queue:', error);
    }
  };

  // Execute guarded action
  const executeAction = async (action: string, fn: () => Promise<void>) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProcessingAction(action);
    
    try {
      await fn();
      
      // Refresh data after successful action
      await loadAvailableOrders();
      await loadShopperQueue();
      
      // Refetch current order from database
      if (currentOrder) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(*)
          `)
          .eq('id', currentOrder.id)
          .single();
        
        if (!error && data) {
          setCurrentOrder({
            ...data,
            items: data.order_items || []
          });
        }
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setIsProcessing(false);
      setProcessingAction('');
    }
  };

  // Action handlers
  const handleAcceptOrder = (order: Order) => {
    executeAction('Accept', () => 
      workflow.acceptOrder(order.id, 'placed')
    );
  };

  const handleStartShopping = (order: Order) => {
    executeAction('Start Shopping', () => 
      workflow.startShopping(order.id, 'claimed')
    );
  };

  const handlePickItem = (item: OrderItem, qtyPicked: number) => {
    if (!currentOrder) return;
    
    executeAction('Pick Item', () => 
      workflow.pickItem({
        orderId: currentOrder.id,
        itemId: item.id,
        qtyPicked,
        expectedStatus: 'shopping'
      })
    );
  };

  const handleAdvanceToReady = () => {
    if (!currentOrder) return;
    
    executeAction('Advance to READY', () => 
      workflow.advanceStatus({
        orderId: currentOrder.id,
        to: 'ready',
        expectedStatus: 'shopping'
      })
    );
  };

  // Effects
  useEffect(() => {
    loadAvailableOrders();
    loadShopperQueue();
  }, [user]);

  // Simple realtime subscription for shopper's orders only
  useEffect(() => {
    if (!user) return;

    console.log('[SimpleShopperDashboard] Setting up realtime for shopper:', user.id);
    
    const channel = supabase
      .channel('shopper-dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `assigned_shopper_id=eq.${user.id}`
      }, (payload) => {
        console.log('[SimpleShopperDashboard] Order change detected:', payload);
        // Refetch lists on any change
        loadAvailableOrders();
        loadShopperQueue();
        
        // Refetch current order if it matches
        if (currentOrder && payload.new && 'id' in payload.new && payload.new.id === currentOrder.id) {
          supabase
            .from('orders')
            .select(`*, order_items(*)`)
            .eq('id', currentOrder.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setCurrentOrder({
                  ...data,
                  items: data.order_items || []
                });
              }
            });
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `status=eq.placed`
      }, () => {
        console.log('[SimpleShopperDashboard] Available order changed');
        loadAvailableOrders();
      })
      .subscribe();

    return () => {
      console.log('[SimpleShopperDashboard] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, currentOrder?.id]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shopper Dashboard (Guarded)</h1>
          <p className="text-muted-foreground">
            Fully reliable workflow with realtime updates
          </p>
        </div>
      </div>

      {/* Current Order */}
      {currentOrder && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Current Order: {currentOrder.customer_name}
              </CardTitle>
              <Badge variant={getStatusBadgeVariant(currentOrder.status)}>
                {currentOrder.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Items */}
            <div className="space-y-2">
              <h4 className="font-medium">Items to Shop</h4>
              {currentOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.qty} | Picked: {item.qty_picked || 0}
                    </p>
                    {item.shopping_status && (
                      <Badge variant="outline" className="mt-1">
                        {item.shopping_status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={item.qty}
                      defaultValue={item.qty_picked || 0}
                      className="w-20"
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 0;
                        if (qty !== (item.qty_picked || 0)) {
                          handlePickItem(item, qty);
                        }
                      }}
                      disabled={isProcessing && processingAction === 'Pick Item'}
                    />
                    <Button
                      size="sm"
                      onClick={() => handlePickItem(item, item.qty)}
                      disabled={isProcessing}
                    >
                      {isProcessing && processingAction === 'Pick Item' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {currentOrder.status === 'claimed' && (
                <Button
                  onClick={() => handleStartShopping(currentOrder)}
                  disabled={isProcessing}
                >
                  {isProcessing && processingAction === 'Start Shopping' ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 mr-2" />
                  )}
                  Start Shopping
                </Button>
              )}
              
              {currentOrder.status === 'shopping' && (
                <Button
                  onClick={handleAdvanceToReady}
                  disabled={isProcessing}
                >
                  {isProcessing && processingAction === 'Advance to READY' ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Package className="w-4 h-4 mr-2" />
                  )}
                  Mark Ready
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Available Orders ({availableOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No available orders at the moment
            </p>
          ) : (
            <div className="space-y-2">
              {availableOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${order.total_amount} • {order.items.length} items
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptOrder(order)}
                    disabled={isProcessing}
                  >
                    {isProcessing && processingAction === 'Accept' ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shopper Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            My Queue ({shopperQueue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shopperQueue.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No orders in your queue
            </p>
          ) : (
            <div className="space-y-2">
              {shopperQueue.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${order.total_amount} • {order.items.length} items
                    </p>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="mt-1">
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openOrder(order)}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Section */}
      {debugMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentOrder && (
              <>
                <div>
                  <h4 className="font-medium">Current Order Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentOrder.status.toUpperCase()}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Item Status</h4>
                  <div className="space-y-1">
                    {currentOrder.items.map((item) => (
                      <p key={item.id} className="text-sm">
                        {item.name}: {item.qty_picked || 0}/{item.qty} picked
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}