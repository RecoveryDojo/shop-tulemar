import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById, getOrderItems } = useOrders();
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      try {
        const [orderData, itemsData] = await Promise.all([
          getOrderById(orderId),
          getOrderItems(orderId)
        ]);
        
        setOrder(orderData);
        setOrderItems(itemsData);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <ShopLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">Loading order details...</div>
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (!order) {
    return (
      <ShopLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The order you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/categories">
              <Button className="bg-gradient-tropical hover:opacity-90 text-white">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your order. We'll start preparing your groceries right away.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Info */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Order Number:</span>
                    <span className="font-medium text-foreground">#{order.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Order Date:</span>
                    <span className="font-medium text-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-bold text-primary text-lg">
                      ${order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Items Ordered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderItems.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{item.products?.name || 'Product'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × ${item.unit_price.toFixed(2)}
                            {item.products?.unit && ` per ${item.products.unit}`}
                          </p>
                          {item.products?.origin && (
                            <p className="text-xs text-primary">From: {item.products.origin}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-foreground">
                            ${item.total_price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              {order.property_address && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-muted-foreground">Delivery Address:</span>
                      <p className="font-medium text-foreground mt-1">{order.property_address}</p>
                    </div>
                    {order.arrival_date && (
                      <div>
                        <span className="text-muted-foreground">Arrival Date:</span>
                        <p className="font-medium text-foreground">{order.arrival_date}</p>
                      </div>
                    )}
                    {order.guest_count && (
                      <div>
                        <span className="text-muted-foreground">Number of Guests:</span>
                        <p className="font-medium text-foreground">{order.guest_count}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* What's Next Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-border sticky top-4">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    What's Next?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-foreground">Order Confirmed</p>
                        <p className="text-sm text-muted-foreground">We've received your order</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-foreground">Preparing Order</p>
                        <p className="text-sm text-muted-foreground">We're gathering your items</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-foreground">Out for Delivery</p>
                        <p className="text-sm text-muted-foreground">2-4 hours delivery window</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-foreground">Delivered</p>
                        <p className="text-sm text-muted-foreground">Enjoy your groceries!</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">Confirmation sent to {order.customer_email}</span>
                      </div>
                      {order.customer_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">Updates via {order.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <Link to="/categories">
                      <Button className="w-full bg-gradient-tropical hover:opacity-90 text-white">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}