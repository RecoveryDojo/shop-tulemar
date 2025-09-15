import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ShoppingCart, ChefHat, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  userRole: string;
  onShowGuide?: () => void;
}

export function DashboardHeader({ title, subtitle, userRole, onShowGuide }: DashboardHeaderProps) {
  const { roles } = useAuth();

  return (
    <div className="bg-gradient-to-r from-primary via-primary to-blue-600 text-white">
      {/* Top Brand Bar */}
      <div className="border-b border-white/20 bg-black/10">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">Tulemar Shop</h1>
                <p className="text-xs text-white/80">Premium Grocery Delivery</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <NotificationDropdown 
                userRole={userRole} 
                onViewAll={() => {}}
              />
              <UserProfileMenu />
              {onShowGuide && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowGuide}
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Guide
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Title Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-white/90" />
              <div>
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                <p className="text-white/80 text-lg">{subtitle}</p>
              </div>
            </div>
            
            {/* Role Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {roles.map((role) => (
                <Badge 
                  key={role} 
                  variant="secondary" 
                  className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                >
                  {role.replace('_', ' ').toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="hidden md:flex items-center space-x-4 opacity-60">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="h-4 bg-gradient-to-b from-transparent to-background/20"></div>
    </div>
  );
}