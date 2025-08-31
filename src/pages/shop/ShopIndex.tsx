import { ShopHero } from "@/components/shop/ShopHero";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, MapPin, Leaf, Coffee, Apple } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from '@/hooks/useProducts';
import groceryBasket from "@/assets/grocery-basket.jpg";
import deliveryTruck from "@/assets/delivery-truck.jpg";

export default function ShopIndex() {
  const { categories } = useProducts();
  
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

  const categoryPreviews = [
    {
      icon: Coffee,
      name: "Coffee & Beverages",
      items: "Premium Costa Rican coffee, teas, juices"
    },
    {
      icon: Apple,
      name: "Fresh Produce",
      items: "Tropical fruits, vegetables, herbs"
    },
    {
      icon: ShoppingCart,
      name: "Pantry Essentials",
      items: "Rice, beans, cooking oils, spices"
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

      {/* Categories Preview */}
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
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {categoryPreviews.map((category, index) => (
              <Card key={index} className="border-0 shadow-elegant hover:shadow-glow transition-all duration-300 hover-scale">
                <CardHeader className="text-center">
                  <div className="bg-gradient-tropical p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription className="text-base">
                    {category.items}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/categories">
              <Button className="bg-gradient-tropical hover:opacity-90 text-white" size="lg">
                Browse All Categories
              </Button>
            </Link>
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
              <img 
                src={deliveryTruck} 
                alt="Tulemar Shop delivery truck in Costa Rica"
                className="rounded-2xl shadow-elegant w-full h-auto"
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
            <Link to="/categories">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Browse Categories
              </Button>
            </Link>
            <Link to="/order">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-primary"
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