import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Category } from '@/hooks/useProducts';
import { Link } from 'react-router-dom';

interface CategoryMegaMenuProps {
  categories: Category[];
  productCounts: Record<string, number>;
}

export function CategoryMegaMenu({ categories, productCounts }: CategoryMegaMenuProps) {
  const categoriesWithProducts = categories.filter(cat => (productCounts[cat.id] || 0) > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          Browse Categories
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[600px] p-4" align="start">
        <div className="grid grid-cols-3 gap-2">
          {categoriesWithProducts.map((category) => (
            <Link key={category.id} to={`/category/${category.id}`}>
              <DropdownMenuItem className="cursor-pointer p-3 flex flex-col items-start gap-2 h-auto">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {category.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {productCounts[category.id] || 0} items
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
