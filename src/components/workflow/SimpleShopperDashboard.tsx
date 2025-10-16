import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedOrderWorkflow } from '@/hooks/useEnhancedOrderWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getStatusBadgeVariant } from '@/lib/orderStatus';
import { MobileProductCard } from './MobileProductCard';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { 
  ShoppingCart, 
  Clock, 
  Package,
  RefreshCw,
  Info,
  CheckCircle2,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface OrderItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  qty_picked: number;
  notes?: string;
  shopping_status?: string;
  product?: {
    name: string;
    image_url?: string;
    unit?: string;
  };
}

interface Order {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  property_address?: string;
  special_instructions?: string;
  shopping_completed_at?: string;
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
  const [activeTab, setActiveTab] = useState<string>('active');

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

  // Load shopper queue with product images
  const loadShopperQueue = async () => {
    if (!user?.id) return;
    
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:new_order_items(*)
        `)
        .eq('assigned_shopper_id', user.id)
        .in('status', ['claimed', 'shopping', 'ready'])
        .order('created_at');
      
      if (error) throw error;
      
      // Fetch products separately and join
      const formattedOrders = await Promise.all((orders || []).map(async (order) => {
        const itemsWithProducts = await Promise.all(order.order_items.map(async (item: any) => {
          if (item.sku) {
            const { data: product } = await supabase
              .from('products')
              .select('name, image_url, unit')
              .eq('id', item.sku)
              .single();
            
            return { ...item, product };
          }
          return item;
        }));
        
        return {
          ...order,
          items: itemsWithProducts
        };
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
      
      // Refetch current order from database with product images
      if (currentOrder) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items:new_order_items(*)
          `)
          .eq('id', currentOrder.id)
          .single();
        
        if (!error && data) {
          // Fetch products separately
          const itemsWithProducts = await Promise.all(data.order_items.map(async (item: any) => {
            if (item.sku) {
              const { data: product } = await supabase
                .from('products')
                .select('name, image_url, unit')
                .eq('id', item.sku)
                .single();
              
              return { ...item, product };
            }
            return item;
          }));
          
          setCurrentOrder({
            ...data,
            items: itemsWithProducts
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

  const handleAdvanceToReady = async () => {
    if (!currentOrder) return;
    
    await executeAction('Advance to READY', () => 
      workflow.advanceStatus({
        orderId: currentOrder.id,
        to: 'ready',
        expectedStatus: 'shopping'
      })
    );
    
    // Close current order and switch to completed tab
    setCurrentOrder(null);
    setActiveTab('completed');
    
    toast({
      title: "Order completed!",
      description: "Order has been packed and is ready for delivery",
    });
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
        
        // Refetch current order if it matches with product images
        if (currentOrder && payload.new && 'id' in payload.new && payload.new.id === currentOrder.id) {
          supabase
            .from('orders')
            .select(`
              *, 
              order_items:new_order_items(*)
            `)
            .eq('id', currentOrder.id)
            .single()
            .then(async ({ data }) => {
              if (data) {
                // Fetch products separately
                const itemsWithProducts = await Promise.all(data.order_items.map(async (item: any) => {
                  if (item.sku) {
                    const { data: product } = await supabase
                      .from('products')
                      .select('name, image_url, unit')
                      .eq('id', item.sku)
                      .single();
                    
                    return { ...item, product };
                  }
                  return item;
                }));
                
                setCurrentOrder({
                  ...data,
                  items: itemsWithProducts
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-blue-500/5">
      {/* Branded Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Shopper Dashboard</h1>
              <p className="text-white/80">Personal shopping & order fulfillment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown userRole="shopper" onViewAll={() => {}} />
            <UserProfileMenu />
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto p-6 pb-20">
      {/* Sticky Order Info */}
      {currentOrder && (
        <div className="sticky top-0 z-10 bg-background border-b mb-4 -mx-6 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Shopping for {currentOrder.customer_name}
            </p>
            <Badge variant={getStatusBadgeVariant(currentOrder.status)} className="text-sm">
              {currentOrder.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      )}

        {/* Current Order - Mobile-First Product Cards */}
        {currentOrder && (
          <div className="space-y-4">
            {/* Start Shopping Action */}
            {currentOrder.status === 'claimed' && (
              <Button
                onClick={() => handleStartShopping(currentOrder)}
                disabled={isProcessing}
                className="w-full h-14 text-lg touch-manipulation"
                size="lg"
              >
                {isProcessing && processingAction === 'Start Shopping' ? (
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                Start Shopping
              </Button>
            )}

            {/* Product Cards */}
            <div className="space-y-4">
              {currentOrder.items.map((item) => (
                <MobileProductCard
                  key={item.id}
                  name={item.product?.name || item.name}
                  imageUrl={item.product?.image_url}
                  quantity={item.qty}
                  pickedQuantity={item.qty_picked || 0}
                  unit={item.product?.unit}
                  shoppingStatus={item.shopping_status}
                  onQuantityChange={(qty) => handlePickItem(item, qty)}
                  onMarkFound={() => handlePickItem(item, item.qty)}
                  disabled={isProcessing}
                />
              ))}
            </div>

            {/* Complete Order - Sticky Bottom */}
            {currentOrder.status === 'shopping' && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg md:relative md:shadow-none">
                <Button
                  onClick={handleAdvanceToReady}
                  disabled={isProcessing}
                  className="w-full h-16 text-lg touch-manipulation"
                  size="lg"
                >
                  {isProcessing && processingAction === 'Advance to READY' ? (
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  ) : (
                    <Package className="w-6 h-6 mr-2" />
                  )}
                  Complete Order & Pack Items
                </Button>
              </div>
            )}
          </div>
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

      {/* Shopper Queue with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            My Queue ({shopperQueue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">
                Active ({shopperQueue.filter(o => ['claimed', 'shopping'].includes(o.status)).length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">
                Completed ({shopperQueue.filter(o => o.status === 'ready').length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              {shopperQueue.filter(o => ['claimed', 'shopping'].includes(o.status)).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No active orders
                </p>
              ) : (
                <div className="space-y-2">
                  {shopperQueue.filter(o => ['claimed', 'shopping'].includes(o.status)).map((order) => (
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
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              {shopperQueue.filter(o => o.status === 'ready').length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No completed orders
                </p>
              ) : (
                <div className="space-y-4">
                  {shopperQueue.filter(o => o.status === 'ready').map((order) => (
                    <Card key={order.id} className="border-2 border-green-500/20 bg-green-500/5">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold">{order.customer_name}</h4>
                              <Badge variant="outline" className="mt-1 border-green-600 text-green-600">
                                READY FOR DELIVERY
                              </Badge>
                            </div>
                          </div>
                          <p className="font-semibold">${order.total_amount}</p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {order.customer_phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{order.customer_phone}</span>
                            </div>
                          )}
                          {order.customer_email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span>{order.customer_email}</span>
                            </div>
                          )}
                          {order.property_address && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 mt-0.5" />
                              <span>{order.property_address}</span>
                            </div>
                          )}
                        </div>
                        
                        {order.special_instructions && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground font-medium">Special Instructions:</p>
                            <p className="text-sm mt-1">{order.special_instructions}</p>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t text-sm text-muted-foreground">
                          {order.items.length} items • Completed {order.shopping_completed_at ? new Date(order.shopping_completed_at).toLocaleString() : 'recently'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
    </div>
  );
}