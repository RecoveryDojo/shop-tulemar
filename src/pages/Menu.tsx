import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Clock, Users, Leaf, Star } from "lucide-react";

const Menu = () => {
  const menuItems = [
    {
      id: 1,
      name: "Traditional Gallo Pinto Breakfast",
      description: "Costa Rica's beloved rice and beans with scrambled eggs, fresh cheese, and plantains",
      price: "$18",
      image: "/api/placeholder/400/300",
      prepTime: "15 min",
      serves: "2-3",
      dietary: ["Vegetarian", "Gluten-Free"],
      category: "Breakfast"
    },
    {
      id: 2,
      name: "Pacific Coast Ceviche",
      description: "Fresh catch marinated in lime juice with onions, cilantro, and tropical peppers",
      price: "$25",
      image: "/api/placeholder/400/300",
      prepTime: "Ready to eat",
      serves: "2-4",
      dietary: ["Pescatarian", "Keto-Friendly"],
      category: "Lunch"
    },
    {
      id: 3,
      name: "Casado Tradicional",
      description: "Traditional Costa Rican plate with rice, beans, plantains, salad, and your choice of protein",
      price: "$22",
      image: "/api/placeholder/400/300",
      prepTime: "20 min",
      serves: "1-2",
      dietary: ["Customizable"],
      category: "Dinner"
    },
    {
      id: 4,
      name: "Arroz con Pollo",
      description: "Saffron-infused rice with tender chicken, vegetables, and Costa Rican spices",
      price: "$24",
      image: "/api/placeholder/400/300",
      prepTime: "25 min",
      serves: "2-3",
      dietary: ["Gluten-Free"],
      category: "Dinner"
    },
    {
      id: 5,
      name: "Tropical Fruit Bowl",
      description: "Seasonal Costa Rican fruits with honey-lime dressing and fresh mint",
      price: "$12",
      image: "/api/placeholder/400/300",
      prepTime: "Ready to eat",
      serves: "2-3",
      dietary: ["Vegan", "Raw"],
      category: "Snacks"
    },
    {
      id: 6,
      name: "Tres Leches Cake",
      description: "Traditional Costa Rican three-milk cake with cinnamon and vanilla",
      price: "$15",
      image: "/api/placeholder/400/300",
      prepTime: "Ready to eat",
      serves: "4-6",
      dietary: ["Vegetarian"],
      category: "Dessert"
    }
  ];

  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snacks", "Dessert"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            This Week's Menu
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Discover authentic Costa Rican flavors crafted with love and the freshest local ingredients
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Menu valid for January 15-21, 2024
          </Badge>
        </div>
      </section>

      {/* Menu Categories */}
      <section className="py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item) => (
              <Card key={item.id} className="hover:shadow-tropical transition-all duration-300 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">Image Coming Soon</div>
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <span className="text-xl font-bold text-primary">{item.price}</span>
                  </div>
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{item.prepTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Serves {item.serves}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {item.dietary.map((diet) => (
                        <Badge key={diet} variant="outline" className="text-xs">
                          {diet}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button className="w-full" variant="outline">
                      Add to Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose Our Meals?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-tropical p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Leaf className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fresh & Local</h3>
              <p className="text-muted-foreground">
                All ingredients sourced from local Costa Rican farms and markets daily
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-sunset p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Authentic Recipes</h3>
              <p className="text-muted-foreground">
                Traditional family recipes passed down through generations
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-ocean p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Made with Love</h3>
              <p className="text-muted-foreground">
                Every dish prepared by passionate local chefs who care about quality
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-tropical">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Order?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Place your order at least 10 days before arrival for the best selection
          </p>
          <Button variant="outline" size="xl" className="bg-white text-primary hover:bg-white/90" asChild>
            <Link to="/order">Start Your Order</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Menu;