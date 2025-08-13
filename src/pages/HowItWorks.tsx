import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  ShoppingCart, 
  Home, 
  Clock, 
  MapPin, 
  Utensils,
  Truck,
  CheckCircle2,
  Star
} from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Calendar,
      title: "Plan & Order",
      subtitle: "10+ Days Before Arrival",
      description: "Browse our weekly menu and place your order at least 10 days before your arrival. Choose from our curated selection of authentic Costa Rican meals.",
      details: [
        "Select your meal package",
        "Specify dietary requirements", 
        "Choose arrival and departure dates",
        "Provide accommodation details"
      ]
    },
    {
      icon: ShoppingCart,
      title: "We Source & Prepare",
      subtitle: "3-5 Days Before Arrival",
      description: "Our local chefs visit farmers markets and suppliers to source the freshest ingredients, then prepare your meals with love and expertise.",
      details: [
        "Fresh ingredients sourced daily",
        "Meals prepared by expert local chefs",
        "Quality checked for freshness",
        "Properly packaged for transport"
      ]
    },
    {
      icon: Truck,
      title: "Delivery & Setup",
      subtitle: "Day of Arrival",
      description: "We coordinate with your accommodation to stock your kitchen with beautifully organized meals, ready for you to enjoy.",
      details: [
        "Coordinated delivery timing",
        "Professional kitchen organization",
        "Proper refrigeration setup",
        "Heating/serving instructions provided"
      ]
    },
    {
      icon: Home,
      title: "Arrive & Enjoy",
      subtitle: "Your Entire Stay",
      description: "Walk into your vacation rental to find your fridge and pantry stocked with delicious, authentic Costa Rican meals. Just heat and enjoy!",
      details: [
        "Meals ready when you arrive",
        "Easy heating instructions",
        "More time for adventures",
        "Authentic local flavors"
      ]
    }
  ];

  const faqs = [
    {
      question: "How far in advance do I need to order?",
      answer: "We recommend ordering at least 10 days before your arrival to ensure the best selection and availability. However, we can sometimes accommodate shorter notice - contact us to check."
    },
    {
      question: "What if I have dietary restrictions?",
      answer: "We can accommodate most dietary restrictions including vegetarian, vegan, gluten-free, and specific allergies. Just let us know when placing your order and our chefs will adjust accordingly."
    },
    {
      question: "How long do the meals stay fresh?",
      answer: "All meals are prepared 1-2 days before delivery and will stay fresh for 3-5 days when properly refrigerated. We provide clear expiration dates and storage instructions."
    },
    {
      question: "Do you deliver to all accommodations?",
      answer: "We deliver to most vacation rentals, villas, condos, and hotels in major Costa Rican tourist areas. Contact us to confirm delivery to your specific location."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            From order to arrival, here's how we make your Costa Rican culinary experience effortless
          </p>
          <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
            <Link to="/order">Start Your Order</Link>
          </Button>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute left-16 top-32 w-0.5 h-32 bg-gradient-tropical" />
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-tropical p-4 rounded-full">
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                        <p className="text-primary font-medium">{step.subtitle}</p>
                      </div>
                    </div>
                    
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <Card className="p-8 shadow-elegant hover:shadow-tropical transition-all duration-300">
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-primary/20 to-secondary/20 w-full h-64 rounded-lg flex items-center justify-center mb-4">
                          <step.icon className="h-24 w-24 text-primary/50" />
                        </div>
                        <h4 className="text-xl font-semibold text-foreground">
                          Step {index + 1}: {step.title}
                        </h4>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your Experience Timeline
            </h2>
            <p className="text-xl text-muted-foreground">
              Here's what happens from order to arrival
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center space-x-4 bg-card p-6 rounded-lg shadow-lg">
              <div className="bg-gradient-tropical p-3 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Day -10: Place Your Order</h4>
                <p className="text-muted-foreground">Choose meals, confirm dates, and complete payment</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-card p-6 rounded-lg shadow-lg">
              <div className="bg-gradient-sunset p-3 rounded-full">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Day -3: Meal Preparation Begins</h4>
                <p className="text-muted-foreground">Our chefs source ingredients and begin preparation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-card p-6 rounded-lg shadow-lg">
              <div className="bg-gradient-ocean p-3 rounded-full">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Day 0: Delivery & Setup</h4>
                <p className="text-muted-foreground">Meals delivered and organized in your accommodation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-card p-6 rounded-lg shadow-lg border-2 border-primary">
              <div className="bg-gradient-tropical p-3 rounded-full">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Arrival: Enjoy Your Vacation!</h4>
                <p className="text-muted-foreground">Delicious meals ready to enjoy throughout your stay</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our service
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Have more questions?
            </p>
            <Button variant="outline" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-tropical">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Experience Costa Rican Cuisine?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Let us handle the meals while you focus on making memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="xl" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/order">Place Your Order</Link>
            </Button>
            <Button variant="ghost" size="xl" className="text-white border-white/30 hover:bg-white/10" asChild>
              <Link to="/menu">View Menu</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;