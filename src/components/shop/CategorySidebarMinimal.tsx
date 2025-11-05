import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Category } from '@/hooks/useProducts';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CategorySidebarMinimalProps {
  categories: Category[];
  productCounts: Record<string, number>;
  activeCategory?: string;
  onCategoryClick: (categoryId: string) => void;
}

export function CategorySidebarMinimal({ 
  categories, 
  productCounts, 
  activeCategory, 
  onCategoryClick 
}: CategorySidebarMinimalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const categoriesWithProducts = categories.filter(cat => (productCounts[cat.id] || 0) > 0);

  return (
    <>
      <aside 
        className={cn(
          "hidden lg:block border-r border-border bg-card sticky top-0 h-screen transition-all duration-300",
          isExpanded ? "w-60" : "w-[72px]"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className={cn(
          "p-4 border-b border-border flex items-center",
          isExpanded ? "justify-between" : "justify-center"
        )}>
          {isExpanded ? (
            <>
              <h2 className="font-bold text-lg text-foreground">Categories</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setIsExpanded(true)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <nav className="p-2">
            {categoriesWithProducts.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                  "hover:bg-muted",
                  activeCategory === category.id && "bg-primary/10 text-primary font-semibold",
                  !isExpanded && "justify-center"
                )}
                title={!isExpanded ? category.name : undefined}
              >
                <span className="text-2xl">{category.icon}</span>
                {isExpanded && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">
                      {category.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {productCounts[category.id] || 0} items
                    </div>
                  </div>
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
