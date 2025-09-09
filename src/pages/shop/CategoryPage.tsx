import { useParams, Link } from 'react-router-dom';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const { products, categories, loading, categoryLoading, fetchProductsByCategory } = useProducts();
  const { itemCount } = useCart();

  const category = categories.find(cat => cat.id === categoryId);

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    }
  }, [categoryId]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  if (loading || categoryLoading) {
    return (
      <ShopLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (!category) {
    return (
      <ShopLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The category you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/categories">
              <Button className="bg-gradient-tropical hover:opacity-90 text-white">
                Back to Categories
              </Button>
            </Link>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/categories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              <p className="text-muted-foreground">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No products match "${searchQuery}" in this category.`
                    : "This category doesn't have any products yet."
                  }
                </p>
                {searchQuery && (
                  <Button onClick={() => setSearchQuery('')} variant="outline">
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Category Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-border sticky top-4">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
                
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-foreground mb-2">Delivery Info</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Fresh daily delivery</li>
                    <li>• 2-4 hour delivery window</li>
                    <li>• Free delivery over $50</li>
                    <li>• Delivered to your rental</li>
                  </ul>
                </div>

                {itemCount > 0 && (
                  <div className="border-t border-border pt-4">
                    <Link to="/cart">
                      <Button className="w-full bg-gradient-tropical hover:opacity-90 text-white">
                        View Cart ({itemCount})
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}