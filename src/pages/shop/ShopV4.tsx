import { ShopLayout } from '@/components/shop/ShopLayout';
import { BottomNavBar } from '@/components/shop/BottomNavBar';
import { CategoryPills } from '@/components/shop/CategoryPills';
import { ProductCardMini } from '@/components/shop/ProductCardMini';
import { useProducts } from '@/hooks/useProducts';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShopV4() {
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
      <div className="min-h-screen pb-20 md:pb-0">
        <CategoryPills
          categories={categories}
          productCounts={productCounts}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />

        <div className="px-3 py-4">
          {loading || loadingCounts ? (
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <Skeleton key={j} className="h-72" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {categoriesWithProducts.map((category) => {
                const categoryProducts = getProductsByCategory(category.id);
                if (categoryProducts.length === 0) return null;

                return (
                  <section key={category.id} id={`category-${category.id}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">
                          {category.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {categoryProducts.length} items
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {categoryProducts.map((product) => (
                        <ProductCardMini key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <BottomNavBar />
      </div>
    </ShopLayout>
  );
}
