import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  MapPin, 
  ShoppingCart,
  Users,
  Package,
  Truck,
  Home,
  CheckCircle2
} from "lucide-react";

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

interface OrderStatusTrackerProps {
  orders: Order[];
  assignments: StakeholderAssignment[];
  workflowLogs: WorkflowLog[];
  onOrderSelect: (order: Order | null) => void;
  selectedOrder: Order | null;
}

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle2,
  assigned: Users,
  shopping: ShoppingCart,
  packed: Package,
  out_for_delivery: Truck,
  arrived: MapPin,
  stocking: Home,
  completed: CheckCircle2,
  cancelled: Clock
};

const STATUS_COLORS = {
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

const WORKFLOW_STEPS = [
  { status: 'pending', label: 'Pending', step: 1 },
  { status: 'confirmed', label: 'Confirmed', step: 2 },
  { status: 'assigned', label: 'Assigned', step: 3 },
  { status: 'shopping', label: 'Shopping', step: 4 },
  { status: 'packed', label: 'Packed', step: 5 },
  { status: 'out_for_delivery', label: 'Delivery', step: 6 },
  { status: 'arrived', label: 'Arrived', step: 7 },
  { status: 'stocking', label: 'Stocking', step: 8 },
  { status: 'completed', label: 'Completed', step: 9 }
];

export function OrderStatusTracker({ 
  orders, 
  assignments, 
  workflowLogs, 
  onOrderSelect, 
  selectedOrder 
}: OrderStatusTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "created_at") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "total_amount") {
      return b.total_amount - a.total_amount;
    }
    return a.customer_name.localeCompare(b.customer_name);
  });

  const getOrderAssignments = (orderId: string) => {
    return assignments.filter(a => a.order_id === orderId);
  };

  const getOrderLogs = (orderId: string) => {
    return workflowLogs.filter(log => log.order_id === orderId);
  };

  const getWorkflowProgress = (status: string) => {
    const currentStep = WORKFLOW_STEPS.find(step => step.status === status);
    return currentStep ? (currentStep.step / WORKFLOW_STEPS.length) * 100 : 0;
  };

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Order Tracking & Management
          </CardTitle>
          <CardDescription>
            Real-time tracking of all orders through the complete workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Orders</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or ID..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {WORKFLOW_STEPS.map(step => (
                    <SelectItem key={step.status} value={step.status}>
                      {step.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="total_amount">Order Value</SelectItem>
                  <SelectItem value="customer_name">Customer Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setSortBy("created_at");
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Orders ({filteredOrders.length})</CardTitle>
              <CardDescription>
                Click on an order to view detailed workflow tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  const orderAssignments = getOrderAssignments(order.id);
                  const progress = getWorkflowProgress(order.status);
                  
                  return (
                    <div
                      key={order.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => onOrderSelect(order)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className="font-medium">{order.customer_name}</span>
                            <Badge className={`${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]} text-white text-xs`}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Order #{order.id.slice(-8)}</div>
                            <div>${order.total_amount.toFixed(2)}</div>
                            <div>{new Date(order.created_at).toLocaleDateString()}</div>
                            {order.property_address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.property_address.slice(0, 30)}...
                              </div>
                            )}
                          </div>

                          {/* Workflow Progress */}
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">Workflow Progress</span>
                              <span className="text-xs font-medium">{progress.toFixed(0)}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>

                          {/* Assignments Preview */}
                          {orderAssignments.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {orderAssignments.map((assignment) => (
                                <Badge key={assignment.id} variant="outline" className="text-xs">
                                  {assignment.role}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {filteredOrders.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">No orders found</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <div>
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Order Details
                </CardTitle>
                <CardDescription>
                  Workflow tracking for order #{selectedOrder.id.slice(-8)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="workflow">Workflow</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Customer Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Name:</strong> {selectedOrder.customer_name}</div>
                        <div><strong>Email:</strong> {selectedOrder.customer_email}</div>
                        <div><strong>Total:</strong> ${selectedOrder.total_amount.toFixed(2)}</div>
                        <div><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                        {selectedOrder.arrival_date && (
                          <div><strong>Arrival:</strong> {new Date(selectedOrder.arrival_date).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>

                    {selectedOrder.property_address && (
                      <div>
                        <h4 className="font-semibold mb-2">Delivery Address</h4>
                        <div className="text-sm text-muted-foreground">
                          {selectedOrder.property_address}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Current Status</h4>
                      <Badge className={`${STATUS_COLORS[selectedOrder.status as keyof typeof STATUS_COLORS]} text-white`}>
                        {selectedOrder.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TabsContent>

                  <TabsContent value="workflow" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Workflow Progress</h4>
                      <div className="space-y-3">
                        {WORKFLOW_STEPS.map((step) => {
                          const isCompleted = WORKFLOW_STEPS.findIndex(s => s.status === selectedOrder.status) >= step.step - 1;
                          const isCurrent = selectedOrder.status === step.status;
                          const StatusIcon = getStatusIcon(step.status);
                          
                          return (
                            <div key={step.status} className={`flex items-center gap-3 p-2 rounded ${
                              isCurrent ? 'bg-primary/10 border border-primary/20' : 
                              isCompleted ? 'bg-green-50 border border-green-200' : 
                              'bg-muted/30'
                            }`}>
                              <div className={`p-1.5 rounded-full ${
                                isCurrent ? 'bg-primary text-white' :
                                isCompleted ? 'bg-green-500 text-white' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                <StatusIcon className="h-3 w-3" />
                              </div>
                              <div className="flex-1">
                                <div className={`text-sm font-medium ${
                                  isCurrent ? 'text-primary' : 
                                  isCompleted ? 'text-green-700' : 
                                  'text-muted-foreground'
                                }`}>
                                  {step.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Step {step.step} of {WORKFLOW_STEPS.length}
                                </div>
                              </div>
                              {isCurrent && (
                                <Badge variant="secondary" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              {isCompleted && !isCurrent && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Recent Activity</h4>
                      <div className="space-y-2">
                        {getOrderLogs(selectedOrder.id).slice(0, 5).map((log) => (
                          <div key={log.id} className="text-sm p-2 bg-muted rounded">
                            <div className="font-medium">{log.action}</div>
                            <div className="text-muted-foreground text-xs">
                              {log.actor_role} • {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="team" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Assigned Team</h4>
                      <div className="space-y-2">
                        {getOrderAssignments(selectedOrder.id).map((assignment) => (
                          <div key={assignment.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <div className="font-medium capitalize">{assignment.role}</div>
                              <div className="text-xs text-muted-foreground">
                                Assigned: {new Date(assignment.assigned_at).toLocaleString()}
                              </div>
                            </div>
                            <Badge variant={assignment.status === 'accepted' ? 'default' : 'secondary'}>
                              {assignment.status}
                            </Badge>
                          </div>
                        ))}
                        
                        {getOrderAssignments(selectedOrder.id).length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No team assignments yet
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">
                    Select an order to view details
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}