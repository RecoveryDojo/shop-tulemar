import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart, Workflow, BarChart3, Users, Shield, Lock } from "lucide-react";

export const Navigation = () => {
  const { user, hasRole } = useAuth();

  const publicRoutes = [
    { path: "/", label: "Shop Home", icon: ShoppingCart, description: "Browse and shop for groceries" },
    { path: "/categories", label: "Categories", icon: ShoppingCart, description: "Product categories" },
    { path: "/how-it-works", label: "How It Works", icon: ShoppingCart, description: "Learn about our service" },
  ];

  const authRequiredRoutes = [
    { path: "/work-tracker", label: "Work Tracker", icon: BarChart3, description: "Project and task management" },
  ];

  const adminRoutes = [
    { path: "/admin", label: "Admin Panel", icon: Shield, description: "User and role management" },
    { path: "/dashboard", label: "Main Dashboard", icon: BarChart3, description: "Business analytics and overview" },
    { path: "/order-workflow", label: "Order Workflow", icon: Workflow, description: "Order tracking and management" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Tulemar Shop - Navigation</h1>
        <p className="text-muted-foreground">Access different areas of the application based on your permissions</p>
      </div>

      {/* Public Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Public Pages
          </CardTitle>
          <CardDescription>Available to everyone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {publicRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Link key={route.path} to={route.path}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{route.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{route.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Authentication Required Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Authentication Required
            <Badge variant="secondary">Login Required</Badge>
          </CardTitle>
          <CardDescription>Available to logged-in users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {authRequiredRoutes.map((route) => {
              const Icon = route.icon;
              const canAccess = !!user;
              
              return (
                <div key={route.path} className={`relative ${!canAccess ? 'opacity-60' : ''}`}>
                  {canAccess ? (
                    <Link to={route.path}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{route.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{route.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <Card className="cursor-not-allowed">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4" />
                          <span className="font-medium">{route.label}</span>
                          <Badge variant="destructive" className="text-xs">Locked</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{route.description}</p>
                        <Button size="sm" variant="outline" className="mt-2" asChild>
                          <Link to="/auth">Sign In to Access</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Admin Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Access
            <Badge variant="destructive">Admin/Sysadmin Only</Badge>
          </CardTitle>
          <CardDescription>Available to administrators only</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminRoutes.map((route) => {
              const Icon = route.icon;
              const canAccess = hasRole('admin') || hasRole('sysadmin');
              
              return (
                <div key={route.path} className={`relative ${!canAccess ? 'opacity-60' : ''}`}>
                  {canAccess ? (
                    <Link to={route.path}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{route.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{route.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <Card className="cursor-not-allowed">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4" />
                          <span className="font-medium">{route.label}</span>
                          <Badge variant="destructive" className="text-xs">Admin Only</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{route.description}</p>
                        {user ? (
                          <p className="text-xs text-muted-foreground mt-2">Contact admin for access</p>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-2" asChild>
                            <Link to="/auth">Sign In</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p><strong>Logged in as:</strong> {user.email}</p>
              <div className="flex gap-2">
                <strong>Roles:</strong>
                {hasRole('admin') && <Badge variant="destructive">Admin</Badge>}
                {hasRole('sysadmin') && <Badge variant="destructive">Sysadmin</Badge>}
                {hasRole('driver') && <Badge variant="secondary">Driver</Badge>}
                {hasRole('concierge') && <Badge variant="secondary">Concierge</Badge>}
                {hasRole('client') && <Badge variant="outline">Client</Badge>}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-4">Not logged in</p>
              <Button asChild>
                <Link to="/auth">Sign In / Sign Up</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};