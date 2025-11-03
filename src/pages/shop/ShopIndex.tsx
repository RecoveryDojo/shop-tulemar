import { ShopHero } from "@/components/shop/ShopHero";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Clock, MapPin, Leaf, Coffee, Apple, Utensils, Beer, Baby, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from '@/hooks/useProducts';
import { useEffect, useState } from 'react';
import deliveryTruck from "@/assets/delivery-truck.jpg";

export default function ShopIndex() {
  const { categories, loading: categoriesLoading, getCategoryProductCounts } = useProducts({ autoLoad: false });
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    const loadCounts = async () => {
      if (categories.length > 0) {
        setCountsLoading(true);
        const counts = await getCategoryProductCounts();
        setProductCounts(counts);
        setCountsLoading(false);
      }
    };
    loadCounts();
  }, [categories, getCategoryProductCounts]);

  // Icon and color mapping for categories
  const iconMap: Record<string, any> = {
    'beverages': Coffee,
    'produce': Apple,
    'pantry': Package,
    'dairy': '🥛',
    'meat-seafood': Utensils,
    'alcohol': Beer,
    'baby-kids': Baby,
  };

  const colorMap: Record<string, string> = {
    'beverages': 'from-amber-500 to-orange-600',
    'produce': 'from-green-500 to-emerald-600',
    'pantry': 'from-blue-500 to-indigo-600',
    'dairy': 'from-yellow-400 to-amber-500',
    'meat-seafood': 'from-red-500 to-pink-600',
    'alcohol': 'from-purple-500 to-violet-600',
    'baby-kids': 'from-pink-400 to-rose-500',
  };

  const getIcon = (categoryId: string) => {
    const icon = iconMap[categoryId];
    return icon || ShoppingCart;
  };

  const getColor = (categoryId: string) => {
    return colorMap[categoryId] || 'from-gray-500 to-gray-600';
  };

  const getProductCount = (categoryId: string) => {
    const count = productCounts[categoryId] || 0;
    return count === 1 ? '1 product' : `${count} products`;
  };

  const categoriesWithProducts = categories.filter(cat => 
    (productCounts[cat.id] || 0) > 0
  );
  
  const features = [
    {
      icon: ShoppingCart,
      title: "Fresh Local Products",
      description: "Handpicked groceries from local Costa Rican suppliers and farms"
    },
    {
      icon: Clock,
      title: "Pre-Arrival Stocking",
      description: "Order before arrival and find your groceries waiting in your rental"
    },
    {
      icon: MapPin,
      title: "Vacation Rental Delivery",
      description: "Direct delivery to your villa, condo, or vacation home"
    },
    {
      icon: Leaf,
      title: "Sustainable Sourcing",
      description: "Supporting local farmers and eco-friendly practices"
    }
  ];


  return (
    <ShopLayout>
      <div className="bg-background">
        <ShopHero />
      
      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Tulemar Shop?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Skip the grocery runs and start your vacation immediately with fresh, 
              local groceries waiting for you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-elegant hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="bg-gradient-tropical p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need for your Costa Rican getaway
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesLoading || countsLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="border-0 shadow-elegant">
                  <CardHeader>
                    <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : categoriesWithProducts.length > 0 ? (
              categoriesWithProducts.map((category) => {
                const IconComponent = getIcon(category.id);
                const isEmoji = typeof IconComponent === 'string';
                
                return (
                  <Card 
                    key={category.id} 
                    className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20"
                  >
                    <CardHeader>
                      <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r ${getColor(category.id)} mx-auto mb-4`}>
                        {isEmoji ? (
                          <span className="text-3xl">{IconComponent}</span>
                        ) : (
                          <IconComponent className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <CardTitle className="text-xl text-center">{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription className="text-center">{category.description}</CardDescription>
                      )}
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        {getProductCount(category.id)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                        <Link to={`/category/${category.id}`}>
                          Browse
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No categories available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Groceries Made Simple
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-gradient-tropical text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Browse & Order</h3>
                    <p className="text-muted-foreground">Select from our curated collection of local groceries and essentials</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-gradient-tropical text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Schedule Delivery</h3>
                    <p className="text-muted-foreground">Choose your arrival date and we'll have everything ready</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-gradient-tropical text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Arrive & Enjoy</h3>
                    <p className="text-muted-foreground">Find your groceries stocked and ready in your vacation rental</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link to="/how-it-works">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="order-first md:order-last">
              <LazyImage 
                src={deliveryTruck} 
                alt="Tulemar Shop delivery truck in Costa Rica"
                className="rounded-2xl shadow-elegant w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-tropical text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Browse our full selection of fresh groceries and local products. 
            Your vacation starts the moment you arrive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/order">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
        </section>
      </div>
    </ShopLayout>
  );
}