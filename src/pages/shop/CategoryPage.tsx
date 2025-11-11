import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { VirtualGrid } from "@/components/ui/virtual-grid";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { debounce } from "@/utils/performance";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const { products, categories, loading, categoryLoading, fetchProductsByCategory } = useProducts({ includeTest: false, autoLoad: false });
  const { itemCount } = useCart();

  // Debounce search input
  const debouncedSetSearch = useMemo(
    () => debounce((query: string) => setDebouncedSearchQuery(query), 300),
    []
  );

  const category = categories.find(cat => cat.id === categoryId);

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    }
  }, [categoryId, fetchProductsByCategory]);

  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return products;
    
    const query = debouncedSearchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  }, [products, debouncedSearchQuery]);

  if (loading || categoryLoading) {
    return (
      <ShopLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ShopLayout>
    );
  }

  if (!category) {
    return (
      <ShopLayout>
        <div className="max-w-4xl mx-auto py-20 px-4 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Category Not Found</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The category you're looking for doesn't exist.
          </p>
          <Link to="/store">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
          </Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="bg-background">
        {/* Header */}
        <section className="bg-gradient-tropical text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center mb-4">
              <Link to="/store" className="mr-4">
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Categories
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">{category.icon}</div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">{category.name}</h1>
                <p className="text-xl text-white/90 mt-2">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products and Sidebar */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Search */}
                <div className="relative mb-8">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={`Search ${category.name.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 py-3"
                  />
                </div>

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                  <VirtualGrid
                    items={filteredProducts}
                    renderItem={(product) => (
                      <ProductCard key={product.id} product={product} />
                    )}
                    itemsPerPage={12}
                    loadingComponent={<LoadingSpinner text="Loading more products..." />}
                  />
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? `No products match "${searchQuery}" in this category.`
                        : `This category doesn't have any products available at the moment.`
                      }
                    </p>
                    {searchQuery ? (
                      <Button onClick={() => setSearchQuery('')} variant="outline">
                        Clear search
                      </Button>
                    ) : (
                      <Link to="/store">
                        <Button variant="outline">
                          Browse Other Categories
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="space-y-6 sticky top-6">
                  <Card className="shadow-elegant">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{category.icon}</span>
                        {category.name}
                      </CardTitle>
                      <CardDescription>
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="shadow-elegant">
                    <CardHeader>
                      <CardTitle>Delivery Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Free delivery to your rental</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Fresh, local products</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Pre-arrival stocking available</span>
                      </div>
                    </CardContent>
                  </Card>

                  {itemCount > 0 && (
                    <Card className="shadow-elegant">
                      <CardHeader>
                        <CardTitle>Your Cart</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
                        </p>
                        <Link to="/cart">
                          <Button className="w-full bg-gradient-tropical hover:opacity-90 text-white">
                            View Cart
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ShopLayout>
  );
}