import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, MessageCircle, HelpCircle } from "lucide-react";

const Contact = () => {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Get a response within 24 hours",
      contact: "info@vacationmeals.cr",
      action: "Send Email"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak with our team directly",
      contact: "+506 2222-3333",
      action: "Call Now"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Quick messages and photos",
      contact: "+506 8888-9999",
      action: "Chat Now"
    }
  ];

  const faqs = [
    {
      question: "How far in advance should I place my order?",
      answer: "We recommend ordering at least 10 days before your arrival to ensure the best selection and availability."
    },
    {
      question: "Can you accommodate dietary restrictions?",
      answer: "Yes! We can accommodate vegetarian, vegan, gluten-free, and most allergies. Just let us know when ordering."
    },
    {
      question: "What areas do you deliver to?",
      answer: "We deliver to most vacation rentals and hotels in popular tourist areas including Guanacaste, Manuel Antonio, and Monteverde."
    },
    {
      question: "What if I need to cancel or change my order?",
      answer: "You can modify or cancel your order up to 5 days before your arrival date for a full refund."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Have questions about our service? Planning a special vacation? We're here to help make your Costa Rican culinary experience perfect.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" className="mt-1" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input id="phone" type="tel" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="What can we help you with?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="order">Order Question</SelectItem>
                        <SelectItem value="dietary">Dietary Requirements</SelectItem>
                        <SelectItem value="delivery">Delivery Area</SelectItem>
                        <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us about your vacation plans, dietary needs, or any questions you have..."
                      className="mt-1 min-h-32"
                    />
                  </div>
                  
                  <Button variant="hero" size="lg" className="w-full">
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Business Hours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    All times are Costa Rica time (CST). We respond to emails and messages within 24 hours.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Methods */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Contact Methods</h2>
                {contactMethods.map((method, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gradient-tropical p-3 rounded-full">
                          <method.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{method.description}</p>
                          <p className="font-medium text-primary mb-3">{method.contact}</p>
                          <Button variant="outline" size="sm">
                            {method.action}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Our Location</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="font-medium">Vacation Meals Costa Rica</p>
                    <p className="text-muted-foreground">
                      Avenida Central 123<br />
                      San José, Costa Rica<br />
                      10101
                    </p>
                    <div className="bg-gradient-to-br from-primary/20 to-secondary/20 h-48 rounded-lg flex items-center justify-center mt-4">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-2" />
                        <p>Interactive Map Coming Soon</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Quick Answers
            </h2>
            <p className="text-xl text-muted-foreground">
              Common questions we receive from travelers
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start space-x-3">
                    <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{faq.question}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground pl-8">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Don't see your question answered?
            </p>
            <Button variant="outline">
              Ask Us Anything
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-tropical">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Plan Your Culinary Adventure?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Contact us today to discuss your vacation meal needs and create the perfect Costa Rican dining experience
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="xl" className="bg-white text-primary hover:bg-white/90">
              Start Planning
            </Button>
            <Button variant="ghost" size="xl" className="text-white border-white/30 hover:bg-white/10">
              Call Us Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;