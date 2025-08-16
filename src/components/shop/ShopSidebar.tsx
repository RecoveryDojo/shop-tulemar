import { Home, Grid, Package, Info, ShoppingCart } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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
  { title: "Shop Home", url: "/shop", icon: Home },
  { title: "Browse Categories", url: "/shop/categories", icon: Grid },
  { title: "Place Order", url: "/shop/order", icon: Package },
  { title: "How It Works", url: "/shop/how-it-works", icon: Info },
];

export function ShopSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

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
                      end={item.url === "/shop"}
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
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