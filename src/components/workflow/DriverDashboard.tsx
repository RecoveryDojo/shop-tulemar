import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserProfileMenu } from "@/components/ui/UserProfileMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Navigation,
  Phone,
  MessageSquare,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Info,
  ChefHat
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCommunicationWidget } from './FloatingCommunicationWidget';
import { useEnhancedOrderWorkflow } from '@/hooks/useEnhancedOrderWorkflow';

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
  estimated_delivery_time?: string;
  pickup_location?: string;
}

export function DriverDashboard() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeRoute, setActiveRoute] = useState<DeliveryOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const {
    advanceStatus
  } = useEnhancedOrderWorkflow();

  // Mock stakeholders for communication
  const mockStakeholders = [
    { id: 'store-mgr-1', name: 'Store Manager', role: 'store_manager', status: 'online' as const },
    { id: 'shopper-1', name: 'Shopper', role: 'shopper', status: 'offline' as const },
    { id: 'concierge-1', name: 'Concierge', role: 'concierge', status: 'online' as const },
    { id: 'customer-1', name: currentOrder?.customer_name || 'Customer', role: 'customer', status: 'away' as const }
  ];

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get orders that are ready for delivery or being delivered
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['packed', 'in_transit', 'delivered']);

      if (error) throw error;
      setOrders(ordersData || []);

      // Group orders into active route (packed or in_transit)
      const routeOrders = ordersData?.filter(o => 
        ['packed', 'in_transit'].includes(o.status)
      ) || [];
      setActiveRoute(routeOrders);

      // Set current order being delivered
      const currentDelivery = routeOrders.find(o => o.status === 'in_transit');
      if (currentDelivery) {
        setCurrentOrder(currentDelivery);
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

  const startDelivery = async (orderId: string) => {
    try {
      await advanceStatus({ orderId, to: 'delivered', expectedStatus: 'ready' });
      fetchDeliveryOrders();
    } catch (error) {
      console.error('Error starting delivery:', error);
    }
  };

  const completeDelivery = async (orderId: string) => {
    try {
      await advanceStatus({ orderId, to: 'closed', expectedStatus: 'delivered' });
      setCurrentOrder(null);
      setDeliveryNotes(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      fetchDeliveryOrders();
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  const reportDelay = async (orderId: string, reason: string, newEta: string) => {
    try {
      // Send delay notification
      await supabase.functions.invoke('notification-orchestrator', {
        body: {
          orderId,
          notificationType: 'delay_notification',
          phase: 'delivery',
          metadata: { reason, newEta }
        }
      });

      // Log the delay
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: orderId,
          phase: 'delivery',
          action: 'delay_reported',
          notes: `Delay reported: ${reason}. New ETA: ${newEta}`,
          metadata: { reason, newEta }
        });

      toast({
        title: "Delay Reported",
        description: "Customer and stakeholders have been notified",
      });
    } catch (error) {
      console.error('Error reporting delay:', error);
    }
  };

  const optimizeRoute = () => {
    // Simple route optimization by address proximity (would use real mapping API)
    const optimized = [...activeRoute].sort((a, b) => 
      a.property_address.localeCompare(b.property_address)
    );
    setActiveRoute(optimized);
    
    toast({
      title: "Route Optimized",
      description: "Delivery order updated for efficiency",
    });
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
      {/* Branded Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Truck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Driver Dashboard</h1>
              <p className="text-white/80">Manage delivery routes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown userRole="driver" onViewAll={() => {}} />
            <UserProfileMenu />
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {activeRoute.length > 1 && (
          <Button variant="outline" size="sm" onClick={optimizeRoute}>
            <Navigation className="h-4 w-4 mr-2" />
            Optimize Route
          </Button>
        )}

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
                    value={deliveryNotes[currentOrder.id] || ''}
                    onChange={(e) => setDeliveryNotes(prev => ({
                      ...prev,
                      [currentOrder.id]: e.target.value
                    }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => reportDelay(currentOrder.id, "Traffic delay", "30 minutes")}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Report Delay
                  </Button>
                </div>

                <Button 
                  onClick={() => completeDelivery(currentOrder.id)}
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {loading ? 'Completing...' : 'Mark as Delivered'}
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
            {/* Show newly assigned deliveries that need acceptance */}
            {orders.filter(o => o.status === 'packed' && !activeRoute.some(ao => ao.id === o.id)).map((order) => (
              <div key={order.id} className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-medium">
                      !
                    </div>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {order.property_address}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${order.total_amount.toFixed(2)} • {order.guest_count} guests • Ready for pickup
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-yellow-100 border-yellow-400 text-yellow-800">
                      Needs Acceptance
                    </Badge>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setActiveRoute(prev => [...prev, order]);
                        toast({
                          title: "Delivery Accepted",
                          description: "Order added to your delivery route",
                        });
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Accept Delivery'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {activeRoute.map((order, index) => (
              <div 
                key={order.id}
                className={`p-4 border rounded-lg ${
                  currentOrder?.id === order.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                }`}
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
                  
                  <div className="flex items-center gap-3">
                     <Badge variant={order.status === 'in_transit' ? 'default' : 'secondary'}>
                       {order.status.replace('_', ' ')}
                     </Badge>
                    
                     {order.status === 'packed' && (
                       <Button 
                         size="sm"
                         onClick={() => startDelivery(order.id)}
                         className="bg-blue-600 hover:bg-blue-700"
                         disabled={loading}
                       >
                         {loading ? 'Starting...' : 'Start Delivery'}
                       </Button>
                     )}
                  </div>
                </div>
              </div>
            ))}
            
            {activeRoute.length === 0 && orders.filter(o => o.status === 'packed').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <div>No deliveries scheduled</div>
                <div className="text-sm">Orders will appear here when ready for pickup</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orders
              .filter(o => o.status === 'delivered')
              .slice(0, 5)
              .map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{order.property_address}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Delivered
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      ${order.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Floating Communication Widget */}
      <FloatingCommunicationWidget
        orderId={currentOrder?.id}
        orderPhase="delivery"
        stakeholders={mockStakeholders}
        unreadCount={1}
      />
      </div>
    </div>
  );
}