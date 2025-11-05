import { Button } from '@/components/ui/button';
import { ProductCardMedium } from './ProductCardMedium';
import { Product, Category } from '@/hooks/useProducts';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

interface CategoryGridSectionProps {
  category: Category;
  products: Product[];
  initialCount?: number;
}

export function CategoryGridSection({ 
  category, 
  products, 
  initialCount = 12 
}: CategoryGridSectionProps) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const displayProducts = products.slice(0, displayCount);
  const hasMore = products.length > displayCount;

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 12, products.length));
  };

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">{category.icon}</span>
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {category.name}
          </h2>
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'} available
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayProducts.map((product) => (
          <ProductCardMedium key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button 
            onClick={loadMore} 
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            Load More ({products.length - displayCount} remaining)
          </Button>
        </div>
      )}

      <Separator className="mt-12" />
    </section>
  );
}
