import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Users, Clock, Package, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrderNotification {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  property_address?: string;
  total_amount: number;
  items_count: number;
  created_at: string;
  status: string;
  special_instructions?: string;
  order_items: Array<{
    quantity: number;
    product_name: string;
    unit_price: number;
  }>;
}

export function OrderNotificationSystem() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { hasRole } = useAuth();

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('sysadmin')) return;

    fetchOrderNotifications();
    
    // Set up real-time subscription for new orders
    const subscription = supabase
      .channel('admin-order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          handleNewOrderNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrderNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            products (name)
          )
        `)
        .in('status', ['placed'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const transformedData = data?.map(order => ({
        ...order,
        items_count: order.order_items?.length || 0,
        order_items: order.order_items?.map(item => {
          const products = (item.products ?? {}) as { name?: string };
          const itemData = item as any;
          return {
            quantity: item.quantity,
            unit_price: item.unit_price,
            product_name: products.name || itemData.product_name || 'Unknown Product'
          };
        }) || []
      })) || [];

      setNotifications(transformedData);
    } catch (error) {
      console.error('Error fetching order notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrderNotification = (newOrder: any) => {
    // Show immediate notification
    toast({
      title: "🔔 New Order Received!",
      description: `Order from ${newOrder.customer_name} - $${newOrder.total_amount}`,
      duration: 10000,
    });

    // Refresh notifications
    fetchOrderNotifications();
  };

  const markAsViewed = async (orderId: string) => {
    try {
      // Update order to show it's been viewed by admin
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      // Remove from notifications
      setNotifications(prev => prev.filter(n => n.id !== orderId));
      
      toast({
        title: "Order Confirmed",
        description: "Order has been marked as viewed and confirmed",
      });
    } catch (error) {
      console.error('Error marking order as viewed:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (!hasRole('admin') && !hasRole('sysadmin')) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Order Notifications
          {notifications.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          New orders requiring admin attention and staff assignment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>All orders have been reviewed</p>
            <p className="text-sm">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{notification.customer_name}</h3>
                      <Badge variant="outline">{notification.status}</Badge>
                      <Badge variant="secondary">${notification.total_amount}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {notification.customer_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{notification.customer_email}</span>
                        </div>
                      )}
                      
                      {notification.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{notification.customer_phone}</span>
                        </div>
                      )}
                      
                      {notification.property_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{notification.property_address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{notification.items_count} items</span>
                      <span className="text-xs text-muted-foreground">
                        {notification.order_items.slice(0, 3).map(item => item.product_name).join(', ')}
                        {notification.order_items.length > 3 && '...'}
                      </span>
                    </div>

                    {notification.special_instructions && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Special Instructions:</strong> {notification.special_instructions}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => markAsViewed(notification.id)}
                      className="shrink-0"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}