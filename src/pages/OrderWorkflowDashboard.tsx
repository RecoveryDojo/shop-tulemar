import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Workflow, 
  ShoppingCart, 
  Truck, 
  Home, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  Users,
  MapPin,
  Camera,
  Star
} from "lucide-react";
import { WorkflowPhaseDetails } from "@/components/workflow/WorkflowPhaseDetails";
import { OrderStatusTracker } from "@/components/workflow/OrderStatusTracker";
import { StakeholderCommunications } from "@/components/workflow/StakeholderCommunications";
import { RoleBasedDashboard } from "@/components/workflow/RoleBasedDashboard";
import { WorkflowAnalytics } from "@/components/workflow/WorkflowAnalytics";
import { RealTimeStatusTracker } from "@/components/workflow/RealTimeStatusTracker";
import { WorkflowAutomationPanel } from "@/components/workflow/WorkflowAutomationPanel";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  property_address: string;
  arrival_date: string;
}

interface StakeholderAssignment {
  id: string;
  order_id: string;
  role: string;
  user_id: string;
  status: string;
  assigned_at: string;
  accepted_at: string;
}

interface WorkflowLog {
  id: string;
  order_id: string;
  phase: string;
  action: string;
  actor_role: string;
  timestamp: string;
  notes: string;
}

const WORKFLOW_PHASES = [
  {
    id: 'confirmation',
    title: 'Order Confirmation & Assignment',
    description: 'Automated order confirmation, payment processing, and shopper assignment',
    icon: CheckCircle2,
    color: 'bg-green-500',
    status: ['pending', 'confirmed'],
    triggers: ['Order submitted', 'Payment confirmed'],
    actions: ['Send confirmation SMS/email', 'Assign shopper', 'Create order record'],
    stakeholders: ['Client', 'Assigned Shopper', 'Admin']
  },
  {
    id: 'assignment',
    title: 'Shopper Assignment & Acceptance', 
    description: 'Shopper notification system and order acceptance workflow',
    icon: Users,
    color: 'bg-blue-500',
    status: ['assigned'],
    triggers: ['Shopper assigned'],
    actions: ['Push notification to shopper', '15-minute acceptance window', 'Auto-reassign if declined'],
    stakeholders: ['Shopper', 'Admin']
  },
  {
    id: 'shopping',
    title: 'Shopping Process Management',
    description: 'Real-time shopping interface with substitution approvals',
    icon: ShoppingCart,
    color: 'bg-purple-500',
    status: ['shopping'],
    triggers: ['Shopper starts shopping'],
    actions: ['Real-time item scanning', 'Photo substitution requests', 'Customer approval workflow'],
    stakeholders: ['Shopper', 'Client', 'Admin']
  },
  {
    id: 'packing',
    title: 'Quality Check & Packing',
    description: 'Quality assurance checklist and photo documentation',
    icon: Camera,
    color: 'bg-orange-500',
    status: ['packed'],
    triggers: ['Shopping completed'],
    actions: ['Quality checklist completion', 'Photo documentation', 'Special item protocols'],
    stakeholders: ['Shopper', 'Admin', 'Client']
  },
  {
    id: 'delivery',
    title: 'Delivery & Transit Tracking',
    description: 'GPS tracking, route optimization, and real-time updates',
    icon: Truck,
    color: 'bg-yellow-500',
    status: ['out_for_delivery'],
    triggers: ['Order out for delivery'],
    actions: ['GPS tracking activation', 'ETA calculations', 'Route optimization'],
    stakeholders: ['Driver', 'Client', 'Admin']
  },
  {
    id: 'arrival',
    title: 'Property Arrival & Handoff',
    description: 'Arrival confirmation and concierge handoff protocol',
    icon: MapPin,
    color: 'bg-indigo-500',
    status: ['arrived'],
    triggers: ['GPS confirms property arrival'],
    actions: ['Photo proof of delivery', 'Concierge handoff protocol', 'Delivery confirmation'],
    stakeholders: ['Driver', 'Concierge', 'Client']
  },
  {
    id: 'stocking',
    title: 'Kitchen Stocking & Preparation',
    description: 'Concierge kitchen stocking protocol and quality verification',
    icon: Home,
    color: 'bg-teal-500',
    status: ['stocking'],
    triggers: ['Groceries delivered to concierge'],
    actions: ['Item verification', 'Proper kitchen placement', 'Temperature-appropriate storage'],
    stakeholders: ['Concierge', 'Admin']
  },
  {
    id: 'completion',
    title: 'Kitchen Stocked Confirmation',
    description: 'Final stocking confirmation with photo documentation',
    icon: CheckCircle2,
    color: 'bg-green-600',
    status: ['completed'],
    triggers: ['Kitchen stocking completed'],
    actions: ['Photo documentation', 'Order completion marking', 'Multi-stakeholder notification'],
    stakeholders: ['Concierge', 'Client', 'Admin', 'Shopper', 'Driver']
  },
  {
    id: 'followup',
    title: 'Post-Completion Follow-up',
    description: 'Guest satisfaction survey and service feedback collection',
    icon: Star,
    color: 'bg-pink-500',
    status: ['completed'],
    triggers: ['2 hours after stocking completion'],
    actions: ['Satisfaction survey delivery', 'Service feedback request', 'Performance data collection'],
    stakeholders: ['Client', 'Admin']
  }
];

