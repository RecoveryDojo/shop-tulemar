import { useState, useCallback } from 'react';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { ProductCard } from '@/components/shop/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export default function ShopSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { searchProducts, categories, products, searchLoading } = useProducts({ autoLoad: false });
  const { itemCount } = useCart();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    await searchProducts(searchQuery);
  }, [searchQuery, searchProducts]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <ShopLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Search Products</h1>
            <p className="text-muted-foreground">
              Find exactly what you need for your Costa Rican vacation
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for mangoes, coffee, seafood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 text-lg"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searchLoading}
              className="bg-gradient-tropical hover:opacity-90 text-white px-8"
            >
              {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Categories Quick Links */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Browse by Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link key={category.id} to={`/category/${category.id}`}>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors p-2"
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div>
              {searchLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length > 0 ? (
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-6">
                    Search Results for "{searchQuery}" ({products.length} found)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find any products matching "{searchQuery}". Try different keywords or browse our categories.
                  </p>
                  <Link to="/">
                    <Button className="bg-gradient-tropical hover:opacity-90 text-white">
                      Browse All Categories
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Popular Searches */}
          {!hasSearched && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Popular Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Mango', 'Coffee', 'Seafood', 'Plantain', 'Avocado', 'Pineapple', 'Rice', 'Beans'].map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setSearchQuery(term);
                        setHasSearched(true);
                        await searchProducts(term);
                      }}
                      className="text-sm"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fixed Cart Button */}
        {itemCount > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Link to="/cart">
              <Button 
                className="bg-gradient-tropical hover:opacity-90 text-white shadow-elegant rounded-full h-14 w-14 flex items-center justify-center"
                size="lg"
              >
                🛒 {itemCount}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}