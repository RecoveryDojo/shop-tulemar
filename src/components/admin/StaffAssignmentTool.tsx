import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, Clock, Star, MapPin, Phone, CheckCircle2, AlertCircle } from "lucide-react";
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
  const { toast } = useToast();
  const { hasRole, user } = useAuth();

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('sysadmin')) return;
    
    fetchStaffMembers();
    fetchAvailableOrders();
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

      // Filter out fake/bot profiles and transform into staff members
      const realProfiles = profiles?.filter(profile => {
        const name = profile.display_name?.toLowerCase() || '';
        // Filter out obvious bot/fake accounts
        return !name.includes('bot') && 
               !name.includes('test') && 
               !name.includes('fake') &&
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
            .select(`
              id,
              user_id,
              role,
              status,
              accepted_at,
              profiles!inner (display_name)
            `)
            .eq('order_id', order.id);

          const { data: items } = await supabase
            .from('order_items')
            .select('id')
            .eq('order_id', order.id);

          return {
            id: order.id,
            customer_name: order.customer_name,
            total_amount: order.total_amount,
            status: order.status,
            created_at: order.created_at,
            items_count: items?.length || 0,
            assigned_stakeholders: assignments?.map((sa: any) => ({
              role: sa.role,
              user_id: sa.user_id,
              user_name: sa.profiles?.display_name || 'Unknown',
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
    try {
      const selectedStaff = staff.find(s => s.id === staffId);
      const selectedOrderData = orders.find(o => o.id === orderId);
      
      if (!selectedStaff || !selectedOrderData) {
        throw new Error('Staff member or order not found');
      }

      // Call the comprehensive assignment workflow
      const { data: result, error } = await supabase.functions.invoke('assignment-workflow', {
        body: { 
          orderId,
          staffId,
          role,
          adminId: user?.id
        }
      });

      if (error) {
        console.error('Assignment workflow error:', error);
        throw new Error(error.message || 'Assignment failed');
      }

      console.log('Assignment result:', result);

      // Show detailed success toast
      toast({
        title: "Assignment Successful! ✅",
        description: `${selectedStaff.display_name} assigned as ${role} for ${selectedOrderData.customer_name}'s order ($${selectedOrderData.total_amount})`,
      });

      // Show follow-up notification options
      setTimeout(() => {
        toast({
          title: "Next Step: Notify Staff",
          description: `Click here to send notification to ${selectedStaff.display_name}`,
          action: {
            altText: "Send Notification",
            onClick: () => sendStaffNotification(selectedStaff.id, selectedOrder, role)
          },
        });
      }, 1500);

      // Refresh data to show updated assignments
      fetchAvailableOrders();
      
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: "Assignment Failed ❌",
        description: error.message || "Failed to assign staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendStaffNotification = async (staffId: string, orderId: string, role: string) => {
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
        description: `${role} has been notified and has 15 minutes to accept the assignment`,
      });
    } catch (error) {
      console.error('Error sending staff notification:', error);
      toast({
        title: "Notification Failed",
        description: "Assignment successful but notification failed to send",
        variant: "destructive",
      });
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
                        <span>{order.customer_name} - ${order.total_amount}</span>
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
                    </div>
                  ) : null;
                })()}
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
                            >
                              Assign Shopper
                            </Button>
                          )}
                          {member.roles.includes('driver') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignStaffToOrder(member.id, selectedOrder, 'driver')}
                              className="text-xs"
                            >
                              Assign Driver
                            </Button>
                          )}
                          {member.roles.includes('concierge') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignStaffToOrder(member.id, selectedOrder, 'concierge')}
                              className="text-xs"
                            >
                              Assign Concierge
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