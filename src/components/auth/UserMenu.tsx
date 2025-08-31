import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Shield, Settings, ChefHat, LayoutDashboard, Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserMenu = () => {
  const { user, profile, roles, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Button onClick={() => navigate('/auth')} variant="outline">
        Sign In
      </Button>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'sysadmin':
        return 'destructive';
      case 'concierge':
        return 'secondary';
      case 'driver':
        return 'default';
      case 'client':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
            <AvatarFallback>
              {profile?.display_name ? getInitials(profile.display_name) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.display_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {roles.map((role) => (
                <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => navigate('/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Main Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/order-workflow')}>
              <Workflow className="mr-2 h-4 w-4" />
              <span>Order Workflow</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={() => navigate('/work-tracker')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Work Tracker</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/')}>
          <ChefHat className="mr-2 h-4 w-4" />
          <span>Shop</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;