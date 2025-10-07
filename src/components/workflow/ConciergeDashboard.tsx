import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserProfileMenu } from "@/components/ui/UserProfileMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { 
  Home, 
  Package, 
  CheckCircle2, 
  MapPin,
  Users,
  ShoppingCart,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCommunicationWidget } from './FloatingCommunicationWidget';
import { useEnhancedOrderWorkflow } from '@/hooks/useEnhancedOrderWorkflow';
import { getStatusLabel, getStatusColor } from '@/lib/orderStatus';

interface ConciergeOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  property_address: string;
  arrival_date: string;
  guest_count: number;
  total_amount: number;
  status: string;
}

export function ConciergeDashboard() {
  const [orders, setOrders] = useState<ConciergeOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<ConciergeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMessage, setGuestMessage] = useState("");
  const { toast } = useToast();
  const { advanceStatus, loading: actionLoading } = useEnhancedOrderWorkflow();

  useEffect(() => {
    fetchOrders();
    
    // Simple realtime subscription for delivered orders
    const channel = supabase
      .channel('concierge-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.delivered'
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
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!activeOrder) return;

    try {
      // Advance to closed status
      await advanceStatus({ 
        orderId: activeOrder.id, 
        to: 'closed', 
        expectedStatus: 'delivered' 
      });

      // Send guest welcome notification
      if (guestMessage.trim()) {
        await supabase
          .from('new_order_events')
          .insert({
            order_id: activeOrder.id,
            event_type: 'GUEST_WELCOME_SENT',
            actor_role: 'concierge',
            data: { message: guestMessage }
          });
      }

      toast({
        title: "Order Completed",
        description: `Order marked as closed${guestMessage ? ' and guest notified' : ''}`,
      });

      setActiveOrder(null);
      setGuestMessage("");
      fetchOrders();
    } catch (error) {
      console.error('Error completing order:', error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-blue-500/5">
      {/* Branded Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white">
        <div className="border-b border-white/20 bg-black/10">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-white">Tulemar Shop</h1>
                  <p className="text-xs text-white/80">Premium Grocery Delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <NotificationDropdown userRole="concierge" onViewAll={() => {}} />
                <UserProfileMenu />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Guide
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Concierge Dashboard</h1>
                  <p className="text-white/80 text-lg">Finalize deliveries and welcome guests</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white">
                <Home className="h-5 w-5" />
                <span className="font-bold text-lg">{orders.length}</span>
                <span className="text-sm text-white/80">Properties</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-4 bg-gradient-to-b from-transparent to-background/20"></div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Order Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivered Orders Ready to Close
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
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {order.property_address}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {order.guest_count} guests
                        </span>
                        <span>Arrival: {new Date(order.arrival_date).toLocaleDateString()}</span>
                        <span>${order.total_amount.toFixed(2)}</span>
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
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div>No delivered orders</div>
                  <div className="text-sm">Orders will appear here when delivered</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Order Completion */}
        {activeOrder && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Complete Order & Welcome Guest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Customer</div>
                  <div>{activeOrder.customer_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Property</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {activeOrder.property_address}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Arrival Date</div>
                  <div>{new Date(activeOrder.arrival_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Guest Count</div>
                  <div>{activeOrder.guest_count} guests</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Guest Welcome Message (Optional)</div>
                <Textarea
                  placeholder="Welcome message for the guest (e.g., property tips, local recommendations, emergency contacts)"
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleCompleteOrder}
                className="w-full"
                size="lg"
                disabled={actionLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {actionLoading ? 'Completing...' : 'Mark Order as Closed'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <FloatingCommunicationWidget
        orderId={activeOrder?.id}
        orderPhase="delivery"
        stakeholders={[]}
        unreadCount={0}
      />
    </div>
  );
}
