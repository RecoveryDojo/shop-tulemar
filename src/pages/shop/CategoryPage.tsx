import { useParams, Link } from 'react-router-dom';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { ProductCard } from '@/components/shop/ProductCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import { useState, useMemo } from 'react';
import { products, categories } from '@/data/products';
import { useCart } from '@/contexts/CartContext';

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount } = useCart();

  const category = categories.find(cat => cat.id === categoryId);
  const categoryProducts = categoryId ? products[categoryId] || [] : [];

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return categoryProducts;
    
    return categoryProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.origin && product.origin.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categoryProducts, searchQuery]);

  if (!category) {
    return (
      <ShopLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
            <Link to="/categories">
              <Button>Back to Categories</Button>
            </Link>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <Link to="/categories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl sm:text-3xl">{category.icon}</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{category.name}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {filteredProducts.length} products available
                </p>
              </div>
            </div>
            
            <div className="w-full sm:w-auto">
              <Link to="/cart" className="block">
                <Button className="w-full sm:w-auto bg-gradient-tropical hover:opacity-90 text-white relative">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">View Cart</span>
                  <span className="sm:hidden">Cart</span>
                  {itemCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs"
                    >
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 sm:mb-8 border-border">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg text-foreground">Find Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search in ${category.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="border-border">
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? 'No products found' : 'No products available'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `No products match "${searchQuery}" in this category.`
                  : 'This category is currently being stocked. Check back soon!'
                }
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Category Info */}
        <Card className="mt-8 sm:mt-12 border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  About {category.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We source the finest {category.name.toLowerCase()} from trusted local suppliers 
                  and international partners. All products are carefully selected for quality 
                  and freshness, ensuring you get the best ingredients for your vacation meals.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Delivery Information
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Same-day delivery to your vacation rental</p>
                  <p>• Temperature-controlled transport for fresh items</p>
                  <p>• Professional unpacking service available</p>
                  <p>• Contact us for special requests or dietary needs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
}