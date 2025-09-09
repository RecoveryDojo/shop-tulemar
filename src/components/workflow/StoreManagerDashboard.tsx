import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Users, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  MapPin,
  Phone,
  MessageSquare,
  Target,
  Zap,
  Star,
  Eye,
  Camera,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StoreOrder {
  id: string;
  customer_name: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  items_count: number;
  shopper_id?: string;
  shopper_name?: string;
  estimated_completion: string;
  created_at: string;
  total_amount: number;
  special_instructions?: string;
}

interface ShopperPerformance {
  id: string;
  name: string;
  status: 'active' | 'assigned' | 'break' | 'offline';
  current_order_id?: string;
  completion_rate: number;
  avg_time_per_order: number;
  rating: number;
  orders_today: number;
}

const STORE_PROTOCOLS = [
  {
    id: 'order_assignment',
    title: 'Order Assignment Protocol',
    priority: 1,
    steps: [
      'Review incoming order details and special requirements',
      'Check shopper availability and proximity to store',
      'Assign based on order complexity and shopper expertise',
      'Send push notification with 15-minute acceptance window',
      'Monitor acceptance status and reassign if needed'
    ],
    triggers: ['New order received', 'Payment confirmed'],
    completion_time: '2-3 minutes'
  },
  {
    id: 'shopper_coordination',
    title: 'Shopper Coordination Protocol',
    priority: 2,
    steps: [
      'Brief shopper on special items and store layout',
      'Provide customer preference notes and substitution rules',
      'Monitor shopping progress in real-time',
      'Assist with difficult-to-find items or substitutions',
      'Ensure quality check completion before checkout'
    ],
    triggers: ['Shopper arrives at store', 'Substitution requests'],
    completion_time: '15-30 minutes'
  },
  {
    id: 'quality_assurance',
    title: 'Quality Assurance Protocol',
    priority: 1,
    steps: [
      'Review shopper photo submissions for substitutions',
      'Verify item quality meets standards',
      'Check temperature-sensitive item handling',
      'Confirm proper packaging for delivery',
      'Document any quality issues or improvements'
    ],
    triggers: ['Shopping completed', 'Quality concerns raised'],
    completion_time: '5-10 minutes'
  },
  {
    id: 'inventory_coordination',
    title: 'Inventory Coordination Protocol',
    priority: 3,
    steps: [
      'Monitor high-demand items and stock levels',
      'Coordinate with store staff for item availability',
      'Update system for out-of-stock items',
      'Suggest alternatives for unavailable products',
      'Track seasonal demand patterns'
    ],
    triggers: ['Out-of-stock reports', 'High demand items'],
    completion_time: '10-15 minutes'
  }
];

