import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCardLarge } from './ProductCardLarge';
import { Product, Category } from '@/hooks/useProducts';
import { Link } from 'react-router-dom';

interface CategoryRowLargeProps {
  category: Category;
  products: Product[];
  maxProducts?: number;
}

export function CategoryRowLarge({ category, products, maxProducts = 6 }: CategoryRowLargeProps) {
  const displayProducts = products.slice(0, maxProducts);

  if (displayProducts.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{category.icon}</span>
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {category.name}
            </h2>
            {category.description && (
              <p className="text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
          </div>
        </div>
        <Link to={`/category/${category.id}`}>
          <Button variant="outline" size="lg" className="gap-2">
            View All
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayProducts.map((product) => (
          <ProductCardLarge key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
