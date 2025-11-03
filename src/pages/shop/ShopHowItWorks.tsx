import { ShopLayout } from "@/components/shop/ShopLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MapPin, Clock, CheckCircle, Truck, Refrigerator } from "lucide-react";
import { Link } from "react-router-dom";
import deliveryTruck from "@/assets/delivery-truck.jpg";
import groceryBasket from "@/assets/grocery-basket.jpg";

export default function ShopHowItWorks() {
  const steps = [
    {
      icon: ShoppingCart,
      title: "1. Browse & Order",
      description: "Browse our curated selection of fresh groceries and local products. Create your shopping list online with specific items, quantities, and preferences.",
      details: [
        "500+ local and imported products",
        "Dietary restriction filters",
        "Custom quantity selection",
        "Special request notes"
      ]
    },
    {
      icon: CheckCircle,
      title: "2. Personal Shopping",
      description: "Our local team personally shops for your groceries, selecting the freshest produce and highest quality items from trusted suppliers.",
      details: [
        "Hand-picked fresh produce",
        "Quality guarantee on all items",
        "Local supplier partnerships",
        "Same-day shopping for freshness"
      ]
    },
    {
      icon: Truck,
      title: "3. Secure Delivery",
      description: "We coordinate with your vacation rental property to deliver and stock your groceries before your arrival, ensuring everything is ready.",
      details: [
        "Coordinated delivery timing",
        "Property management partnerships",
        "Secure access protocols",
        "Delivery confirmation photos"
      ]
    },
    {
      icon: Refrigerator,
      title: "4. Ready to Enjoy",
      description: "Arrive to find your groceries properly stored and organized, allowing you to start your vacation immediately without any shopping trips.",
      details: [
        "Properly stored by temperature",
        "Organized by category",
        "Receipt and itemized list",
        "24/7 support for any issues"
      ]
    }
  ];

  const faqs = [
    {
      question: "How far in advance should I place my order?",
      answer: "We recommend placing your order at least 48 hours before your arrival to ensure availability and proper coordination with your rental property."
    },
    {
      question: "What if my vacation rental doesn't allow access?",
      answer: "We work with most major vacation rental companies and property managers. If access isn't possible, we can arrange delivery upon your arrival."
    },
    {
      question: "Do you source products locally?",
      answer: "Yes! We prioritize local Costa Rican products including fresh produce, coffee, dairy, and artisanal goods while also offering familiar international brands."
    },
    {
      question: "What's your freshness guarantee?",
      answer: "We guarantee all perishable items will be fresh upon delivery. If you're not satisfied with any item, we'll replace it or provide a full refund."
    },
    {
      question: "Can I modify my order after placing it?",
      answer: "Orders can be modified up to 24 hours before your scheduled delivery. Contact our support team for any changes."
    }
  ];

  return (
    <ShopLayout>
      <div className="bg-background">
        
        {/* Header */}
      <section className="bg-gradient-tropical text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How Tulemar Shop Works
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            From browsing to stocking, we make grocery shopping for your vacation 
            completely effortless. Here's how it works.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={index} className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:grid-flow-col-dense' : ''}`}>
                <div className={index % 2 === 1 ? 'md:col-start-2' : ''}>
                  <Card className="border-0 shadow-elegant h-full">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-gradient-tropical p-3 rounded-full">
                          <step.icon className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">{step.title}</CardTitle>
                      </div>
                      <CardDescription className="text-lg text-muted-foreground">
                        {step.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <div className={index % 2 === 1 ? 'md:col-start-1' : ''}>
                  <img 
                    src={index % 2 === 0 ? groceryBasket : deliveryTruck} 
                    alt={`Step ${index + 1} illustration`}
                    className="rounded-2xl shadow-elegant w-full h-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Typical Timeline
            </h2>
            <p className="text-xl text-muted-foreground">
              From order to arrival, here's what to expect
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { time: "Order Placed", description: "Submit your grocery list and delivery details", icon: ShoppingCart },
              { time: "24-48 Hours", description: "We shop for your groceries and coordinate delivery", icon: Clock },
              { time: "Arrival Day", description: "Groceries delivered and stocked before you arrive", icon: Truck },
              { time: "Vacation Starts", description: "Relax and enjoy your fresh groceries immediately", icon: CheckCircle }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-tropical p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.time}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our service
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-tropical text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join hundreds of satisfied vacation guests who trust us with their grocery needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild>
              <Link to="/">Browse Categories</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link to="/order">Place Order</Link>
            </Button>
          </div>
        </div>
        </section>
      </div>
    </ShopLayout>
  );
}