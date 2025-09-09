import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingCart, 
  Truck, 
  Home, 
  Shield, 
  Users, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Camera,
  Package,
  QrCode,
  MessageSquare,
  Star,
  AlertTriangle,
  Target,
  Eye,
  Store
} from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
  property_address: string;
}

interface StakeholderAssignment {
  id: string;
  order_id: string;
  role: string;
  user_id: string;
  status: string;
  assigned_at: string;
}

interface WorkflowLog {
  id: string;
  order_id: string;
  phase: string;
  action: string;
  actor_role: string;
  timestamp: string;
}

interface RoleBasedDashboardProps {
  orders: Order[];
  assignments: StakeholderAssignment[];
  workflowLogs: WorkflowLog[];
}

export function RoleBasedDashboard({ orders, assignments, workflowLogs }: RoleBasedDashboardProps) {
  const [selectedRole, setSelectedRole] = useState("shopper");

  const getOrdersForRole = (role: string) => {
    const roleAssignments = assignments.filter(a => a.role === role);
    return orders.filter(order => 
      roleAssignments.some(assignment => assignment.order_id === order.id)
    );
  };

  const getActiveOrdersForRole = (role: string) => {
    return getOrdersForRole(role).filter(order => 
      !['completed', 'cancelled'].includes(order.status)
    );
  };

  const ShopperDashboard = () => {
    const shopperOrders = getActiveOrdersForRole('shopper');
    const shoppingOrders = shopperOrders.filter(o => o.status === 'shopping');
    const pendingOrders = shopperOrders.filter(o => ['assigned', 'confirmed'].includes(o.status));

    return (
      <div className="space-y-6">
        {/* Shopper KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{shopperOrders.length}</div>
              <p className="text-xs text-muted-foreground">Currently assigned</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Shopping Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{shoppingOrders.length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Accept</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">94.2%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Shopper Interface Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Interface
              </CardTitle>
              <CardDescription>
                Mobile-first shopping experience with scanning and substitutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Key Features:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <span className="text-sm">Barcode scanning for verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span className="text-sm">Photo substitution requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">Real-time customer chat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Item-by-item checklist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Out-of-stock notifications</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Current Order Progress</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Order #12345</span>
                      <Badge variant="secondary">24 items</Badge>
                    </div>
                    <Progress value={65} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      16 of 24 items collected • 2 substitutions pending
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Assignment System</CardTitle>
              <CardDescription>
                Intelligent assignment based on location and availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Assignment Criteria:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Proximity to store location</div>
                    <div>• Shopper availability schedule</div>
                    <div>• Previous performance metrics</div>
                    <div>• Customer preference matching</div>
                    <div>• Order complexity and size</div>
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">15-Minute Response Window</h4>
                  <div className="text-sm text-muted-foreground">
                    Shoppers have 15 minutes to accept assigned orders before automatic reassignment
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const DriverDashboard = () => {
    const driverOrders = getActiveOrdersForRole('driver');
    const deliveryOrders = driverOrders.filter(o => o.status === 'out_for_delivery');
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{deliveryOrders.length}</div>
              <p className="text-xs text-muted-foreground">En route</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Route Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">92.5%</div>
              <p className="text-xs text-muted-foreground">Optimal routing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">96.8%</div>
              <p className="text-xs text-muted-foreground">Delivery performance</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">4.9</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Management
              </CardTitle>
              <CardDescription>
                GPS tracking and route optimization features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Key Features:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Real-time GPS tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="text-sm">Route optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span className="text-sm">Proof of delivery photos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">ETA calculations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">Customer communication</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temperature Control Tracking</CardTitle>
              <CardDescription>
                Monitoring for temperature-sensitive items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Special Handling:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Frozen items temperature monitoring</div>
                    <div>• Refrigerated goods tracking</div>
                    <div>• Hot food delivery timing</div>
                    <div>• Fragile item protection</div>
                    <div>• Wine and alcohol handling</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const ConciergeDashboard = () => {
    const conciergeOrders = getActiveOrdersForRole('concierge');
    const stockingOrders = conciergeOrders.filter(o => ['arrived', 'stocking'].includes(o.status));
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Stocking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stockingOrders.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting stocking</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Properties Served</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">12</div>
              <p className="text-xs text-muted-foreground">Active properties</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stocking Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">99.1%</div>
              <p className="text-xs text-muted-foreground">Quality score</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Guest Satisfaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">4.8</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Kitchen Stocking Protocol
              </CardTitle>
              <CardDescription>
                Standardized procedures for kitchen preparation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Stocking Checklist:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Verify items against order</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="text-sm">Temperature-appropriate storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span className="text-sm">Photo documentation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">Presentation standards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Expiration date organization</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Preparation Guidelines</CardTitle>
              <CardDescription>
                Preparing properties for guest arrival
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Preparation Standards:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Fresh produce placement and presentation</div>
                    <div>• Proper refrigerator/freezer organization</div>
                    <div>• Pantry item arrangement</div>
                    <div>• Welcome note and instructions</div>
                    <div>• Emergency contact information</div>
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Quality Verification</h4>
                  <div className="text-sm text-muted-foreground">
                    Final inspection and photo documentation before guest arrival
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const totalActiveOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
    const totalAssignments = assignments.length;
    const recentLogs = workflowLogs.slice(0, 10);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalActiveOrders}</div>
              <p className="text-xs text-muted-foreground">In workflow</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Team Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalAssignments}</div>
              <p className="text-xs text-muted-foreground">Active assignments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">94.7%</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Escalations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Workflow Oversight
              </CardTitle>
              <CardDescription>
                Complete system monitoring and control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Admin Capabilities:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Real-time order monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Team performance tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Escalation management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">Communication oversight</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">Quality assurance</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
              <CardDescription>
                Latest workflow events across all orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="text-sm font-medium">{log.action}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.phase} • {log.actor_role}
                      </div>
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
      </div>
    );
  };

  const StoreManagerDashboard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Store Manager Interface
        </CardTitle>
        <CardDescription>
          Coordinate operations, manage shoppers, and ensure quality service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Core Responsibilities:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Order assignment and shopper coordination</div>
                <div>• Quality assurance and substitution oversight</div>
                <div>• Inventory coordination with store staff</div>
                <div>• Performance monitoring and optimization</div>
                <div>• Real-time issue resolution</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Current Operations:</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Active Orders:</span>
                  <Badge>{orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Shoppers:</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avg Order Time:</span>
                  <Badge variant="outline">28m</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">Quick Actions</h4>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => window.location.href = '/store-manager'}>
                <Eye className="h-4 w-4 mr-1" />
                Full Dashboard
              </Button>
              <Button size="sm" variant="outline">
                <Users className="h-4 w-4 mr-1" />
                Manage Shoppers
              </Button>
              <Button size="sm" variant="outline">
                <Package className="h-4 w-4 mr-1" />
                Inventory Status
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const roleComponents = {
    shopper: ShopperDashboard,
    driver: DriverDashboard,
    concierge: ConciergeDashboard,
    store_manager: StoreManagerDashboard,
    admin: AdminDashboard
  };

  const CurrentDashboard = roleComponents[selectedRole as keyof typeof roleComponents];

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      <div className="flex justify-center">
        <Tabs value={selectedRole} onValueChange={setSelectedRole}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="shopper" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Shopper
            </TabsTrigger>
            <TabsTrigger value="driver" className="gap-2">
              <Truck className="h-4 w-4" />
              Driver
            </TabsTrigger>
            <TabsTrigger value="concierge" className="gap-2">
              <Home className="h-4 w-4" />
              Concierge
            </TabsTrigger>
            <TabsTrigger value="store_manager" className="gap-2">
              <Store className="h-4 w-4" />
              Store Manager
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Role-Specific Dashboard */}
      <CurrentDashboard />
    </div>
  );
}