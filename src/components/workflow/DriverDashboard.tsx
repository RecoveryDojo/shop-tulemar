import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserProfileMenu } from "@/components/ui/UserProfileMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { 
  Truck, 
  MapPin, 
  CheckCircle2,
  Phone,
  MessageSquare,
  Camera,
  ShoppingCart
} from "lucide-react";
import { NavLink } from 'react-router-dom';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { OrderMessaging } from '@/components/workflow/OrderMessaging';
import { supabase } from "@/integrations/supabase/client";
import { FloatingCommunicationWidget } from './FloatingCommunicationWidget';
import { useEnhancedOrderWorkflow } from '@/hooks/useEnhancedOrderWorkflow';
import { getStatusLabel, getStatusColor } from '@/lib/orderStatus';

interface DeliveryOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  property_address: string;
  arrival_date: string;
  guest_count: number;
  special_instructions: string;
  total_amount: number;
  status: string;
}

export function DriverDashboard() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const { toast } = useToast();
  const { advanceStatus, loading: actionLoading } = useEnhancedOrderWorkflow();

  useEffect(() => {
    fetchOrders();
    
    // Simple realtime subscription for ready orders
    const channel = supabase
      .channel('driver-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.ready'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'ready')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
      
      // Auto-select first order if none selected
      if (!currentOrder && data && data.length > 0) {
        setCurrentOrder(data[0]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!currentOrder) return;

    try {
      // Advance to delivered status
      await advanceStatus({ 
        orderId: currentOrder.id, 
        to: 'delivered', 
        expectedStatus: 'ready' 
      });

      // Log delivery notes as event if provided
      if (deliveryNotes.trim()) {
        await supabase
          .from('new_order_events')
          .insert({
            order_id: currentOrder.id,
            event_type: 'DELIVERY_NOTES_ADDED',
            actor_role: 'driver',
            data: { notes: deliveryNotes }
          });
      }

      toast({
        title: "Delivery Complete",
        description: "Order marked as delivered",
      });

      setCurrentOrder(null);
      setDeliveryNotes("");
      fetchOrders();
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-green-500/5 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-muted rounded w-64 mx-auto"></div>
          <div className="h-32 bg-muted rounded w-96 mx-auto"></div>
        </div>
      </div>
    );
  }

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
          <UserProfileMenu />
          <NotificationDropdown userRole="driver" />
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Current Delivery */}
        {currentOrder && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Truck className="h-5 w-5" />
                Current Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium">Customer</div>
                      <div className="text-lg">{currentOrder.customer_name}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Delivery Address</div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <div>{currentOrder.property_address}</div>
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            Open in Maps
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium">Guests</div>
                        <div>{currentOrder.guest_count}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Order Total</div>
                        <div>${currentOrder.total_amount.toFixed(2)}</div>
                      </div>
                    </div>

                    {currentOrder.special_instructions && (
                      <div>
                        <div className="text-sm font-medium">Special Instructions</div>
                        <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                          {currentOrder.special_instructions}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Contact Customer</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Text
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Delivery Notes</div>
                    <Textarea
                      placeholder="Add notes about the delivery, access instructions, etc."
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Photo
                    </Button>
                  </div>

                  <Button 
                    onClick={handleCompleteDelivery}
                    className="w-full"
                    size="lg"
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {actionLoading ? 'Completing...' : 'Mark as Delivered'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.map((order, index) => (
                <div 
                  key={order.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    currentOrder?.id === order.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentOrder(order)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {order.property_address}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${order.total_amount.toFixed(2)} • {order.guest_count} guests
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {orders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div>No deliveries scheduled</div>
                  <div className="text-sm">Orders will appear here when ready for delivery</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <FloatingCommunicationWidget
        orderId={currentOrder?.id}
        orderPhase="delivery"
        stakeholders={[]}
        unreadCount={0}
      />
    </div>
  );
}
