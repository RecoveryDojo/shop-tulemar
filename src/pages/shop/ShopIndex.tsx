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
    'beverages': 'from-amber-400 via-orange-500 to-orange-600',
    'produce': 'from-emerald-400 via-green-500 to-green-600',
    'pantry': 'from-blue-400 via-indigo-500 to-indigo-600',
    'dairy': 'from-yellow-300 via-amber-400 to-amber-500',
    'meat-seafood': 'from-rose-400 via-red-500 to-red-600',
    'alcohol': 'from-purple-400 via-violet-500 to-violet-600',
    'baby-kids': 'from-pink-300 via-pink-400 to-rose-500',
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categoriesLoading || countsLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <Skeleton className="h-24 w-24 rounded-2xl mx-auto mb-6" />
                    <Skeleton className="h-7 w-3/4 mx-auto mb-3" />
                    <Skeleton className="h-5 w-1/2 mx-auto" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))
            ) : categoriesWithProducts.length > 0 ? (
              categoriesWithProducts.map((category, index) => {
                const IconComponent = getIcon(category.id);
                const isEmoji = typeof IconComponent === 'string';
                
                return (
                  <Card 
                    key={category.id} 
                    className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Gradient background overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getColor(category.id)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <CardHeader className="relative pb-4 pt-8">
                      <div className={`inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${getColor(category.id)} mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                        {isEmoji ? (
                          <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{IconComponent}</span>
                        ) : (
                          <IconComponent className="h-12 w-12 text-white group-hover:scale-110 transition-transform duration-300" />
                        )}
                      </div>
                      <CardTitle className="text-2xl text-center font-bold mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      {category.description && (
                        <CardDescription className="text-center text-base line-clamp-2">
                          {category.description}
                        </CardDescription>
                      )}
                      <p className="text-sm font-medium text-muted-foreground text-center mt-3 flex items-center justify-center gap-2">
                        <Package className="h-4 w-4" />
                        {getProductCount(category.id)}
                      </p>
                    </CardHeader>
                    <CardContent className="relative pt-0 pb-6">
                      <Button 
                        asChild 
                        className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${getColor(category.id)} hover:shadow-lg hover:scale-105 transition-all duration-300 text-white border-0`}
                      >
                        <Link to={`/category/${category.id}`}>
                          Browse {category.name}
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