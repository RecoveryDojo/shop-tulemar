import { Home, Grid3x3, Search, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

export function BottomNavBar() {
  const location = useLocation();
  const { itemCount } = useCart();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Grid3x3, label: 'Categories', path: '/shop-v4' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: itemCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
