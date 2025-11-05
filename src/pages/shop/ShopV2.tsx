import { ShopLayout } from '@/components/shop/ShopLayout';
import { CategorySidebarMinimal } from '@/components/shop/CategorySidebarMinimal';
import { CategoryGridSection } from '@/components/shop/CategoryGridSection';
import { useProducts } from '@/hooks/useProducts';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShopV2() {
  const { categories, products, loading, getCategoryProductCounts, fetchProductsByCategory } = useProducts({ autoLoad: false });
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
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

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    document.getElementById(`category-${categoryId}`)?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

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
      <div className="flex min-h-screen">
        <CategorySidebarMinimal
          categories={categories}
          productCounts={productCounts}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />

        <main className="flex-1 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-card rounded-xl shadow-md p-6 mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Browse Our Products
              </h1>
              <p className="text-lg text-muted-foreground">
                Fresh, local groceries delivered to your Costa Rican vacation rental
              </p>
            </div>

            {loading || loadingCounts ? (
              <div className="space-y-12">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-10 w-64 mb-6" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <Skeleton key={j} className="h-96" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {categoriesWithProducts.map((category) => (
                  <div key={category.id} id={`category-${category.id}`}>
                    <CategoryGridSection
                      category={category}
                      products={getProductsByCategory(category.id)}
                      initialCount={12}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ShopLayout>
  );
}
