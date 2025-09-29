import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Package,
  MessageSquare,
  Scan
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrderItems } from '@/data/views';
import type { OrderItemView } from '@/types/db-views';
import { useEnhancedOrderWorkflow } from "@/hooks/useEnhancedOrderWorkflow";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    name: string;
    unit: string;
    category_id: string;
  };
  status?: 'pending' | 'found' | 'substitution_needed' | 'not_available';
  substitution?: {
    product_name: string;
    price: number;
    reason: string;
    image_url?: string;
  };
}

interface ShoppingOrder {
  id: string;
  customer_name: string;
  guest_count: number;
  arrival_date: string;
  special_instructions: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
}

export function ShopperDashboard() {
  const [orders, setOrders] = useState<ShoppingOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<ShoppingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const {
    acceptOrder: enhancedAcceptOrder,
    startShopping: enhancedStartShopping,
    pickItem: enhancedPickItem,
    suggestSub: enhancedSuggestSub
  } = useEnhancedOrderWorkflow();

  useEffect(() => {
    fetchAssignedOrders();
  }, []);

  const fetchAssignedOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get orders assigned to current user as shopper
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(name, unit, category_id)
          )
        `)
        .eq('assigned_shopper_id', user.id)
        .in('status', ['confirmed', 'assigned', 'shopping', 'packed']);

      if (error) throw error;
      
      const formattedOrders = ordersData?.map(order => ({
        ...order,
        items: order.order_items?.map(item => {
          const products = (item.products ?? {}) as { name?: string; unit?: string; category_id?: string };
          return {
            id: item.id,
            product_id: item.product_id || '',
            quantity: item.quantity || item.qty || 0,
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
            product: {
              name: products.name || item.product_name || 'Unknown Product',
              unit: products.unit || item.product_unit || 'each',
              category_id: products.category_id || item.product_category_id || ''
            }
          };
        }) || []
      })) || [];
      
      setOrders(formattedOrders);
      
      // Set first shopping order as active
      const shoppingOrder = formattedOrders.find(o => o.status === 'shopping');
      if (shoppingOrder) {
        setActiveOrder(shoppingOrder);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assigned orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      await enhancedAcceptOrder(orderId, (order?.status || 'pending') as any);
      fetchAssignedOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const startShopping = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      await enhancedStartShopping(orderId, (order?.status || 'assigned') as any);
      fetchAssignedOrders();
    } catch (error) {
      console.error('Error starting shopping:', error);
    }
  };

  const markItemFound = async (itemId: string) => {
    try {
      const order = orders.find(o => o.items.some(i => i.id === itemId));
      if (!order) throw new Error('Order not found');
      
      await enhancedPickItem({ 
        orderId: order.id,
        itemId, 
        qtyPicked: 1, 
        expectedStatus: order.status as any,
        notes: itemNotes[itemId] || '' 
      });
      fetchAssignedOrders();
    } catch (error) {
      console.error('Error marking item found:', error);
    }
  };

  const requestSubstitution = async (itemId: string, reason: string) => {
    try {
      const order = orders.find(o => o.items.some(i => i.id === itemId));
      if (!order) throw new Error('Order not found');
      
      await enhancedSuggestSub({ 
        orderId: order.id,
        itemId, 
        reason,
        expectedStatus: order.status as any,
        notes: itemNotes[itemId] || '' 
      });
      fetchAssignedOrders();
    } catch (error) {
      console.error('Error requesting substitution:', error);
    }
  };

  const completeOrder = async () => {
    if (!activeOrder) return;

    try {
      const { data, error } = await supabase.functions.invoke('enhanced-order-workflow', {
        body: {
          action: 'complete_shopping',
          orderId: activeOrder.id
        }
      });

      if (error) throw error;

      toast({
        title: "Order Complete",
        description: "Items packed and ready for delivery",
      });

      setActiveOrder(null);
      fetchAssignedOrders();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: "Failed to complete order",
        variant: "destructive",
      });
    }
  };

  const getCompletionPercentage = (items: OrderItem[]) => {
    const completedItems = items.filter(item => 
      item.status === 'found' || item.status === 'substitution_needed'
    ).length;
    return Math.round((completedItems / items.length) * 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shopper Dashboard</h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          {orders.length} Active Orders
        </Badge>
      </div>

      {/* Order Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  activeOrder?.id === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setActiveOrder(order)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} items • ${order.total_amount.toFixed(2)} • {order.guest_count} guests
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Arrival: {new Date(order.arrival_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={order.status === 'shopping' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                    {order.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          startShopping(order.id);
                        }}
                      >
                        Start Shopping
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Shopping Order */}
      {activeOrder && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Shopping List</span>
                <Progress 
                  value={getCompletionPercentage(activeOrder.items)} 
                  className="w-24"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrder.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.product?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} {item.product?.unit} • ${item.unit_price.toFixed(2)} each
                        </div>
                        {item.status === 'substitution_needed' && item.substitution && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="text-sm font-medium text-yellow-800">
                              Substitution: {item.substitution.product_name}
                            </div>
                            <div className="text-xs text-yellow-600">
                              {item.substitution.reason}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'found' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Found
                          </Badge>
                        ) : item.status === 'substitution_needed' ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markItemFound(item.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                requestSubstitution(item.id, "Original brand not available");
                              }}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {getCompletionPercentage(activeOrder.items) === 100 && (
                <div className="mt-6">
                  <Separator className="mb-4" />
                  <Button 
                    onClick={completeOrder}
                    className="w-full"
                    size="lg"
                  >
                    Complete Order & Pack Items
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Order Details & Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">Customer</div>
                <div className="text-muted-foreground">{activeOrder.customer_name}</div>
              </div>

              <div>
                <div className="text-sm font-medium">Guest Count</div>
                <div className="text-muted-foreground">{activeOrder.guest_count} guests</div>
              </div>

              <div>
                <div className="text-sm font-medium">Arrival Date</div>
                <div className="text-muted-foreground">
                  {new Date(activeOrder.arrival_date).toLocaleDateString()}
                </div>
              </div>

              {activeOrder.special_instructions && (
                <div>
                  <div className="text-sm font-medium">Special Instructions</div>
                  <div className="text-muted-foreground text-sm">
                    {activeOrder.special_instructions}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <div className="text-sm font-medium mb-2">Shopping Notes</div>
                <Textarea
                  placeholder="Add notes about shopping experience, substitutions, or any issues..."
                  value={itemNotes[activeOrder.id] || ''}
                  onChange={(e) => setItemNotes(prev => ({
                    ...prev,
                    [activeOrder.id]: e.target.value
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button variant="outline" size="sm">
                  <Scan className="h-4 w-4 mr-2" />
                  Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}