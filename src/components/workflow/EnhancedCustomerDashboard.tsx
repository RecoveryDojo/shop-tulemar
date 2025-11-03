import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  CheckCircle2, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  CreditCard,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useToast } from '@/hooks/use-toast';
import { useOrder } from '@/hooks/useOrder';
import { getStatusColor, getStatusLabel } from '@/lib/orderStatus';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from 'react-router-dom';
import { LazyImage } from '@/components/ui/lazy-image';
import { OrderMessaging } from '@/components/workflow/OrderMessaging';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'found' | 'substituted' | 'unavailable';
  substitution?: {
    product_name: string;
    reason: string;
    price_difference: number;
    image_url?: string;
  };
  photo_url?: string;
  notes?: string;
  products?: {
    image_url?: string;
  };
}

interface OrderTracking {
  id: string;
  order_number: string;
  status: string;
  shopper: {
    name: string;
    avatar?: string;
    rating: number;
    total_orders: number;
  };
  store_name: string;
  estimated_delivery: string;
  delivery_address: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  tip: number;
  total: number;
  special_instructions?: string;
}

export function EnhancedCustomerDashboard() {
  const [activeTab, setActiveTab] = useState('items');
  const { toast } = useToast();

  // Use unified order store with real-time updates  
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const { order: orderData, loading: orderLoading } = useOrder(activeOrderId || '');

  // Fetch customer's active orders
  useEffect(() => {
    const fetchActiveOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', user.email)
        .in('status', ['placed', 'claimed', 'shopping', 'ready', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (orders && orders.length > 0) {
        setActiveOrderId(orders[0].id);
      }
    };

    fetchActiveOrder();
  }, []);

  // Transform to expected format
  const order: OrderTracking | null = orderData ? {
    id: orderData.id,
    order_number: `ORD-${orderData.id.slice(-8)}`,
    status: orderData.status,
    shopper: {
      name: 'Maria Rodriguez',
      avatar: '/placeholder-avatar.jpg',
      rating: 4.96,
      total_orders: 247
    },
    store_name: 'Whole Foods Market - Downtown',
    estimated_delivery: '3:30 PM - 4:00 PM',
    delivery_address: orderData.property_address || '123 Oak Street, Apt 4B, Seattle, WA 98101',
    subtotal: orderData.total_amount * 0.8,
    tax: orderData.total_amount * 0.1,
    delivery_fee: 5.99,
    tip: orderData.total_amount * 0.15,
    total: orderData.total_amount,
    special_instructions: orderData.special_instructions,
    items: orderData.items.map(item => ({
      id: item.id,
      product_name: item.product?.name || 'Unknown Product',
      products: item.product ? { image_url: item.product.image_url } : undefined,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      status: item.shopping_status as any,
      substitution: item.substitution_data ? {
        product_name: item.substitution_data.suggested_product,
        reason: item.substitution_data.reason,
        price_difference: 0.50,
        image_url: '/placeholder-substitution.jpg'
      } : undefined,
      photo_url: item.photo_url,
      notes: item.shopper_notes
    }))
  } : null;

  const approveSubstitution = (itemId: string) => {
    if (!order) return;
    
    // In a real app, this would update the order via API
    toast({
      title: "Substitution Approved",
      description: "Substitution has been approved",
    });
  };

  if (orderLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Active Orders</h2>
            <p className="text-muted-foreground mb-6">
              You don't have any active orders at the moment.
            </p>
            <Button onClick={() => window.location.href = '/shop'}>
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Simplified 4-stage customer-friendly status display
  const getCustomerFriendlyStage = () => {
    if (order.status === 'placed') return 'confirmed';
    if (order.status === 'claimed' || order.status === 'shopping') return 'shopping';
    if (order.status === 'ready' || order.status === 'delivered') return 'delivered';
    if (order.status === 'closed') return 'ready';
    return 'confirmed';
  };

  const getStageLabel = (stage: string) => {
    const labels = {
      confirmed: 'Order Confirmed',
      shopping: 'Shopping Now',
      delivered: 'Delivered',
      ready: 'Ready for You'
    };
    return labels[stage as keyof typeof labels] || stage;
  };

  const getStageMessage = (stage: string) => {
    const messages = {
      confirmed: "Your order is confirmed! A shopper will be assigned soon.",
      shopping: "Your shopper is gathering your items right now.",
      delivered: "Your order has been delivered to your property!",
      ready: "Everything is stocked and ready for you!"
    };
    return messages[stage as keyof typeof messages] || '';
  };

  const currentStage = getCustomerFriendlyStage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-green-500/5">
      {/* Header - matches ShopNavigation */}
      <header className="h-16 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50 px-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-gradient-tropical p-2 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-foreground">Tulemar Shop</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Grocery Delivery</p>
          </div>
        </NavLink>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <NavLink to="/me">My Dashboard</NavLink>
          </Button>
          <NotificationDropdown userRole="client" />
          <UserProfileMenu />
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Simplified 4-Stage Status Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Order #{order.order_number}</h1>
              <Badge className={`${getStatusColor(order.status)}`}>
                {getStageLabel(currentStage)}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">{getStageMessage(currentStage)}</p>
          
          {/* 4-Stage Progress */}
          <div className="flex items-center justify-between gap-2">
            {['confirmed', 'shopping', 'delivered', 'ready'].map((stage, index) => {
              const stageIndex = ['confirmed', 'shopping', 'delivered', 'ready'].indexOf(stage);
              const currentIndex = ['confirmed', 'shopping', 'delivered', 'ready'].indexOf(currentStage);
              const isComplete = stageIndex <= currentIndex;
              
              return (
                <div key={stage} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isComplete
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center">{getStageLabel(stage)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-3">
          {order.items.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-4">
                  {/* Product Image */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                      {item.products?.image_url ? (
                        <LazyImage
                          src={item.products.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* Status Icon Overlay */}
                    {item.status === 'found' && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1 line-clamp-2">{item.product_name}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant={
                              item.status === 'found' ? 'default' :
                              item.status === 'substituted' ? 'secondary' :
                              item.status === 'pending' ? 'outline' :
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {item.status === 'found' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {item.status === 'pending' ? 'Shopping' : 
                             item.status === 'found' ? 'Found' :
                             item.status === 'substituted' ? 'Substitution' :
                             'Not Available'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg">{formatCurrency(item.total_price)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)} each</p>
                      </div>
                    </div>

                    {/* Shopper Notes */}
                    {item.notes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                        <p className="text-xs text-blue-900">
                          <span className="font-medium">Note: </span>{item.notes}
                        </p>
                      </div>
                    )}

                    {/* Substitution Section */}
                    {item.status === 'substituted' && item.substitution && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-3">
                          <div className="bg-amber-100 rounded-full p-1.5 flex-shrink-0">
                            <AlertCircle className="h-4 w-4 text-amber-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900 mb-1">Substitution Suggested</p>
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-amber-800 mb-1">
                                  {item.substitution.product_name}
                                </p>
                                <p className="text-xs text-amber-700 mb-1">
                                  {item.substitution.reason}
                                </p>
                                <p className="text-xs font-medium text-amber-900">
                                  Price difference: {item.substitution.price_difference > 0 ? '+' : ''}
                                  {formatCurrency(item.substitution.price_difference)}
                                </p>
                              </div>
                              {item.substitution.image_url && (
                                <LazyImage
                                  src={item.substitution.image_url}
                                  alt="Substitution"
                                  className="w-16 h-16 rounded-lg object-cover shadow-sm"
                                />
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => approveSubstitution(item.id)}
                                className="flex-1"
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                <ThumbsDown className="h-3 w-3 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Shopper Photo */}
                    {item.photo_url && item.status === 'found' && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Shopper's photo:</p>
                        <LazyImage
                          src={item.photo_url}
                          alt="Found item"
                          className="w-32 h-32 rounded-lg object-cover border-2 border-green-200 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Summary Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order Items</p>
                  <p className="text-lg font-semibold">
                    {order.items.length} items in order
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <OrderMessaging
            orderId={order.id}
            userRole="customer"
            userName={orderData?.customer_name}
          />
        </TabsContent>

        {/* Receipt Tab */}
        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-sm">
                      {item.product_name} x{item.quantity}
                    </span>
                    <span className="text-sm">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>{formatCurrency(order.tip)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Paid with •••• 4242</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
