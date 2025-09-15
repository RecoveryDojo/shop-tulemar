import { Link } from 'react-router-dom';
import { ShoppingCart, Users, Truck, UserCheck, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/ui/DashboardHeader';

export default function Homepage() {
  const { user, hasRole } = useAuth();

  const dashboardCards = [
    {
      title: 'Shop',
      description: 'Browse products and place orders',
      icon: ShoppingCart,
      href: '/',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Customer Dashboard',
      description: 'Track your orders and deliveries',
      icon: Users,
      href: '/customer',
      color: 'from-green-500 to-green-600',
      roles: ['customer', 'admin', 'sysadmin']
    },
    {
      title: 'Shopper Dashboard',
      description: 'Manage shopping assignments',
      icon: UserCheck,
      href: '/shopper',
      color: 'from-purple-500 to-purple-600',
      roles: ['shopper', 'admin', 'sysadmin']
    },
    {
      title: 'Driver Dashboard',
      description: 'Handle delivery routes',
      icon: Truck,
      href: '/driver',
      color: 'from-orange-500 to-orange-600',
      roles: ['driver', 'admin', 'sysadmin']
    },
    {
      title: 'Concierge Dashboard',
      description: 'Coordinate guest services',
      icon: Users,
      href: '/concierge',
      color: 'from-teal-500 to-teal-600',
      roles: ['concierge', 'admin', 'sysadmin']
    },
    {
      title: 'Store Manager',
      description: 'Manage inventory and operations',
      icon: BarChart3,
      href: '/store-manager',
      color: 'from-indigo-500 to-indigo-600',
      roles: ['store_manager', 'admin', 'sysadmin']
    },
    {
      title: 'Admin Panel',
      description: 'System administration',
      icon: Settings,
      href: '/admin',
      color: 'from-red-500 to-red-600',
      roles: ['admin', 'sysadmin']
    }
  ];

  const availableCards = dashboardCards.filter(card => 
    !card.roles || card.roles.some(role => hasRole(role as any))
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Tulemar Shop"
        subtitle="Welcome to your dashboard"
        userRole="Platform"
      />

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {user ? `Welcome back!` : 'Welcome to Tulemar Shop'}
          </h2>
          <p className="text-muted-foreground">
            Access your dashboards and manage your activities from one central location.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card key={card.title} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r ${card.color} mb-3`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                    <Link to={card.href}>
                      Access Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!user && (
          <div className="mt-12 text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Sign in to access your personalized dashboard and role-specific features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/auth">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}