import { cn } from '@/lib/utils';
import { Category } from '@/hooks/useProducts';

interface CategoryIconStripProps {
  categories: Category[];
  productCounts: Record<string, number>;
  activeCategory?: string;
  onCategoryClick: (categoryId: string) => void;
}

export function CategoryIconStrip({ 
  categories, 
  productCounts, 
  activeCategory, 
  onCategoryClick 
}: CategoryIconStripProps) {
  const categoriesWithProducts = categories.filter(cat => (productCounts[cat.id] || 0) > 0);

  return (
    <div className="border-b border-border bg-card sticky top-0 z-10">
      <div className="overflow-x-auto">
        <div className="flex gap-2 p-4 min-w-max">
          {categoriesWithProducts.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-[80px]",
                "hover:bg-muted",
                activeCategory === category.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/50"
              )}
            >
              <span className="text-3xl">{category.icon}</span>
              <span className="text-xs font-medium text-center line-clamp-2">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
