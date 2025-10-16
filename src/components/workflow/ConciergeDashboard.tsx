import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  assigned_concierge_id: string | null;
}

interface ConciergeChecklist {
  order_id: string;
  arrived_at_property: boolean;
  pantry_stocked: boolean;
  fridge_stocked: boolean;
  freezer_stocked: boolean;
  photo_url: string | null;
  notes: string | null;
  updated_at: string;
}

export function ConciergeDashboard() {
  const [orders, setOrders] = useState<ConciergeOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<ConciergeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checklist, setChecklist] = useState<ConciergeChecklist | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [guestMessage, setGuestMessage] = useState("Welcome to your property! Your kitchen has been fully stocked with all your requested items. Everything is ready for your arrival. Have a wonderful stay!");
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      
      fetchOrders();
    };
    
    init();
    
    const channel = supabase
      .channel('concierge-ready-and-delivered-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: 'status=in.(ready,delivered)'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (activeOrder) {
      fetchChecklist(activeOrder.id);
    }
  }, [activeOrder]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['ready', 'delivered'])
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

  const fetchChecklist = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('concierge_checklist')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (error) throw error;
      setChecklist(data);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!activeOrder) return;
    setActionLoading(true);

    try {
      // rpc_advance_status will auto-assign concierge and create checklist
      const { data, error } = await supabase.rpc('rpc_advance_status', {
        p_order_id: activeOrder.id,
        p_to: 'delivered',
        p_expected_status: 'ready',
        p_actor_role: 'concierge'
      });

      if (error) throw error;

      toast({
        title: "Delivery Confirmed",
        description: "Order marked as delivered. Begin stocking.",
      });

      await fetchOrders();
      
      // Refresh activeOrder to get updated assigned_concierge_id
      const { data: refreshedOrder, error: refreshError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', activeOrder.id)
        .single();
      
      if (!refreshError && refreshedOrder) {
        setActiveOrder(refreshedOrder);
      }
      
      fetchChecklist(activeOrder.id);
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm delivery",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateChecklistField = async (field: string, value: any) => {
    if (!activeOrder) return;

    // Guard: only allow updates if assigned to current user
    if (!activeOrder.assigned_concierge_id || activeOrder.assigned_concierge_id !== currentUserId) {
      console.warn('Cannot update checklist: not assigned to current user');
      return;
    }

    try {
      const boolValue = value === true;
      const { error: upsertError } = await supabase
        .from('concierge_checklist')
        .upsert({
          order_id: activeOrder.id,
          [field]: boolValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'order_id'
        });

      if (upsertError) throw upsertError;

      // Log update event
      await supabase
        .from('new_order_events')
        .insert({
          order_id: activeOrder.id,
          event_type: 'CONCIERGE_CHECKLIST_UPDATED',
          actor_role: 'concierge',
          data: { field, value: boolValue }
        });

      fetchChecklist(activeOrder.id);
      
      toast({
        title: "Updated",
        description: "Checklist saved",
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist",
        variant: "destructive",
      });
    }
  };

  const handleSendWelcomeAndClose = async () => {
    if (!activeOrder || !guestMessage.trim()) return;
    setActionLoading(true);

    try {
      // 1. Insert guest notification
      await supabase
        .from('order_notifications')
        .insert({
          order_id: activeOrder.id,
          notification_type: 'guest_welcome',
          recipient_type: 'customer',
          recipient_identifier: activeOrder.customer_email,
          channel: 'email',
          status: 'pending',
          message_content: guestMessage,
          metadata: { 
            sent_by: 'concierge',
            sent_at: new Date().toISOString()
          }
        });

      // 2. Invoke notification orchestrator
      const { data: notifResult, error: notifError } = await supabase.functions.invoke('notification-orchestrator', {
        body: {
          orderId: activeOrder.id,
          notificationType: 'stocking_complete',
          phase: 'completion',
          source: 'concierge_dashboard',
          idempotencyKey: `stocking_complete:${activeOrder.id}`,
          payload: {
            guestMessage,
            checklist: checklist ?? null
          }
        }
      });

      if (notifError) {
        console.error('Notification orchestrator error:', notifError);
        toast({
          title: "Warning",
          description: "Order closed but notifications may not have been sent",
          variant: "destructive",
        });
      }

      // 3. Close order: delivered → closed
      const { data, error } = await supabase.rpc('rpc_advance_status', {
        p_order_id: activeOrder.id,
        p_to: 'closed',
        p_expected_status: 'delivered',
        p_actor_role: 'concierge'
      });

      if (error) throw error;

      toast({
        title: "Order Completed",
        description: "Guest notified and order closed successfully",
      });

      setActiveOrder(null);
      setGuestMessage("Welcome to your property! Your kitchen has been fully stocked with all your requested items. Everything is ready for your arrival. Have a wonderful stay!");
      setChecklist(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete order",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getChecklistProgress = () => {
    if (!checklist) return 0;
    return [
      checklist.arrived_at_property,
      checklist.pantry_stocked,
      checklist.fridge_stocked,
      checklist.freezer_stocked
    ].filter(Boolean).length;
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
      {/* Clean Header Bar */}
      <header className="h-16 flex items-center justify-between border-b border-border bg-primary/90 backdrop-blur sticky top-0 z-50 px-6">
        <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
          My Dashboard
        </Button>
        
        <UserProfileMenu />
        
        <NotificationDropdown userRole="concierge" onViewAll={() => {}} />
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Order Queue */}
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Orders Ready for Delivery & Completion
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
                  <div>No orders ready for delivery</div>
                  <div className="text-sm">Orders will appear here when ready or delivered</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Confirm Delivery (status = ready) */}
        {activeOrder?.status === 'ready' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Step 1: Confirm Delivery Received
              </CardTitle>
              <CardDescription>
                Order #{activeOrder.id.slice(0, 8)} for {activeOrder.customer_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Confirm that you've received the delivery items and are ready to begin stocking.
              </p>
              <Button 
                onClick={handleConfirmDelivery}
                className="w-full"
                size="lg"
                disabled={actionLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {actionLoading ? 'Confirming...' : 'Confirm Delivery Received'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Steps 2 & 3: Stocking Checklist and Welcome Guest (status = delivered) */}
        {activeOrder?.status === 'delivered' && (
          <>
            {/* Step 2: Kitchen Stocking Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Step 2: Kitchen Stocking Checklist
                </CardTitle>
                <CardDescription>
                  Track your stocking progress for {activeOrder.customer_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!activeOrder.assigned_concierge_id || activeOrder.assigned_concierge_id !== currentUserId ? (
                  <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <Info className="h-4 w-4 inline mr-2" />
                      Not assigned to you yet.
                    </p>
                  </div>
                ) : (
                  <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={checklist?.arrived_at_property || false}
                      onCheckedChange={(checked) => updateChecklistField('arrived_at_property', checked === true)}
                    />
                    <Label className="flex-1 cursor-pointer font-normal">
                      Arrived at property
                    </Label>
                    {checklist?.arrived_at_property && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={checklist?.pantry_stocked || false}
                      onCheckedChange={(checked) => updateChecklistField('pantry_stocked', checked === true)}
                    />
                    <Label className="flex-1 cursor-pointer font-normal">
                      Pantry items stocked (dry goods, spices, etc.)
                    </Label>
                    {checklist?.pantry_stocked && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={checklist?.fridge_stocked || false}
                      onCheckedChange={(checked) => updateChecklistField('fridge_stocked', checked === true)}
                    />
                    <Label className="flex-1 cursor-pointer font-normal">
                      Refrigerator items stocked (dairy, produce, etc.)
                    </Label>
                    {checklist?.fridge_stocked && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={checklist?.freezer_stocked || false}
                      onCheckedChange={(checked) => updateChecklistField('freezer_stocked', checked === true)}
                    />
                    <Label className="flex-1 cursor-pointer font-normal">
                      Freezer items stocked (frozen goods)
                    </Label>
                    {checklist?.freezer_stocked && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>

                <div>
                  <Label>Kitchen Photo (optional)</Label>
                  <Input
                    placeholder="Photo URL showing stocked kitchen"
                    value={checklist?.photo_url || ''}
                    onChange={(e) => updateChecklistField('photo_url', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any special arrangements or notes about the stocking"
                    value={checklist?.notes || ''}
                    onChange={(e) => updateChecklistField('notes', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Stocking Progress</span>
                    <span className="font-medium">
                      {getChecklistProgress()}/4 completed
                    </span>
                  </div>
                  <Progress value={(getChecklistProgress() / 4) * 100} />
                </div>
                </>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Welcome Guest & Close Order */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Step 3: Welcome Guest & Close Order
                </CardTitle>
                <CardDescription>
                  Send a welcome message and complete the order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send a welcome message to the guest and mark this order as complete.
                </p>

                <div>
                  <Label>Welcome Message</Label>
                  <Textarea
                    placeholder="Welcome message for the guest..."
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSendWelcomeAndClose}
                  className="w-full"
                  size="lg"
                  disabled={actionLoading || !guestMessage.trim()}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Sending...' : 'Send Welcome & Close Order'}
                </Button>
              </CardContent>
            </Card>
          </>
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