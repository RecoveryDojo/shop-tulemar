import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, ShoppingCart, Home, Star, Users, Leaf } from "lucide-react";
import mealImage from "@/assets/meal-1.jpg";
import chefImage from "@/assets/chef-1.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to culinary paradise during your Costa Rican vacation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-tropical transition-all duration-300 border-0 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="bg-gradient-tropical p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Order 10 Days Ahead</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Choose your meals from our weekly menu and place your order at least 10 days before arrival for the best selection.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-tropical transition-all duration-300 border-0 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="bg-gradient-sunset p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">We Prepare & Shop</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Our expert chefs prepare your meals using fresh, locally-sourced ingredients from Costa Rican farms and markets.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-tropical transition-all duration-300 border-0 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="bg-gradient-ocean p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Arrive & Enjoy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Your meals are perfectly organized in your villa's fridge and pantry, ready for you to enjoy after your adventures.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Meals Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Authentic Costa Rican Flavors
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every meal tells the story of Costa Rica's rich culinary heritage
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">
                Traditional Recipes, Modern Presentation
              </h3>
              <p className="text-lg text-muted-foreground">
                Our chefs combine time-honored Costa Rican recipes with contemporary culinary techniques, 
                creating meals that honor tradition while delighting modern palates.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <Leaf className="h-5 w-5 text-primary" />
                  <span>Fresh, locally-sourced ingredients</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-primary" />
                  <span>Authentic Costa Rican recipes</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Prepared by local culinary experts</span>
                </li>
              </ul>
              <Button variant="hero" size="lg" asChild>
                <Link to="/menu">Explore Our Menu</Link>
              </Button>
            </div>
            
            <div className="relative">
              <img
                src={mealImage}
                alt="Costa Rican gourmet meal"
                className="w-full h-96 object-cover rounded-2xl shadow-elegant"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Chef Spotlight */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src={chefImage}
                alt="Costa Rican chef"
                className="w-full h-96 object-cover rounded-2xl shadow-elegant"
              />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Meet Our Culinary Team
              </h2>
              <p className="text-lg text-muted-foreground">
                Our chefs are passionate Costa Rican culinary artists who bring decades of experience 
                and deep knowledge of local flavors to every dish they create for your vacation.
              </p>
              <div className="bg-card p-6 rounded-xl shadow-lg">
                <blockquote className="text-lg italic text-foreground mb-4">
                  "We don't just prepare meals; we create experiences that connect you to the heart 
                  and soul of Costa Rican culture through authentic flavors."
                </blockquote>
                <cite className="text-primary font-semibold">Chef Maria Rodriguez, Head Chef</cite>
              </div>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/about">Learn About Our Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Costa Rican Vacation?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Don't spend your precious vacation time cooking. Let us handle the meals 
            so you can focus on making memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="xl" className="bg-white text-primary hover:bg-white/90">
              <Link to="/order">Start Your Order</Link>
            </Button>
            <Button variant="ghost" size="xl" className="text-white border-white/30 hover:bg-white/10">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-gradient-tropical p-2 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">Vacation Meals CR</span>
          </div>
          <p className="text-background/80 mb-4">
            Authentic Costa Rican cuisine delivered to your vacation paradise
          </p>
          <p className="text-background/60 text-sm">
            © 2024 Vacation Meals Costa Rica. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;