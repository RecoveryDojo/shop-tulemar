import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Truck, Clock, CheckCircle, User, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  property_address: string;
  arrival_date: string;
  departure_date: string;
  guest_count: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  assigned_shopper_id?: string;
  shopping_started_at?: string;
  shopping_completed_at?: string;
  delivery_started_at?: string;
  delivery_completed_at?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  shopping_status: string;
  found_quantity: number;
  shopper_notes?: string;
  product?: {
    name: string;
    image_url: string;
    unit: string;
  };
}

interface WorkflowLog {
  id: string;
  phase: string;
  action: string;
  new_status: string;
  timestamp: string;
  notes?: string;
}

const OrderTrack = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        if (!token) {
          throw new Error('Order token is required');
        }

        // Fetch order using access token
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('access_token', token)
          .single();

        if (orderError) {
          console.error('Order fetch error:', orderError);
          throw new Error('Order not found');
        }

        setOrder(orderData);

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            product:products(name, image_url, unit)
          `)
          .eq('order_id', orderData.id);

        if (itemsError) {
          console.error('Items fetch error:', itemsError);
        } else {
          setOrderItems(itemsData || []);
        }

        // Fetch workflow logs
        const { data: logsData, error: logsError } = await supabase
          .from('order_workflow_log')
          .select('*')
          .eq('order_id', orderData.id)
          .order('timestamp', { ascending: false });

        if (logsError) {
          console.error('Logs fetch error:', logsError);
        } else {
          setWorkflowLogs(logsData || []);
        }

      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load order details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [token, toast]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'assigned': return 'default';
      case 'shopping': return 'default';
      case 'packed': return 'default';
      case 'in_transit': return 'default';
      case 'delivered': return 'default';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  const getShoppingProgress = () => {
    if (orderItems.length === 0) return 0;
    const completedItems = orderItems.filter(item => 
      item.shopping_status === 'found' || item.shopping_status === 'substitution_approved'
    ).length;
    return Math.round((completedItems / orderItems.length) * 100);
  };

  if (loading) {
    return (
      <ShopLayout>
        <div className="container max-w-4xl mx-auto py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (!order) {
    return (
      <ShopLayout>
        <div className="container max-w-4xl mx-auto py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground">
            Please check your order tracking link or contact support.
          </p>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Tracking</h1>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Order Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Order Confirmed */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${order.status !== 'pending' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Order Confirmed</p>
                    <p className="text-sm text-muted-foreground">Payment received and order confirmed</p>
                  </div>
                </div>

                {/* Shopper Assigned */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${order.assigned_shopper_id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Shopper Assigned</p>
                    <p className="text-sm text-muted-foreground">
                      {order.assigned_shopper_id ? 'Personal shopper has been assigned' : 'Waiting for shopper assignment'}
                    </p>
                  </div>
                </div>

                {/* Shopping in Progress */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${order.shopping_started_at ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Shopping in Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shopping_started_at ? `${getShoppingProgress()}% complete` : 'Shopping not started yet'}
                    </p>
                  </div>
                </div>

                {/* Delivery */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${order.delivery_started_at ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Out for Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {order.delivery_completed_at ? 'Delivered' : 
                       order.delivery_started_at ? 'On the way to your property' : 
                       'Delivery will begin after shopping is complete'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Delivery Address</p>
                <p className="text-sm text-muted-foreground">{order.property_address}</p>
              </div>
              <div>
                <p className="font-medium">Guest Information</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer_name} • {order.guest_count} guests
                </p>
              </div>
              <div>
                <p className="font-medium">Stay Duration</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.arrival_date).toLocaleDateString()} - {new Date(order.departure_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="font-medium">Order Total</p>
                <p className="text-lg font-bold">${order.total_amount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        {orderItems.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ordered: {item.quantity} {item.product?.unit}
                        </p>
                        {item.found_quantity > 0 && item.found_quantity !== item.quantity && (
                          <p className="text-sm text-orange-600">
                            Found: {item.found_quantity} {item.product?.unit}
                          </p>
                        )}
                        {item.shopper_notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Note: {item.shopper_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.shopping_status === 'found' ? 'default' : 'secondary'}>
                        {item.shopping_status === 'found' ? 'Found' : 
                         item.shopping_status === 'substitution_needed' ? 'Substitution' :
                         item.shopping_status === 'not_found' ? 'Not Found' : 'Pending'}
                      </Badge>
                      <p className="text-sm font-medium mt-1">${item.total_price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Log */}
        {workflowLogs.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Order Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowLogs.map((log, index) => (
                  <div key={log.id}>
                    <div className="flex gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                        )}
                      </div>
                    </div>
                    {index < workflowLogs.length - 1 && <Separator className="ml-6 mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Questions about your order? Contact us at{' '}
            <a href="mailto:support@grocerydelivery.com" className="text-primary hover:underline">
              support@grocerydelivery.com
            </a>{' '}
            or{' '}
            <a href="tel:+1234567890" className="text-primary hover:underline">
              (123) 456-7890
            </a>
          </p>
        </div>
      </div>
    </ShopLayout>
  );
};

export default OrderTrack;