import { useState } from "react";
import { Home, Grid, Package, Info, ShoppingCart, Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
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
];

export function ShopNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === path;
  };

  return (
    <header className="h-16 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-tropical p-2 rounded-lg">
          <ShoppingCart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-foreground">Tulemar Shop</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Grocery Delivery</p>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.showBadge && itemCount > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs">
                {itemCount}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              {isOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-background border border-border shadow-lg z-50"
            sideOffset={5}
          >
            {navigationItems.map((item, index) => (
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
                {index < navigationItems.length - 1 && index === 2 && (
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