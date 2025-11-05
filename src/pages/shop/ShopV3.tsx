import { ShopLayout } from '@/components/shop/ShopLayout';
import { CategoryMegaMenu } from '@/components/shop/CategoryMegaMenu';
import { CategoryRowLarge } from '@/components/shop/CategoryRowLarge';
import { useProducts } from '@/hooks/useProducts';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ShopV3() {
  const { categories, products, loading, getCategoryProductCounts, fetchProductsByCategory } = useProducts({ autoLoad: false });
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    const loadCounts = async () => {
      if (categories.length > 0) {
        setLoadingCounts(true);
        const counts = await getCategoryProductCounts();
        setProductCounts(counts);
        setLoadingCounts(false);
      }
    };
    loadCounts();
  }, [categories, getCategoryProductCounts]);

  const categoriesWithProducts = categories.filter(cat => (productCounts[cat.id] || 0) > 0);

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId);
  };

  // Load all products on mount
  useEffect(() => {
    if (categories.length > 0) {
      categories.forEach(cat => {
        if ((productCounts[cat.id] || 0) > 0) {
          fetchProductsByCategory(cat.id);
        }
      });
    }
  }, [categories, productCounts]);

  return (
    <ShopLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Fresh Local Groceries
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Delivered to your Costa Rican vacation rental. Browse our premium selection 
            of local products and essentials.
          </p>
          
          <div className="max-w-xl mx-auto flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for products..." 
                className="pl-10 h-12 text-lg"
              />
            </div>
            <CategoryMegaMenu 
              categories={categories}
              productCounts={productCounts}
            />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <div className="max-w-6xl mx-auto px-4">
        {loading || loadingCounts ? (
          <div className="space-y-16 py-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-12 w-80 mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} className="h-[450px]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {categoriesWithProducts.map((category, index) => (
              <div key={category.id}>
                <CategoryRowLarge
                  category={category}
                  products={getProductsByCategory(category.id)}
                  maxProducts={6}
                />
                {index < categoriesWithProducts.length - 1 && (
                  <Separator className="my-8" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
