import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChefHat, MapPin, Clock } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Costa Rican vacation meal delivery"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Your Costa Rican
            <span className="block bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
              Culinary Paradise
            </span>
            Awaits
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Skip the cooking after your adventures. We'll stock your villa with 
            authentic, locally-sourced Costa Rican meals prepared by expert chefs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="xl" asChild>
              <Link to="/order">Start Your Order</Link>
            </Button>
            <Button variant="outline" size="xl" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Link to="/menu">View Menu</Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-white">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full mb-4">
                <ChefHat className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Expert Chefs</h3>
              <p className="text-white/80 text-center">
                Locally-trained chefs preparing authentic Costa Rican cuisine
              </p>
            </div>
            
            <div className="flex flex-col items-center text-white">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Local Sourcing</h3>
              <p className="text-white/80 text-center">
                Fresh ingredients from Costa Rican farms and markets
              </p>
            </div>
            
            <div className="flex flex-col items-center text-white">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pre-Arrival Setup</h3>
              <p className="text-white/80 text-center">
                Meals ready in your fridge when you arrive
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
};