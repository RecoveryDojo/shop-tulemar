import { useEffect, useRef, useState } from 'react';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { CategoryIconStrip } from '@/components/shop/CategoryIconStrip';
import { CategorySidebar } from '@/components/shop/CategorySidebar';
import { CategoryRow } from '@/components/shop/CategoryRow';
import { BottomNavBar } from '@/components/shop/BottomNavBar';
import { useProducts } from '@/hooks/useProducts';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Store() {
  const { categories, products, loading, getCategoryProductCounts } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string>();
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  // Load product counts
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

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    // Smooth scroll to category section
    const element = categoryRefs.current[categoryId];
    if (element) {
      const offset = 180; // Account for sticky headers
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Track which category is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    categoriesWithProducts.forEach((category) => {
      const element = categoryRefs.current[category.id];
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveCategory(category.id);
              }
            });
          },
          {
            rootMargin: '-200px 0px -50% 0px',
            threshold: 0
          }
        );

        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [categoriesWithProducts]);

  if (loading || loadingCounts) {
    return (
      <ShopLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="w-full">
        {/* Category Icon Strip - Mobile & Desktop */}
        <div className="sticky top-0 z-30">
          <CategoryIconStrip
            categories={categoriesWithProducts}
            productCounts={productCounts}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
          />
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex w-full">
          {/* Category Sidebar - Desktop Only */}
          <CategorySidebar
            categories={categoriesWithProducts}
            productCounts={productCounts}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
          />

          {/* Main Content Area */}
          <main className="flex-1 w-full">
            <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
              {categoriesWithProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No products available at the moment.</p>
                </div>
              ) : (
                categoriesWithProducts.map((category) => {
                  const categoryProducts = products.filter(p => p.category_id === category.id);
                  
                  return (
                    <div
                      key={category.id}
                      ref={(el) => (categoryRefs.current[category.id] = el)}
                      className="mb-8"
                    >
                      <CategoryRow
                        category={category}
                        products={categoryProducts}
                        maxProducts={12}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNavBar />
      </div>
    </ShopLayout>
  );
}
