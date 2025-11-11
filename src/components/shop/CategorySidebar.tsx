import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Category } from '@/hooks/useProducts';

interface CategorySidebarProps {
  categories: Category[];
  productCounts: Record<string, number>;
  activeCategory?: string;
  onCategoryClick: (categoryId: string) => void;
}

export function CategorySidebar({ 
  categories, 
  productCounts, 
  activeCategory, 
  onCategoryClick 
}: CategorySidebarProps) {
  const categoriesWithProducts = categories.filter(cat => (productCounts[cat.id] || 0) > 0);

  return (
    <aside className="hidden lg:block w-56 border-r border-border bg-card sticky top-0 h-screen">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg text-foreground">Categories</h2>
      </div>
      
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <nav className="p-2">
          {categoriesWithProducts.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={cn(
                "w-full flex items-center gap-2.5 p-3.5 rounded-lg transition-all text-left",
                "hover:bg-muted",
                activeCategory === category.id && "bg-primary/10 text-primary font-semibold"
              )}
            >
              <span className="text-xl">{category.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-sm">
                  {category.name}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {productCounts[category.id] || 0}
              </Badge>
            </button>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
