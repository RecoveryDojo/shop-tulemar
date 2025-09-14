import { useState } from "react";
import { Home, Grid, Package, Info, ShoppingCart, Menu, X, Target, LayoutDashboard, Star, Zap, Truck, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/auth/UserMenu";
import { UserProfileMenu } from "@/components/ui/UserProfileMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { title: "Shop Home", url: "/", icon: Home },
  { title: "Browse Categories", url: "/categories", icon: Grid },
  { title: "Shopping Cart", url: "/cart", icon: ShoppingCart, showBadge: true },
  { title: "Place Order", url: "/order", icon: Package },
  { title: "How It Works", url: "/how-it-works", icon: Info },
  { title: "Workflow Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Work Tracker", url: "/work-tracker", icon: Target },
];

export function ShopNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();
  const { user, hasRole } = useAuth();

  // Add role-specific navigation items
  const getRoleSpecificItems = () => {
    const roleItems = [];
    
    if (hasRole('shopper')) {
      roleItems.push({ title: "Shopper Dashboard", url: "/shopper", icon: ShoppingCart });
    }
    if (hasRole('driver')) {
      roleItems.push({ title: "Driver Dashboard", url: "/driver", icon: Truck });
    }
    if (hasRole('concierge')) {
      roleItems.push({ title: "Concierge Dashboard", url: "/concierge", icon: Users });
    }
    if (hasRole('admin') || hasRole('sysadmin')) {
      roleItems.push({ title: "Order Workflow", url: "/order-workflow", icon: LayoutDashboard });
    }
    
    return roleItems;
  };

  const allNavigationItems = [...navigationItems, ...getRoleSpecificItems()];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === path;
  };

  return (
    <header className="h-16 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 px-4">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="bg-gradient-tropical p-2 rounded-lg">
          <ShoppingCart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-foreground">Tulemar Shop</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Grocery Delivery</p>
        </div>
      </NavLink>

      
      {/* Sign In CTA & Menu */}
      <div className="flex items-center gap-3">
        {!user ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col text-right text-xs">
              <span className="text-primary font-medium">Free delivery today!</span>
            </div>
            <Button 
              variant="default" 
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 group relative overflow-hidden"
              asChild
            >
              <NavLink to="/auth" className="flex items-center gap-2 px-4 py-2">
                <Zap className="h-4 w-4 group-hover:animate-pulse" />
                <span className="font-medium">Sign In</span>
                <div className="absolute inset-0 bg-white/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              </NavLink>
            </Button>
          </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserProfileMenu />
            </div>
          )}
        
        {/* Dropdown Navigation */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative">
              {isOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Menu</span>
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-background border border-border shadow-lg z-[9999]"
            sideOffset={5}
          >
            {allNavigationItems.map((item, index) => (
              <div key={item.title}>
                <DropdownMenuItem asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/"}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 w-full px-3 py-2 text-sm cursor-pointer rounded-sm ${
                      isActive(item.url)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                    {item.showBadge && itemCount > 0 && (
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs">
                        {itemCount}
                      </Badge>
                    )}
                  </NavLink>
                </DropdownMenuItem>
                {index < allNavigationItems.length - 1 && (index === 2 || index === 5 || index === 8) && (
                  <DropdownMenuSeparator />
                )}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}