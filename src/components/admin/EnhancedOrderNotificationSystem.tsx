import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Users, Clock, Package, MapPin, Phone, Mail, CheckCircle2, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { realtimeManager } from "@/utils/realtimeConnectionManager";
import { notificationManager } from "@/utils/notificationManager";

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

export function EnhancedOrderNotificationSystem() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const { toast } = useToast();
  const { hasRole } = useAuth();

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('sysadmin')) return;

    fetchOrderNotifications();
    setupEnhancedRealtimeConnection();

    return () => {
      realtimeManager.unsubscribe('enhanced-admin-order-notifications');
    };
  }, [hasRole]);

  const setupEnhancedRealtimeConnection = async () => {
    try {
      await realtimeManager.subscribe({
        channelName: 'enhanced-admin-order-notifications',
        table: 'orders',
        event: 'INSERT',
        onMessage: handleNewOrderNotification,
        onError: (error) => {
          console.error('[EnhancedOrderNotifications] Connection error:', error);
          setConnectionStatus('disconnected');
          toast({
            title: "Connection Issue",
            description: "Real-time updates interrupted. Reconnecting...",
            variant: "destructive",
          });
        },
        onReconnect: () => {
          console.log('[EnhancedOrderNotifications] Reconnected successfully');
          setConnectionStatus('connected');
          fetchOrderNotifications(); // Refresh on reconnect
          toast({
            title: "Connected",
            description: "Real-time notifications restored",
          });
        },
        retryAttempts: 5,
        retryDelay: 2000
      });
      
      setConnectionStatus('connected');
    } catch (error) {
      console.error('[EnhancedOrderNotifications] Setup failed:', error);
      setConnectionStatus('disconnected');
    }
  };

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
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const transformedData = data?.map(order => ({
        ...order,
        items_count: order.order_items?.length || 0,
        order_items: order.order_items?.map(item => ({
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_name: item.products?.name || 'Unknown Product'
        })) || []
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

  const handleNewOrderNotification = async (payload: any) => {
    if (payload.eventType !== 'INSERT' || !payload.new) return;
    
    const order = payload.new;
    console.log('[EnhancedOrderNotifications] Processing new order:', order);
    
    try {
      // Fetch complete order data with items
      const { data: fullOrder, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            products (name)
          )
        `)
        .eq('id', order.id)
        .single();

      if (error) throw error;

      const orderWithItems = {
        ...fullOrder,
        items_count: fullOrder.order_items?.length || 0,
        order_items: fullOrder.order_items?.map(item => ({
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_name: item.products?.name || 'Unknown Product'
        })) || []
      };

      // Update state immediately
      setNotifications(prev => [orderWithItems, ...prev.slice(0, 9)]);
      
      // Show enhanced cross-browser notification
      notificationManager.showOrderNotification(orderWithItems);
      
      // Also show toast for immediate feedback
      toast({
        title: "🔔 New Order Received!",
        description: `Order from ${order.customer_name} - $${order.total_amount}`,
        duration: 8000,
      });
      
    } catch (error) {
      console.error('[EnhancedOrderNotifications] Error processing notification:', error);
      // Fallback to basic notification
      toast({
        title: "🔔 New Order Received!",
        description: `Order from ${order.customer_name}`,
        duration: 8000,
      });
    }
  };

  const markAsViewed = async (orderId: string) => {
    try {
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      setNotifications(prev => prev.filter(n => n.id !== orderId));
      
      toast({
        title: "Order Confirmed",
        description: "Order has been marked as viewed and confirmed",
      });
    } catch (error) {
      console.error('Error marking order as viewed:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'reconnecting':
        return <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>;
      case 'reconnecting':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Reconnecting...</Badge>;
      default:
        return <Badge variant="outline" className="text-red-600 border-red-600">Disconnected</Badge>;
    }
  };

  if (!hasRole('admin') && !hasRole('sysadmin')) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Order Notifications</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            {getConnectionStatus()}
          </div>
        </div>
        <CardDescription>
          Real-time notifications for new orders requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending orders at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{notification.customer_name}</span>
                      <Badge variant="secondary">${notification.total_amount}</Badge>
                      <Badge variant="outline">{notification.items_count} items</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {notification.customer_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {notification.customer_email}
                        </div>
                      )}
                      {notification.customer_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {notification.customer_phone}
                        </div>
                      )}
                      {notification.property_address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {notification.property_address}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(notification.created_at)}
                      </div>
                    </div>
                    
                    {notification.special_instructions && (
                      <div className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-200">
                        <strong>Special Instructions:</strong> {notification.special_instructions}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => markAsViewed(notification.id)}
                    size="sm"
                    className="ml-4"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Mark Viewed
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}