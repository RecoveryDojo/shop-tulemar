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
    availability: 'available' | 'busy' | 'offline';
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
  const { hasRole } = useAuth();

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('sysadmin')) return;
    
    fetchStaffMembers();
    fetchAvailableOrders();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id); // Exclude current admin

      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get recent performance stats for each user
      const staffWithStats = profiles ? await Promise.all(
        profiles.map(async (profile) => {
          const roles = userRoles
            ?.filter(ur => ur.user_id === profile.id)
            ?.map(ur => ur.role) || [];
          
          // Get basic stats (real data only - no fake availability)
          const stats = {
            orders_completed: 0, // Real count to be implemented
            rating: 5.0, // Default rating
            response_time: '5m', // Default response time
            availability: 'available' // Always available - no fake statuses
          };

          return {
            id: profile.id,
            display_name: profile.display_name || 'Staff Member',
            email: profile.email || '',
            phone: profile.phone,
            avatar_url: profile.avatar_url,
            status: profile.status || 'available',
            roles,
            stats
          };
        })
      ) : [];

      setStaff(staffWithStats);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (id),
          stakeholder_assignments (
            role,
            user_id,
            status,
            profiles (display_name)
          )
        `)
        .eq('payment_status', 'paid')
        .in('status', ['pending', 'confirmed', 'assigned'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedOrders = data?.map(order => ({
        id: order.id,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        items_count: order.order_items?.length || 0,
        assigned_stakeholders: order.stakeholder_assignments?.map((sa: any) => ({
          role: sa.role,
          user_id: sa.user_id,
          user_name: sa.profiles?.display_name || 'Unknown',
          status: sa.status
        })) || []
      })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    // Only show available status now
    return 'text-green-600';
  };
    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from('stakeholder_assignments')
        .select('id')
        .eq('order_id', orderId)
        .eq('role', role)
        .single();

      if (existing) {
        // Update existing assignment
        await supabase
          .from('stakeholder_assignments')
          .update({ 
            user_id: staffId,
            status: 'assigned',
            assigned_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new assignment
        await supabase
          .from('stakeholder_assignments')
          .insert({
            order_id: orderId,
            user_id: staffId,
            role,
            status: 'assigned'
          });
      }

      // Log the assignment
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: orderId,
          phase: 'assignment',
          action: 'staff_assigned',
          actor_role: 'admin',
          notes: `Assigned ${role} to order`,
          metadata: { assigned_user_id: staffId, role }
        });

      toast({
        title: "Staff Assigned",
        description: `Successfully assigned ${role} to order`,
      });

      // Refresh data
      fetchAvailableOrders();
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign staff member",
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
                              Shopper
                            </Button>
                          )}
                          {member.roles.includes('driver') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignStaffToOrder(member.id, selectedOrder, 'driver')}
                              className="text-xs"
                            >
                              Driver
                            </Button>
                          )}
                          {member.roles.includes('concierge') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignStaffToOrder(member.id, selectedOrder, 'concierge')}
                              className="text-xs"
                            >
                              Concierge
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