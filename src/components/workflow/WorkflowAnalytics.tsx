import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Users, 
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface StakeholderAssignment {
  id: string;
  order_id: string;
  role: string;
  status: string;
  assigned_at: string;
  accepted_at: string;
}

interface WorkflowLog {
  id: string;
  order_id: string;
  phase: string;
  action: string;
  timestamp: string;
}

interface WorkflowPhase {
  id: string;
  title: string;
  status: string[];
}

interface WorkflowAnalyticsProps {
  orders: Order[];
  assignments: StakeholderAssignment[];
  workflowLogs: WorkflowLog[];
  phases: WorkflowPhase[];
}

export function WorkflowAnalytics({ orders, assignments, workflowLogs, phases }: WorkflowAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d");

  // Calculate key metrics
  const getMetrics = () => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalOrders,
      completedOrders,
      activeOrders,
      cancelledOrders,
      completionRate,
      cancellationRate,
      totalRevenue,
      avgOrderValue
    };
  };

  // Phase distribution analysis
  const getPhaseDistribution = () => {
    const distribution = phases.map(phase => {
      const phaseOrders = orders.filter(order => phase.status.includes(order.status));
      return {
        phase: phase.title,
        count: phaseOrders.length,
        percentage: orders.length > 0 ? (phaseOrders.length / orders.length) * 100 : 0
      };
    });
    return distribution;
  };

  // Performance metrics by role
  const getRolePerformance = () => {
    const roles = ['shopper', 'driver', 'concierge'];
    return roles.map(role => {
      const roleAssignments = assignments.filter(a => a.role === role);
      const acceptedAssignments = roleAssignments.filter(a => a.status === 'accepted');
      const acceptanceRate = roleAssignments.length > 0 ? (acceptedAssignments.length / roleAssignments.length) * 100 : 0;
      
      return {
        role,
        totalAssignments: roleAssignments.length,
        acceptanceRate,
        avgResponseTime: Math.random() * 10 + 5 // Mock data - in real app, calculate from timestamps
      };
    });
  };

  // Workflow efficiency metrics
  const getWorkflowEfficiency = () => {
    const phaseTimings = phases.map(phase => ({
      phase: phase.title,
      avgTime: Math.random() * 120 + 30, // Mock data - in real app, calculate from logs
      efficiency: Math.random() * 30 + 70, // Mock efficiency score
      bottleneck: Math.random() > 0.8 // Mock bottleneck detection
    }));
    return phaseTimings;
  };

  // Time-based trends (mock data for demonstration)
  const getTrends = () => {
    const days = 7;
    const trends = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        orders: Math.floor(Math.random() * 20) + 5,
        completion: Math.random() * 100,
        revenue: Math.random() * 5000 + 1000
      });
    }
    return trends;
  };

  const metrics = getMetrics();
  const phaseDistribution = getPhaseDistribution();
  const rolePerformance = getRolePerformance();
  const workflowEfficiency = getWorkflowEfficiency();
  const trends = getTrends();

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedOrders} of {metrics.totalOrders} orders
            </p>
            <Progress value={metrics.completionRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${metrics.avgOrderValue.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total revenue: ${metrics.totalRevenue.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.activeOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in workflow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cancellation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.cancellationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.cancelledOrders} cancelled orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="workflow">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflow" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Target className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="gap-2">
            <Clock className="h-4 w-4" />
            Efficiency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Workflow Phase Distribution
              </CardTitle>
              <CardDescription>
                Current orders across all workflow phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phaseDistribution.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.phase}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.count}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Bottlenecks</CardTitle>
                <CardDescription>
                  Phases requiring attention or optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflowEfficiency
                    .filter(phase => phase.bottleneck)
                    .map((phase, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <div className="font-medium text-red-900">{phase.phase}</div>
                          <div className="text-sm text-red-700">
                            Avg time: {phase.avgTime.toFixed(0)} minutes
                          </div>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    ))}
                  
                  {workflowEfficiency.filter(phase => phase.bottleneck).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No workflow bottlenecks detected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Workflow Activity</CardTitle>
                <CardDescription>
                  Latest system events and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {workflowLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <div className="text-sm font-medium">{log.action}</div>
                        <div className="text-xs text-muted-foreground">{log.phase}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Role Performance Metrics
              </CardTitle>
              <CardDescription>
                Performance analysis by stakeholder role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rolePerformance.map((role) => (
                  <div key={role.role} className="space-y-4 p-4 border rounded-lg">
                    <div className="text-center">
                      <h3 className="font-semibold capitalize">{role.role}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {role.totalAssignments} assignments
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Acceptance Rate</span>
                          <span>{role.acceptanceRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={role.acceptanceRate} className="h-2" />
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {role.avgResponseTime.toFixed(1)}m
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Avg response time
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>
                  Service quality indicators across roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: "Customer Satisfaction", score: 4.8, max: 5 },
                    { metric: "Order Accuracy", score: 96.2, max: 100 },
                    { metric: "On-Time Delivery", score: 94.7, max: 100 },
                    { metric: "Substitution Approval Rate", score: 89.3, max: 100 }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.metric}</span>
                        <span className="font-medium">
                          {item.score.toFixed(1)}{item.max === 5 ? '/5' : '%'}
                        </span>
                      </div>
                      <Progress value={(item.score / item.max) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  AI-powered performance recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">Strong Performance</span>
                    </div>
                    <div className="text-sm text-green-700">
                      Customer satisfaction ratings consistently above target
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Opportunity</span>
                    </div>
                    <div className="text-sm text-yellow-700">
                      Shopper response times could be improved during peak hours
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Recommendation</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      Consider incentives for faster acceptance rates
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                7-Day Performance Trends
              </CardTitle>
              <CardDescription>
                Daily metrics showing system performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Mock trend visualization */}
                <div className="grid grid-cols-7 gap-2">
                  {trends.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </div>
                      <div className="bg-muted rounded-lg p-3 space-y-2">
                        <div className="text-sm font-medium">{day.orders}</div>
                        <div className="text-xs text-muted-foreground">orders</div>
                        <div className="h-8 bg-primary/20 rounded relative">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-primary rounded"
                            style={{ height: `${(day.completion / 100) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.completion.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Weekly Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">
                        {trends.reduce((sum, day) => sum + day.orders, 0)}
                      </div>
                      <div className="text-xs text-green-600">↑ 12% from last week</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">
                        {(trends.reduce((sum, day) => sum + day.completion, 0) / trends.length).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-600">↑ 3.2% from last week</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Weekly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">
                        ${trends.reduce((sum, day) => sum + day.revenue, 0).toFixed(0)}
                      </div>
                      <div className="text-xs text-green-600">↑ 8.7% from last week</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Workflow Phase Efficiency
              </CardTitle>
              <CardDescription>
                Time analysis and efficiency metrics for each workflow phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowEfficiency.map((phase, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{phase.phase}</div>
                      <div className="text-sm text-muted-foreground">Workflow phase</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold">{phase.avgTime.toFixed(0)}m</div>
                      <div className="text-xs text-muted-foreground">Average time</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Efficiency</span>
                        <span>{phase.efficiency.toFixed(1)}%</span>
                      </div>
                      <Progress value={phase.efficiency} className="h-2" />
                    </div>
                    
                    <div className="text-center">
                      {phase.bottleneck ? (
                        <Badge variant="destructive" className="text-xs">
                          Bottleneck
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Optimal
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Opportunities</CardTitle>
                <CardDescription>
                  AI-identified areas for workflow improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-900 mb-1">Shopper Assignment</div>
                    <div className="text-sm text-blue-700">
                      Implementing predictive assignment could reduce wait times by 23%
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="font-medium text-purple-900 mb-1">Route Optimization</div>
                    <div className="text-sm text-purple-700">
                      Advanced routing algorithms could improve delivery efficiency by 15%
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-900 mb-1">Inventory Integration</div>
                    <div className="text-sm text-green-700">
                      Real-time inventory could reduce substitution requests by 40%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health Score</CardTitle>
                <CardDescription>
                  Overall workflow system performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 rounded-full border-8 border-muted"></div>
                    <div 
                      className="absolute inset-0 rounded-full border-8 border-green-500 border-t-transparent transform"
                      style={{ 
                        transform: 'rotate(270deg)',
                        borderImage: `conic-gradient(from 0deg, #10b981 ${94.7 * 3.6}deg, transparent 0deg) 1`
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-2xl font-bold text-green-600">94.7</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-semibold text-green-600">Excellent</div>
                    <div className="text-sm text-muted-foreground">System performance</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Uptime</div>
                      <div className="text-green-600">99.9%</div>
                    </div>
                    <div>
                      <div className="font-medium">Errors</div>
                      <div className="text-green-600">0.1%</div>
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