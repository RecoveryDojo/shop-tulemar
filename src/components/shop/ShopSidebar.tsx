import { Home, Grid, Package, Info, ShoppingCart } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Shop Home", url: "/", icon: Home },
  { title: "Browse Categories", url: "/categories", icon: Grid },
  { title: "Shopping Cart", url: "/cart", icon: ShoppingCart, showBadge: true },
  { title: "Place Order", url: "/order", icon: Package },
  { title: "How It Works", url: "/how-it-works", icon: Info },
];

export function ShopSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { itemCount } = useCart();

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-tropical p-2 rounded-lg flex-shrink-0">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg text-foreground">Tulemar Shop</h2>
                <p className="text-sm text-muted-foreground">Grocery Delivery</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <div className="flex items-center relative">
                        <item.icon className="mr-3 h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                        {item.showBadge && itemCount > 0 && (
                          <Badge 
                            className="ml-auto h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs"
                          >
                            {itemCount}
                          </Badge>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}