export default function OrderWorkflowDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [assignments, setAssignments] = useState<StakeholderAssignment[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [ordersData, assignmentsData, logsData] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("stakeholder_assignments").select("*"),
        supabase.from("order_workflow_log").select("*").order("timestamp", { ascending: false }).limit(100)
      ]);

      if (ordersData.error) throw ordersData.error;
      if (assignmentsData.error) throw assignmentsData.error;
      if (logsData.error) throw logsData.error;

      setOrders(ordersData.data || []);
      setAssignments(assignmentsData.data || []);
      setWorkflowLogs(logsData.data || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrdersByStatus = () => {
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      assigned: 0,
      shopping: 0,
      packed: 0,
      out_for_delivery: 0,
      arrived: 0,
      stocking: 0,
      completed: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }
    });

    return statusCounts;
  };

  const getPhaseProgress = () => {
    const statusCounts = getOrdersByStatus();
    const totalActiveOrders = Object.values(statusCounts).reduce((sum, count) => sum + count, 0) - statusCounts.completed - statusCounts.cancelled;
    
    return WORKFLOW_PHASES.map(phase => {
      const phaseOrders = phase.status.reduce((sum, status) => sum + statusCounts[status as keyof typeof statusCounts], 0);
      const percentage = totalActiveOrders > 0 ? (phaseOrders / totalActiveOrders) * 100 : 0;
      
      return {
        ...phase,
        orderCount: phaseOrders,
        percentage
      };
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-500',
      confirmed: 'bg-blue-500',
      assigned: 'bg-indigo-500',
      shopping: 'bg-purple-500',
      packed: 'bg-orange-500',
      out_for_delivery: 'bg-yellow-500',
      arrived: 'bg-teal-500',
      stocking: 'bg-green-500',
      completed: 'bg-emerald-600',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <ShopLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Workflow className="h-8 w-8 text-primary" />
              Complete Order Workflow Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              End-to-end workflow tracking from order completion to kitchen stocking
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDashboardData}>
              Refresh Data
            </Button>
            <Button onClick={() => window.location.href = "/work-tracker"}>
              View Documentation
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stakeholder Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{assignments.length}</div>
              <p className="text-xs text-muted-foreground">Total assignments</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="gap-2">
              <Workflow className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="phases" className="gap-2">
              <Clock className="h-4 w-4" />
              Workflow Phases
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Order Tracking
            </TabsTrigger>
            <TabsTrigger value="communications" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Communications
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Users className="h-4 w-4" />
              Role Dashboards
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Star className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Workflow Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Phase Distribution</CardTitle>
                <CardDescription>Current orders across all workflow phases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getPhaseProgress().map((phase) => {
                    const Icon = phase.icon;
                    return (
                      <div key={phase.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 text-white p-1 rounded ${phase.color}`} />
                            <span className="text-sm font-medium">{phase.title}</span>
                          </div>
                          <Badge variant="secondary">{phase.orderCount}</Badge>
                        </div>
                        <Progress value={phase.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">{phase.description}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Workflow Activity</CardTitle>
                <CardDescription>Latest updates across all orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{log.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.phase} • {log.actor_role} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {log.notes && <div className="text-xs text-muted-foreground mt-1">{log.notes}</div>}
                      </div>
                      <Badge variant="outline">{log.phase}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phases">
            <WorkflowPhaseDetails phases={WORKFLOW_PHASES} orders={orders} />
          </TabsContent>

          <TabsContent value="orders">
            <OrderStatusTracker 
              orders={orders} 
              assignments={assignments}
              workflowLogs={workflowLogs}
              onOrderSelect={setSelectedOrder}
              selectedOrder={selectedOrder}
            />
          </TabsContent>

          <TabsContent value="communications">
            <StakeholderCommunications 
              orders={orders}
              assignments={assignments}
              workflowLogs={workflowLogs}
            />
          </TabsContent>

          <TabsContent value="roles">
            <RoleBasedDashboard 
              orders={orders}
              assignments={assignments}
              workflowLogs={workflowLogs}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <WorkflowAnalytics 
              orders={orders}
              assignments={assignments}
              workflowLogs={workflowLogs}
              phases={WORKFLOW_PHASES}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ShopLayout>
  );
}