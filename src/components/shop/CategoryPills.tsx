import { cn } from '@/lib/utils';
import { Category } from '@/hooks/useProducts';

interface CategoryPillsProps {
  categories: Category[];
  productCounts: Record<string, number>;
  activeCategory?: string;
  onCategoryClick: (categoryId: string) => void;
}

export function CategoryPills({ 
  categories, 
  productCounts, 
  activeCategory, 
  onCategoryClick 
}: CategoryPillsProps) {
  const categoriesWithProducts = categories.filter(cat => (productCounts[cat.id] || 0) > 0);

  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border">
      <div className="overflow-x-auto">
        <div className="flex gap-2 p-3 min-w-max">
          {categoriesWithProducts.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                "border border-border",
                activeCategory === category.id 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background hover:bg-muted"
              )}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
