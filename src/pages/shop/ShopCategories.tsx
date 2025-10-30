import { ShopLayout } from "@/components/shop/ShopLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Apple, Fish, Beef, ShoppingBag, Wine, Baby, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopCategories() {
  const { categories: dbCategories, products, loading } = useProducts();

  // Icon mapping for categories
  const iconMap: Record<string, any> = {
    "dairy-eggs": "🥛",
    "fresh-produce": Apple,
    "coffee-beverages": Coffee,
    "fresh-seafood": Fish,
    "meat-poultry": Beef,
    "bakery-grains": ShoppingBag,
    "wines-spirits": Wine,
    "baby-family": Baby,
    "organic-health": Leaf
  };

  // Color mapping for categories
  const colorMap: Record<string, string> = {
    "dairy-eggs": "from-blue-400 to-cyan-500",
    "fresh-produce": "from-green-500 to-emerald-600",
    "coffee-beverages": "from-amber-600 to-orange-600",
    "fresh-seafood": "from-blue-500 to-cyan-600",
    "meat-poultry": "from-red-500 to-pink-600",
    "bakery-grains": "from-yellow-500 to-amber-600",
    "wines-spirits": "from-purple-500 to-indigo-600",
    "baby-family": "from-pink-400 to-rose-500",
    "organic-health": "from-emerald-400 to-green-500"
  };

  // Get product count for each category
  const getProductCount = (categoryId: string) => {
    const count = products.filter(p => p.category_id === categoryId).length;
    return count === 0 ? "No items" : count === 1 ? "1 item" : `${count} items`;
  };

  // Filter out categories with no products
  const categoriesWithProducts = dbCategories.filter(category => {
    const productCount = products.filter(p => p.category_id === category.id).length;
    return productCount > 0;
  });

  return (
    <ShopLayout>
      <div className="bg-background">
      
      {/* Header */}
      <section className="bg-gradient-tropical text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Shop by Category
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Browse our carefully curated selection of fresh, local products. 
            Everything you need for your Costa Rican vacation.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-elegant">
                  <CardHeader className="text-center">
                    <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </CardHeader>
                  <CardContent className="text-center">
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categoriesWithProducts.map((category) => {
                const IconComponent = iconMap[category.id];
                const color = colorMap[category.id] || "from-gray-400 to-gray-500";
                
                return (
                  <Card key={category.id} className="border-0 shadow-elegant hover:shadow-glow transition-all duration-300 hover-scale group">
                    <CardHeader className="text-center">
                      <Link to={`/category/${category.id}`} className="inline-block">
                        <div className={`bg-gradient-to-r ${color} p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 cursor-pointer`}>
                          {typeof IconComponent === 'string' ? (
                            <span className="text-3xl">{IconComponent}</span>
                          ) : IconComponent ? (
                            <IconComponent className="h-10 w-10 text-white" />
                          ) : (
                            <span className="text-3xl">{category.icon}</span>
                          )}
                        </div>
                      </Link>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <CardDescription className="text-base">
                        {category.description}
                      </CardDescription>
                      <div className="text-sm text-primary font-medium">
                        {getProductCount(category.id)}
                      </div>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to={`/category/${category.id}`}>
                          Browse {category.name}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Need Help Finding Something?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Our team can help you create a custom shopping list for your vacation needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/order">Start Custom Order</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/order">Contact Us</Link>
            </Button>
          </div>
        </div>
        </section>
      </div>
    </ShopLayout>
  );
}