export function StoreManagerDashboard() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [shoppers, setShoppers] = useState<ShopperPerformance[]>([]);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  const [protocolProgress, setProtocolProgress] = useState<Record<string, boolean[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    // Simulate real-time updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders from database
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(count),
          stakeholder_assignments!inner(
            user_id,
            role,
            status
          )
        `)
        .in('status', ['confirmed', 'assigned', 'shopping', 'packed'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Transform data for store manager view
      const transformedOrders: StoreOrder[] = ordersData?.map(order => ({
        id: order.id,
        customer_name: order.customer_name,
        status: order.status,
        priority: determinePriority(order),
        items_count: order.order_items?.[0]?.count || 0,
        shopper_id: order.stakeholder_assignments?.find(a => a.role === 'shopper')?.user_id,
        shopper_name: `Shopper ${order.stakeholder_assignments?.find(a => a.role === 'shopper')?.user_id?.slice(-4) || 'TBD'}`,
        estimated_completion: new Date(Date.now() + 45 * 60000).toISOString(),
        created_at: order.created_at,
        total_amount: order.total_amount,
        special_instructions: order.special_instructions
      })) || [];

      setOrders(transformedOrders);

      // Generate mock shopper data based on assignments
      const mockShoppers: ShopperPerformance[] = [
        {
          id: 'shopper-1',
          name: 'Alex Thompson',
          status: 'active',
          current_order_id: transformedOrders[0]?.id,
          completion_rate: 94.2,
          avg_time_per_order: 28,
          rating: 4.8,
          orders_today: 5
        },
        {
          id: 'shopper-2', 
          name: 'Maria Garcia',
          status: 'assigned',
          current_order_id: transformedOrders[1]?.id,
          completion_rate: 96.7,
          avg_time_per_order: 25,
          rating: 4.9,
          orders_today: 4
        },
        {
          id: 'shopper-3',
          name: 'David Kim',
          status: 'break',
          completion_rate: 91.3,
          avg_time_per_order: 32,
          rating: 4.7,
          orders_today: 3
        }
      ];
      
      setShoppers(mockShoppers);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const determinePriority = (order: any): 'high' | 'medium' | 'low' => {
    const orderTime = new Date(order.created_at).getTime();
    const hoursSinceOrder = (Date.now() - orderTime) / (1000 * 60 * 60);
    
    if (hoursSinceOrder > 2 || order.total_amount > 200) return 'high';
    if (hoursSinceOrder > 1 || order.total_amount > 100) return 'medium';
    return 'low';
  };

  const startProtocol = (protocolId: string) => {
    setActiveProtocol(protocolId);
    const protocol = STORE_PROTOCOLS.find(p => p.id === protocolId);
    if (protocol) {
      setProtocolProgress(prev => ({
        ...prev,
        [protocolId]: new Array(protocol.steps.length).fill(false)
      }));
    }
  };

  const toggleProtocolStep = (protocolId: string, stepIndex: number) => {
    setProtocolProgress(prev => ({
      ...prev,
      [protocolId]: prev[protocolId]?.map((completed, index) => 
        index === stepIndex ? !completed : completed
      ) || []
    }));
  };

  const completeProtocol = async (protocolId: string) => {
    const protocol = STORE_PROTOCOLS.find(p => p.id === protocolId);
    if (protocol) {
      // Log protocol completion
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: orders[0]?.id || 'store-general',
          phase: 'store_management',
          action: protocol.title,
          actor_role: 'store_manager',
          notes: `Completed: ${protocol.title}`
        });

      toast({
        title: "Protocol Complete!",
        description: `${protocol.title} has been completed successfully`,
      });
      
      setActiveProtocol(null);
      setProtocolProgress(prev => ({
        ...prev,
        [protocolId]: []
      }));
    }
  };

  const getProtocolProgress = (protocolId: string) => {
    const progress = protocolProgress[protocolId] || [];
    const completed = progress.filter(Boolean).length;
    const total = progress.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getCurrentProtocol = () => {
    if (activeProtocol) {
      const protocol = STORE_PROTOCOLS.find(p => p.id === activeProtocol);
      return `Active: ${protocol?.title} (${getProtocolProgress(activeProtocol)}% complete)`;
    }
    
    // Suggest next protocol based on current state
    if (orders.some(o => o.status === 'confirmed')) {
      return 'Suggested: Start Order Assignment Protocol';
    }
    if (orders.some(o => o.status === 'shopping')) {
      return 'Suggested: Monitor Shopper Coordination Protocol';
    }
    if (orders.some(o => o.status === 'packed')) {
      return 'Suggested: Review Quality Assurance Protocol';
    }
    
    return 'All systems running smoothly - Monitor real-time metrics';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            Store Manager Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Coordinate operations, manage shoppers, and ensure quality service
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Live Store Operations
        </Badge>
      </div>

      {/* Current Protocol Guide */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Current Protocol Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-medium text-primary mb-2">
            {getCurrentProtocol()}
          </div>
          {activeProtocol && (
            <Progress value={getProtocolProgress(activeProtocol)} className="h-2 mb-3" />
          )}
          <p className="text-sm text-muted-foreground">
            Store coordination protocols ensure efficient operations and customer satisfaction
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Shoppers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {shoppers.filter(s => ['active', 'assigned'].includes(s.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">On duty</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(shoppers.reduce((sum, s) => sum + s.avg_time_per_order, 0) / shoppers.length)}m
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Store Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">94.2%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="shoppers">Shoppers</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Order Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Queue
                </CardTitle>
                <CardDescription>Real-time order processing status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.items_count} items • ${order.total_amount}
                        </div>
                        {order.shopper_name && (
                          <div className="text-xs text-blue-600">Assigned: {order.shopper_name}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          order.priority === 'high' ? 'destructive' : 
                          order.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {order.priority}
                        </Badge>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shopper Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Shopper Status
                </CardTitle>
                <CardDescription>Current shopper activity and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shoppers.map((shopper) => (
                    <div key={shopper.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{shopper.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {shopper.orders_today} orders today • {shopper.completion_rate}% rate
                        </div>
                        <div className="text-xs flex items-center gap-2">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {shopper.rating}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          shopper.status === 'active' ? 'default' :
                          shopper.status === 'assigned' ? 'secondary' :
                          shopper.status === 'break' ? 'outline' : 'destructive'
                        }>
                          {shopper.status}
                        </Badge>
                        {shopper.current_order_id && (
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-6">
          <div className="grid gap-6">
            {STORE_PROTOCOLS.map((protocol) => (
              <Card key={protocol.id} className={`${activeProtocol === protocol.id ? 'border-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant={protocol.priority === 1 ? 'destructive' : protocol.priority === 2 ? 'default' : 'secondary'}>
                          P{protocol.priority}
                        </Badge>
                        {protocol.title}
                      </CardTitle>
                      <CardDescription>
                        Est. completion: {protocol.completion_time} • Triggers: {protocol.triggers.join(', ')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeProtocol === protocol.id && (
                        <Progress value={getProtocolProgress(protocol.id)} className="w-24" />
                      )}
                      <Button 
                        onClick={() => activeProtocol === protocol.id ? completeProtocol(protocol.id) : startProtocol(protocol.id)}
                        variant={activeProtocol === protocol.id ? "default" : "outline"}
                        disabled={activeProtocol === protocol.id && getProtocolProgress(protocol.id) < 100}
                      >
                        {activeProtocol === protocol.id ? 
                          (getProtocolProgress(protocol.id) === 100 ? 'Complete' : 'In Progress') : 
                          'Start Protocol'
                        }
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {activeProtocol === protocol.id && (
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Protocol Steps:</div>
                      {protocol.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Checkbox
                            checked={protocolProgress[protocol.id]?.[index] || false}
                            onCheckedChange={() => toggleProtocolStep(protocol.id, index)}
                          />
                          <div className={`text-sm ${protocolProgress[protocol.id]?.[index] ? 'line-through text-muted-foreground' : ''}`}>
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Detailed view of all active orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">Order #{order.id.slice(-8)}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_name} • {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">${order.total_amount}</Badge>
                        <Badge variant={
                          order.priority === 'high' ? 'destructive' : 
                          order.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {order.priority} priority
                        </Badge>
                        <Badge>{order.status}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Items</div>
                        <div className="text-muted-foreground">{order.items_count} products</div>
                      </div>
                      <div>
                        <div className="font-medium">Shopper</div>
                        <div className="text-muted-foreground">{order.shopper_name || 'Unassigned'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Est. Completion</div>
                        <div className="text-muted-foreground">
                          {new Date(order.estimated_completion).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {order.special_instructions && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <div className="font-medium">Special Instructions:</div>
                        <div>{order.special_instructions}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shoppers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shopper Performance</CardTitle>
              <CardDescription>Monitor and manage shopper productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shoppers.map((shopper) => (
                  <div key={shopper.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{shopper.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span>{shopper.orders_today} orders today</span>
                          <span>{shopper.avg_time_per_order}m avg time</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {shopper.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          shopper.status === 'active' ? 'default' :
                          shopper.status === 'assigned' ? 'secondary' :
                          shopper.status === 'break' ? 'outline' : 'destructive'
                        }>
                          {shopper.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium">Completion Rate</div>
                        <Progress value={shopper.completion_rate} className="h-2 mt-1" />
                        <div className="text-xs text-muted-foreground mt-1">{shopper.completion_rate}%</div>
                      </div>
                      {shopper.current_order_id && (
                        <div>
                          <div className="text-sm font-medium">Current Order</div>
                          <div className="text-sm text-muted-foreground">#{shopper.current_order_id.slice(-8)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Store Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Orders per Hour</span>
                    <span className="font-bold">12.4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Order Value</span>
                    <span className="font-bold">$127.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-bold">4.8/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Substitution Rate</span>
                    <span className="font-bold">8.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Peak Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Busiest hours today:</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>11:00 AM - 12:00 PM</span>
                      <Badge>18 orders</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>6:00 PM - 7:00 PM</span>
                      <Badge>15 orders</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>2:00 PM - 3:00 PM</span>
                      <Badge>12 orders</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}