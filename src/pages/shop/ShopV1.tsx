import { ShopLayout } from '@/components/shop/ShopLayout';
import { CategorySidebar } from '@/components/shop/CategorySidebar';
import { CategoryIconStrip } from '@/components/shop/CategoryIconStrip';
import { CategoryRow } from '@/components/shop/CategoryRow';
import { useProducts } from '@/hooks/useProducts';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShopV1() {
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
        <CategorySidebar
          categories={categories}
          productCounts={productCounts}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />

        <main className="flex-1">
          <CategoryIconStrip
            categories={categories}
            productCounts={productCounts}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
          />

          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Shop by Category
              </h1>
              <p className="text-muted-foreground">
                Browse our fresh selection of local Costa Rican products
              </p>
            </div>

            {loading || loadingCounts ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-8 w-64 mb-4" />
                    <div className="flex gap-4">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <Skeleton key={j} className="h-64 w-[200px] flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {categoriesWithProducts.map((category) => (
                  <div key={category.id} id={`category-${category.id}`}>
                    <CategoryRow
                      category={category}
                      products={getProductsByCategory(category.id)}
                      maxProducts={8}
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
