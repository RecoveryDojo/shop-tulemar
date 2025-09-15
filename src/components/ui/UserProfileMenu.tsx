import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  ShoppingCart, 
  Truck, 
  Users, 
  Shield, 
  MessageCircle,
  Calendar,
  BarChart3,
  Bell,
  MapPin,
  Clock,
  FileText,
  Package,
  CreditCard,
  Award
} from 'lucide-react';

export function UserProfileMenu() {
  const { user, profile, roles, signOut } = useAuth();

  if (!user) return null;

  // Get user's first initial
  const firstInitial = profile?.display_name?.charAt(0)?.toUpperCase() || 
                      user.email?.charAt(0)?.toUpperCase() || 
                      'U';

  // Define role-specific navigation items
  const getRoleSpecificItems = () => {
    const items: Array<{ icon: any, label: string, href: string, description: string }> = [];

    // Common items for all authenticated users
    items.push(
      { icon: MessageCircle, label: 'Messages', href: '/profile?tab=messages', description: 'View your inbox' },
      { icon: Bell, label: 'Notifications', href: '/profile?tab=notifications', description: 'Manage alerts' }
    );

    // Role-specific items
    if (roles.includes('admin') || roles.includes('sysadmin')) {
      items.push(
        { icon: Shield, label: 'Admin Panel', href: '/admin', description: 'User & system management' },
        { icon: BarChart3, label: 'Analytics', href: '/dashboard', description: 'Business insights' },
        { icon: Users, label: 'Order Workflow', href: '/order-workflow', description: 'Manage operations' }
      );
    }

    if (roles.includes('store_manager')) {
      items.push(
        { icon: Package, label: 'Store Management', href: '/store-manager', description: 'Inventory & staff' },
        { icon: FileText, label: 'Reports', href: '/store-manager?tab=reports', description: 'Store performance' },
        { icon: Users, label: 'Staff Schedule', href: '/store-manager?tab=schedule', description: 'Manage team' }
      );
    }

    if (roles.includes('shopper')) {
      items.push(
        { icon: ShoppingCart, label: 'Shopping Dashboard', href: '/shopper', description: 'Active orders & tasks' },
        { icon: MapPin, label: 'Store Locations', href: '/shopper?tab=locations', description: 'Find nearby stores' },
        { icon: Award, label: 'Performance', href: '/shopper?tab=stats', description: 'Your shopping stats' }
      );
    }

    if (roles.includes('driver')) {
      items.push(
        { icon: Truck, label: 'Driver Dashboard', href: '/driver', description: 'Delivery routes & status' },
        { icon: MapPin, label: 'Routes', href: '/driver?tab=routes', description: 'Optimize deliveries' },
        { icon: Clock, label: 'Schedule', href: '/driver?tab=schedule', description: 'Your driving hours' }
      );
    }

    if (roles.includes('concierge')) {
      items.push(
        { icon: Users, label: 'Concierge Dashboard', href: '/concierge', description: 'Guest services' },
        { icon: Calendar, label: 'Property Calendar', href: '/concierge?tab=calendar', description: 'Guest schedules' },
        { icon: Bell, label: 'Service Requests', href: '/concierge?tab=requests', description: 'Guest needs' }
      );
    }

    if (roles.includes('client')) {
      items.push(
        { icon: ShoppingCart, label: 'My Orders', href: '/customer', description: 'Track your orders' },
        { icon: CreditCard, label: 'Payment Methods', href: '/customer?tab=payments', description: 'Manage billing' },
        { icon: Calendar, label: 'Delivery Schedule', href: '/customer?tab=schedule', description: 'Plan deliveries' }
      );
    }

    return items;
  };

  const roleItems = getRoleSpecificItems();
  const dashboards = [
    ...(roles.includes('shopper') ? [{ icon: ShoppingCart, label: 'Shopper Dashboard', href: '/shopper' }] : []),
    ...(roles.includes('driver') ? [{ icon: Truck, label: 'Driver Dashboard', href: '/driver' }] : []),
    ...(roles.includes('concierge') ? [{ icon: Users, label: 'Concierge Dashboard', href: '/concierge' }] : []),
    ...(roles.includes('store_manager') ? [{ icon: Package, label: 'Store Manager Dashboard', href: '/store-manager' }] : []),
    ...((roles.includes('admin') || roles.includes('sysadmin')) ? [{ icon: Shield, label: 'Admin Dashboard', href: '/admin' }] : []),
    ...(roles.includes('client') ? [{ icon: ShoppingCart, label: 'Customer Dashboard', href: '/customer' }] : []),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-auto p-2 hover:bg-muted/50">
          <div className="flex flex-col items-center space-y-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                {firstInitial}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">Profile</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="z-50 w-80">
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {firstInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {roles.map((role) => (
              <Badge key={role} variant="secondary" className="text-xs">
                {role.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">My Profile</div>
              <div className="text-xs text-muted-foreground">Edit your information</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        {dashboards.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Your Dashboards
            </DropdownMenuLabel>
            {dashboards.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link to={item.href} className="flex items-center cursor-pointer">
                  <item.icon className="mr-2 h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
          Quick Access
        </DropdownMenuLabel>
        {roleItems.slice(0, 6).map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link to={item.href} className="flex items-center cursor-pointer">
              <item.icon className="mr-2 h-4 w-4" />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}

        {roleItems.length > 6 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/navigation" className="flex items-center cursor-pointer text-muted-foreground">
                <Settings className="mr-2 h-4 w-4" />
                <span>View All Options...</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}