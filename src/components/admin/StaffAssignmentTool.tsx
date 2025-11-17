import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, Clock, Star, MapPin, Phone, CheckCircle2, AlertCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StaffMember {
  id: string;
  display_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: string;
  roles: string[];
  stats: {
    orders_completed: number;
    rating: number;
    response_time: string;
    availability: 'available';
  };
}

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  items_count: number;
  assigned_stakeholders: Array<{
    role: string;
    user_id: string;
    user_name: string;
    status: string;
  }>;
}

export function StaffAssignmentTool() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [assigningStaff, setAssigningStaff] = useState<{[key: string]: boolean}>({});
  const [pendingNotifications, setPendingNotifications] = useState<Array<{staffId: string, orderId: string, role: string, staffName: string}>>([]);
  const { toast } = useToast();
  const { hasRole, user } = useAuth();

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('sysadmin')) return;
    
    fetchStaffMembers();
    fetchAvailableOrders();
    
    // Set up real-time subscription for stakeholder assignments
    const channel = supabase
      .channel('stakeholder_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stakeholder_assignments'
        },
        () => {
          console.log('Stakeholder assignment changed, refreshing orders...');
          fetchAvailableOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          email,
          phone,
          avatar_url,
          status,
          bio,
          contact_hours
        `)
        .not('display_name', 'is', null);

      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      console.log('Fetched profiles:', profiles);
      console.log('Fetched user roles:', userRoles);

      // Filter out fake/bot profiles and test-bot.com emails
      const realProfiles = profiles?.filter(profile => {
        const name = profile.display_name?.toLowerCase() || '';
        const email = profile.email?.toLowerCase() || '';
        // Filter out obvious bot/fake accounts and test-bot.com emails
        return !name.includes('bot') && 
               !name.includes('test') && 
               !name.includes('fake') &&
               !email.includes('test-bot.com') &&
               name.length > 0;
      }) || [];

      // Filter out clients - only show staff roles
      const staffProfiles = realProfiles.filter(profile => {
        const roles = userRoles?.filter(ur => ur.user_id === profile.id)?.map(ur => ur.role) || [];
        // Only include profiles that have staff roles (exclude client-only users)
        return roles.some(role => ['shopper', 'driver', 'concierge', 'store_manager', 'admin', 'sysadmin'].includes(role));
      });

      const staff: StaffMember[] = staffProfiles.map(profile => {
        const roles = userRoles
          ?.filter(ur => ur.user_id === profile.id)
          ?.map(ur => ur.role) || [];
        
        return {
          id: profile.id,
          display_name: profile.display_name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          status: profile.status || 'available',
          roles,
          stats: {
            orders_completed: 0,
            rating: 5.0,
            response_time: '5m',
            availability: 'available' as const
          }
        };
      });

      setStaff(staff);
      // Refresh orders to ensure display names are attached to assignments
      fetchAvailableOrders();
      toast({
        title: "Staff loaded",
        description: `Found ${staff.length} staff members`,
      });
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error loading staff",
        description: error.message || "Failed to load staff members",
        variant: "destructive",
      });
      setStaff([]);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      // First, fetch orders with basic info only to avoid complex joins
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_email,
          status,
          total_amount,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched orders:', orders);
      
      if (!orders || orders.length === 0) {
        toast({
          title: "No orders found",
          description: "There are no orders in the system yet.",
          variant: "destructive",
        });
        setOrders([]);
        setLoading(false);
        return;
      }

      // Then fetch stakeholder assignments separately for each order
      const ordersWithAssignments = await Promise.all(
        orders.map(async (order) => {
          const { data: assignments } = await supabase
            .from('stakeholder_assignments')
            .select('id,user_id,role,status,accepted_at')
            .eq('order_id', order.id);

          // Count items using SECURITY DEFINER RPC (admin-only) to bypass RLS safely
          let totalItems = 0;
          try {
            const { data: counts, error: countsError } = await supabase
              .rpc('admin_order_item_counts', { p_order_id: order.id });
            if (countsError) throw countsError;
            totalItems = counts?.[0]?.total ?? 0;
          } catch (err) {
            console.warn('Item count RPC failed for order', order.id, err);
            totalItems = 0; // Fallback on error
          }

          return {
            id: order.id,
            customer_name: order.customer_name,
            total_amount: order.total_amount,
            status: order.status,
            created_at: order.created_at,
            items_count: totalItems,
            assigned_stakeholders: assignments?.map((sa: any) => ({
              role: sa.role,
              user_id: sa.user_id,
              user_name: (staff.find(s => s.id === sa.user_id)?.display_name) || 'Unknown',
              status: sa.status
            })) || []
          };
        })
      );

      setOrders(ordersWithAssignments);
      toast({
        title: "Orders loaded",
        description: `Found ${ordersWithAssignments.length} orders`,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error loading orders",
        description: error.message || "Failed to load orders",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const assignStaffToOrder = async (staffId: string, orderId: string, role: string) => {
    const assignmentKey = `${staffId}-${role}`;
    setAssigningStaff(prev => ({ ...prev, [assignmentKey]: true }));
    
    try {
      const selectedStaff = staff.find(s => s.id === staffId);
      const selectedOrderData = orders.find(o => o.id === orderId);
      
      if (!selectedStaff || !selectedOrderData) {
        throw new Error('Staff member or order not found');
      }

      // Enhanced assignment with role-specific updates
      if (role === 'shopper') {
        // Use RPC for shopper assignment (ensures atomic status transition)
        const { error: rpcError } = await supabase.rpc('rpc_assign_shopper', {
          p_order_id: orderId,
          p_shopper_id: staffId,
          p_expected_status: selectedOrderData.status,
          p_actor_role: 'admin'
        });

        if (rpcError) throw rpcError;
      } else if (role === 'concierge') {
        // For concierge, use direct update (no canonical RPC yet)
        const updateData: any = {
          assigned_concierge_id: staffId
        };

        // If order was PLACED and we're assigning first staff, move to CLAIMED
        if (selectedOrderData.status === 'placed') {
          updateData.status = 'claimed';
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Insert concierge assignment audit event
        const { error: eventError } = await supabase
          .from('new_order_events')
          .insert({
            order_id: orderId,
            event_type: 'CONCIERGE_ASSIGNED',
            actor_role: 'admin',
            data: { concierge_id: staffId, concierge_name: selectedStaff.display_name }
          });

        if (eventError) {
          console.error('Failed to insert concierge event:', eventError);
        }

        // Only send notification if order is ready or delivered (when concierge can actually work on it)
        if (selectedOrderData.status === 'ready' || selectedOrderData.status === 'delivered') {
          try {
            await supabase.functions.invoke('notification-orchestrator', {
              body: {
                orderId,
                notificationType: 'concierge_assigned',
                recipientId: staffId,
                metadata: {
                  customer_name: selectedOrderData.customer_name,
                  order_status: selectedOrderData.status
                }
              }
            });
          } catch (notifError) {
            console.error('Failed to send concierge notification:', notifError);
            // Don't fail the assignment if notification fails
          }
        } else {
          // Show info toast explaining when concierge will be notified
          toast({
            title: "Concierge Assigned",
            description: `${selectedStaff.display_name} will be notified when the order reaches 'ready' status`,
            variant: "default",
          });
        }
      }

      // Create stakeholder assignment record
      const { error: assignmentError } = await supabase
        .from('stakeholder_assignments')
        .insert({
          order_id: orderId,
          user_id: staffId,
          role,
          status: 'assigned'
        });

      if (assignmentError) throw assignmentError;

      // Event logging handled by:
      // - Shopper: rpc_assign_shopper inserts to new_order_events automatically
      // - Concierge: manually inserted to new_order_events above (lines 293-300)
      // - stakeholder_assignments tracks current assignment state (lines 335-342)
      // - order_events is a VIEW (read-only), cannot INSERT into it
      
      // Show detailed success toast
      toast({
        title: "Assignment Successful! ✅",
        description: `${selectedStaff.display_name} assigned as ${role} for ${selectedOrderData.customer_name}'s order`,
      });

      // Add to pending notifications
      setPendingNotifications(prev => [...prev, {
        staffId,
        orderId,
        role,
        staffName: selectedStaff.display_name
      }]);

      // Auto-refresh will happen via real-time subscription
      
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: "Assignment Failed ❌",
        description: error.message || "Failed to assign staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigningStaff(prev => ({ ...prev, [assignmentKey]: false }));
    }
  };

  const sendStaffNotification = async (staffId: string, orderId: string, role: string, staffName: string) => {
    try {
      // Send targeted notification to specific staff member
      await supabase.functions.invoke('notification-orchestrator', {
        body: {
          orderId,
          notificationType: 'staff_assignment_notification',
          recipientId: staffId,
          role,
          metadata: {
            urgency: 'high',
            requiresResponse: true,
            responseWindow: '15_minutes'
          }
        }
      });

      toast({
        title: "Notification Sent! 📱",
        description: `${staffName} has been notified about their ${role} assignment`,
      });

      // Remove from pending notifications
      setPendingNotifications(prev => 
        prev.filter(notif => !(notif.staffId === staffId && notif.orderId === orderId && notif.role === role))
      );
    } catch (error) {
      console.error('Error sending staff notification:', error);
      toast({
        title: "Notification Failed",
        description: "Assignment successful but notification failed to send",
        variant: "destructive",
      });
    }
  };

  const sendAllPendingNotifications = async () => {
    for (const notification of pendingNotifications) {
      await sendStaffNotification(
        notification.staffId,
        notification.orderId,
        notification.role,
        notification.staffName
      );
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
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
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Staff Assignment Tool
          </CardTitle>
          <CardDescription>
            Assign shoppers, drivers, and concierge staff to orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Order to Assign Staff</label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{order.customer_name} - ${order.total_amount} ({order.items_count} items)</span>
                        <div className="flex gap-1 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {order.assigned_stakeholders.length} assigned
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <div className="p-3 bg-muted/50 rounded-lg">
                {(() => {
                  const order = orders.find(o => o.id === selectedOrder);
                  return order ? (
                       <div>
                      <h4 className="font-medium mb-2">Current Assignments for {order.customer_name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {order.assigned_stakeholders.length > 0 ? (
                          order.assigned_stakeholders.map((assignment, idx) => (
                            <Badge key={idx} variant="outline">
                              {assignment.role}: {assignment.user_name} ({assignment.status})
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No staff assigned yet</span>
                        )}
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        <strong>Note:</strong> Concierge Dashboard shows orders when they're 'ready' or 'delivered'. 
                        Current status: <Badge variant="outline" className="ml-1">{order.status}</Badge>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Pending Notifications Section */}
            {pendingNotifications.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pending Staff Notifications ({pendingNotifications.length})
                  </h4>
                  <Button
                    size="sm"
                    onClick={sendAllPendingNotifications}
                    className="flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    Send All Notifications
                  </Button>
                </div>
                <div className="space-y-2">
                  {pendingNotifications.map((notif, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm">
                        {notif.staffName} - {notif.role}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendStaffNotification(notif.staffId, notif.orderId, notif.role, notif.staffName)}
                        className="flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Send
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Staff Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Available Staff</CardTitle>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="shopper">Shoppers</SelectItem>
                <SelectItem value="driver">Drivers</SelectItem>
                <SelectItem value="concierge">Concierge</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{member.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        {member.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </p>
                        )}
                      </div>
                      <div className={`text-xs font-medium ${getAvailabilityColor(member.stats.availability)}`}>
                        {member.stats.availability}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Orders:</span>
                        <span className="ml-1 font-medium">{member.stats.orders_completed}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="font-medium">{member.stats.rating}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response:</span>
                        <span className="ml-1 font-medium">{member.stats.response_time}</span>
                      </div>
                    </div>

                    {selectedOrder && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground">Assign as:</p>
                        <div className="flex gap-1">
                          {member.roles.includes('shopper') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignStaffToOrder(member.id, selectedOrder, 'shopper')}
                              className="text-xs"
                              disabled={assigningStaff[`${member.id}-shopper`]}
                            >
                              {assigningStaff[`${member.id}-shopper`] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Assign Shopper'
                              )}
                            </Button>
                          )}
                          {member.roles.includes('driver') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignStaffToOrder(member.id, selectedOrder, 'driver')}
                              className="text-xs"
                              disabled={assigningStaff[`${member.id}-driver`]}
                            >
                              {assigningStaff[`${member.id}-driver`] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Assign Driver'
                              )}
                            </Button>
                          )}
                          {member.roles.includes('concierge') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignStaffToOrder(member.id, selectedOrder, 'concierge')}
                              className="text-xs"
                              disabled={assigningStaff[`${member.id}-concierge`]}
                            >
                              {assigningStaff[`${member.id}-concierge`] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Assign Concierge'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3" />
              <p>No staff members found matching your criteria</p>
              <p className="text-sm">Try adjusting your search or role filter</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}