import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCardCompact } from './ProductCardCompact';
import { Product, Category } from '@/hooks/useProducts';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

interface CategoryRowProps {
  category: Category;
  products: Product[];
  maxProducts?: number;
}

export function CategoryRow({ category, products, maxProducts = 8 }: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayProducts = products.slice(0, maxProducts);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (displayProducts.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-3xl">{category.icon}</span>
          {category.name}
        </h2>
        <Link to={`/category/${category.id}`}>
          <Button variant="ghost" className="text-primary hover:text-primary-dark">
            Show all {products.length} products
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 shadow-lg"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayProducts.map((product) => (
            <ProductCardCompact key={product.id} product={product} />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 shadow-lg"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
