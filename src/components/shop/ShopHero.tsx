import { Button } from "@/components/ui/button";
import { ShoppingCart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import groceryHero from "@/assets/grocery-hero.jpg";

export const ShopHero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${groceryHero})`,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Costa Rica Grocery Delivery</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="block">Tulemar</span>
          <span className="block bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent">
            Shop
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
          Fresh groceries and local products delivered to your vacation rental. 
          Skip the shopping and start relaxing from day one.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="hero" size="lg" className="bg-gradient-tropical hover:shadow-glow" asChild>
            <Link to="/shop/categories" className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Start Shopping
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary" asChild>
            <Link to="/shop/how-it-works">How It Works</Link>
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold">500+</div>
            <div className="text-sm text-white/80">Local Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">24hr</div>
            <div className="text-sm text-white/80">Pre-Arrival Setup</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm text-white/80">Fresh Guarantee</div>
          </div>
        </div>
      </div>
    </section>
  );
};