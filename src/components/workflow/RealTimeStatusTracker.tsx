import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Truck, 
  ShoppingCart, 
  Home, 
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  Phone,
  MessageSquare,
  Eye,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  property_address: string;
  arrival_date: string;
  guest_count: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowLog {
  id: string;
  order_id: string;
  phase: string;
  action: string;
  notes: string;
  timestamp: string;
  metadata?: any;
}

interface StakeholderAssignment {
  id: string;
  order_id: string;
  user_id: string;
  role: string;
  status: string;
  assigned_at: string;
}

export function RealTimeStatusTracker() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<Record<string, WorkflowLog[]>>({});
  const [assignments, setAssignements] = useState<Record<string, StakeholderAssignment[]>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    setupRealtimeSubscription();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOrders(ordersData || []);

      // Fetch workflow logs for each order
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(o => o.id);
        
        const { data: logsData } = await supabase
          .from('order_workflow_log')
          .select('*')
          .in('order_id', orderIds)
          .order('timestamp', { ascending: true });

        const { data: assignmentsData } = await supabase
          .from('stakeholder_assignments')
          .select('*')
          .in('order_id', orderIds);

        // Group logs by order
        const logsByOrder = (logsData || []).reduce((acc, log) => {
          if (!acc[log.order_id]) acc[log.order_id] = [];
          acc[log.order_id].push(log);
          return acc;
        }, {} as Record<string, WorkflowLog[]>);

        // Group assignments by order
        const assignmentsByOrder = (assignmentsData || []).reduce((acc, assignment) => {
          if (!acc[assignment.order_id]) acc[assignment.order_id] = [];
          acc[assignment.order_id].push(assignment);
          return acc;
        }, {} as Record<string, StakeholderAssignment[]>);

        setWorkflowLogs(logsByOrder);
        setAssignements(assignmentsByOrder);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to order changes
    const orderChannel = supabase
      .channel('order_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change:', payload);
          fetchOrders(); // Refresh data
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_workflow_log'
        },
        (payload) => {
          console.log('Workflow log change:', payload);
          fetchOrders(); // Refresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'assigned': 'bg-purple-100 text-purple-800',
      'shopping': 'bg-yellow-100 text-yellow-800',
      'packed': 'bg-orange-100 text-orange-800',
      'out_for_delivery': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'stocking': 'bg-emerald-100 text-emerald-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'pending': Clock,
      'confirmed': CheckCircle2,
      'assigned': Users,
      'shopping': ShoppingCart,
      'packed': Package,
      'out_for_delivery': Truck,
      'delivered': MapPin,
      'stocking': Home,
      'completed': CheckCircle2
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getProgressPercentage = (status: string) => {
    const statusMap = {
      'pending': 5,
      'confirmed': 15,
      'assigned': 25,
      'shopping': 40,
      'packed': 60,
      'out_for_delivery': 75,
      'delivered': 85,
      'stocking': 95,
      'completed': 100
    };
    return statusMap[status] || 0;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Real-Time Order Tracking</h1>
        <Badge variant="secondary" className="animate-pulse">
          Live Updates
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.map((order) => {
                const logs = workflowLogs[order.id] || [];
                const latestLog = logs[logs.length - 1];
                
                return (
                  <div 
                    key={order.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Order #{order.id.slice(0, 8)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>

                    <Progress 
                      value={getProgressPercentage(order.status)} 
                      className="mb-2"
                    />

                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-4">
                      <span>${order.total_amount.toFixed(2)}</span>
                      <span>{order.guest_count} guests</span>
                    </div>

                    {latestLog && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Last update: {latestLog.action} • {formatTimeAgo(latestLog.timestamp)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Details</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div>
                <div className="text-sm font-medium">Customer</div>
                <div>{selectedOrder.customer_name}</div>
                <div className="text-sm text-muted-foreground">{selectedOrder.customer_email}</div>
                {selectedOrder.customer_phone && (
                  <div className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</div>
                )}
              </div>

              {/* Property */}
              <div>
                <div className="text-sm font-medium">Property</div>
                <div className="text-sm">{selectedOrder.property_address}</div>
                <div className="text-xs text-muted-foreground">
                  Arrival: {new Date(selectedOrder.arrival_date).toLocaleDateString()}
                </div>
              </div>

              {/* Current Status */}
              <div>
                <div className="text-sm font-medium mb-2">Current Status</div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1">{selectedOrder.status.replace('_', ' ')}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getProgressPercentage(selectedOrder.status)}% Complete
                  </span>
                </div>
                <Progress value={getProgressPercentage(selectedOrder.status)} />
              </div>

              {/* Assigned Team */}
              {assignments[selectedOrder.id] && (
                <div>
                  <div className="text-sm font-medium mb-2">Assigned Team</div>
                  <div className="space-y-1">
                    {assignments[selectedOrder.id].map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{assignment.role}</span>
                        <Badge variant="outline" className="text-xs">
                          {assignment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <div className="text-sm font-medium mb-2">Activity Timeline</div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(workflowLogs[selectedOrder.id] || []).reverse().map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2 bg-muted rounded text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium">{log.action.replace('_', ' ')}</div>
                        {log.notes && (
                          <div className="text-muted-foreground text-xs">{log.notes}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(log.timestamp)} • {log.phase}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}