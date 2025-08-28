import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard,
  Workflow, 
  ShoppingCart,
  Truck,
  Home,
  BarChart3,
  Users,
  Bell,
  Zap,
  Activity,
  Settings,
  Eye,
  Package,
  Clock,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { ShopLayout } from "@/components/shop/ShopLayout";

interface DashboardTab {
  id: string;
  label: string;
  icon: any;
  description: string;
  route: string;
  status: string;
  features: string[];
}

export default function MainDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const workflowTabs: DashboardTab[] = [
    {
      id: "workflow-overview",
      label: "Complete Workflow System",
      icon: Workflow,
      description: "End-to-end order workflow from customer order to kitchen stocking completion",
      route: "/order-workflow",
      status: "Active",
      features: [
        "9-Phase workflow tracking",
        "Real-time status updates", 
        "Stakeholder notifications",
        "Complete workflow documentation"
      ]
    },
    {
      id: "shopper-dashboard",
      label: "Shopper Interface",
      icon: ShoppingCart,
      description: "Shopping management with item scanning, substitutions, and order completion",
      route: "/order-workflow?tab=roles&role=shopper",
      status: "Active",
      features: [
        "Order assignment and management",
        "Item scanning and collection",
        "Substitution request system",
        "Real-time customer communication"
      ]
    },
    {
      id: "driver-dashboard", 
      label: "Driver Interface",
      icon: Truck,
      description: "Delivery management with route optimization and GPS tracking",
      route: "/order-workflow?tab=roles&role=driver",
      status: "Active",
      features: [
        "Route optimization",
        "GPS tracking integration",
        "Customer communication",
        "Delivery confirmation"
      ]
    },
    {
      id: "concierge-dashboard",
      label: "Concierge Interface", 
      icon: Home,
      description: "Property management with kitchen stocking protocols and guest preparation",
      route: "/order-workflow?tab=roles&role=concierge",
      status: "Active",
      features: [
        "Kitchen stocking protocols",
        "Guest preparation checklist",
        "Quality assurance checks",
        "Completion documentation"
      ]
    },
    {
      id: "analytics-dashboard",
      label: "Workflow Analytics",
      icon: BarChart3,
      description: "Performance metrics, bottleneck analysis, and operational insights",
      route: "/order-workflow?tab=analytics",
      status: "Active",
      features: [
        "Phase completion metrics",
        "Bottleneck identification",
        "Performance trends",
        "Stakeholder efficiency"
      ]
    },
    {
      id: "realtime-tracking",
      label: "Real-Time Tracking",
      icon: Activity,
      description: "Live order monitoring with WebSocket updates and status tracking",
      route: "/order-workflow?tab=realtime",
      status: "Active",
      features: [
        "Live order updates",
        "WebSocket integration",
        "Status change notifications",
        "Timeline tracking"
      ]
    },
    {
      id: "automation-system",
      label: "Workflow Automation",
      icon: Zap,
      description: "Automated workflow rules, triggers, and stakeholder assignment",
      route: "/order-workflow?tab=automation",
      status: "Active",
      features: [
        "Automated status transitions",
        "Smart stakeholder assignment",
        "Escalation management",
        "Rule-based notifications"
      ]
    },
    {
      id: "communications",
      label: "Stakeholder Communications",
      icon: Bell,
      description: "Multi-channel notification system with SMS, email, and push notifications",
      route: "/order-workflow?tab=communications",
      status: "Active",
      features: [
        "Multi-channel notifications",
        "SMS/Email/Push integration",
        "Notification templates",
        "Communication logs"
      ]
    }
  ];

  const systemStats = [
    { label: "Active Orders", value: "24", icon: Package, change: "+12%" },
    { label: "Avg. Processing Time", value: "2.5h", icon: Clock, change: "-18%" },
    { label: "Completion Rate", value: "98.5%", icon: CheckCircle2, change: "+2.1%" },
    { label: "Stakeholder Efficiency", value: "94%", icon: Users, change: "+5%" }
  ];

  const recentActivity = [
    { action: "Order #A1B2C3 completed", time: "2 minutes ago", type: "success" },
    { action: "Substitution approved for Order #D4E5F6", time: "8 minutes ago", type: "info" },
    { action: "Delivery started for Order #G7H8I9", time: "15 minutes ago", type: "info" },
    { action: "Kitchen stocking completed", time: "23 minutes ago", type: "success" },
    { action: "New order assigned to team", time: "31 minutes ago", type: "info" }
  ];

  return (
    <ShopLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                  Tulemar Workflow Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                  Complete order workflow management system - from order to kitchen stocking
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live System
                </Badge>
                <Link to="/admin">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">System Overview</TabsTrigger>
              <TabsTrigger value="workflow">Workflow Components</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* System Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemStats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-green-600 mt-1">
                            {stat.change} from last week
                          </p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-full">
                          <stat.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link to="/order-workflow" className="block">
                      <Button className="w-full justify-between" variant="outline">
                        <span className="flex items-center gap-2">
                          <Workflow className="h-4 w-4" />
                          Open Workflow Dashboard
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Link to="/order-workflow?tab=realtime" className="block">
                      <Button className="w-full justify-between" variant="outline">
                        <span className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Real-Time Tracking
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Link to="/order-workflow?tab=analytics" className="block">
                      <Button className="w-full justify-between" variant="outline">
                        <span className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          View Analytics
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Link to="/order-workflow?tab=automation" className="block">
                      <Button className="w-full justify-between" variant="outline">
                        <span className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Automation Settings
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-8">
              {/* Workflow Components Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {workflowTabs.map((tab) => (
                  <Card key={tab.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <tab.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{tab.label}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {tab.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{tab.description}</p>
                      
                      <div className="space-y-2 mb-6">
                        <p className="text-sm font-medium">Key Features:</p>
                        <ul className="space-y-1">
                          {tab.features.map((feature, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link to={tab.route}>
                        <Button className="w-full group">
                          <Eye className="h-4 w-4 mr-2" />
                          Access Dashboard
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ShopLayout>
  );
}