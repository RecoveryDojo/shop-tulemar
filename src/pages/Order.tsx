import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, DollarSign } from "lucide-react";

const Order = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Place Your Order
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Tell us about your vacation and we'll prepare the perfect Costa Rican culinary experience
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Order Form */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Vacation Details</span>
                  </CardTitle>
                  <CardDescription>
                    When and where are you staying?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="arrival">Arrival Date</Label>
                      <Input id="arrival" type="date" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="departure">Departure Date</Label>
                      <Input id="departure" type="date" className="mt-1" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="accommodation">Accommodation Type</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select accommodation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="villa">Private Villa</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="house">Vacation House</SelectItem>
                        <SelectItem value="hotel">Hotel Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location/Property Address</Label>
                    <Textarea 
                      id="location" 
                      placeholder="Enter your accommodation address or property name"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Group Information</span>
                  </CardTitle>
                  <CardDescription>
                    Tell us about your group
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adults">Adults</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Number of adults" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="children">Children</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Number of children" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0,1,2,3,4,5,6].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dietary">Dietary Restrictions/Preferences</Label>
                    <Textarea 
                      id="dietary" 
                      placeholder="Please list any allergies, dietary restrictions, or special preferences"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-8">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span>Meal Packages</span>
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred meal package
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">Essential Package</h4>
                        <span className="text-lg font-bold text-primary">$45/day</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        One hearty breakfast + one traditional lunch per day
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Traditional Costa Rican breakfast</li>
                        <li>• Authentic lunch with local ingredients</li>
                        <li>• Tropical fruit snacks</li>
                      </ul>
                    </div>

                    <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">Complete Package</h4>
                        <span className="text-lg font-bold text-primary">$75/day</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Breakfast + lunch + dinner with snacks
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Traditional Costa Rican breakfast</li>
                        <li>• Authentic lunch</li>
                        <li>• Gourmet dinner</li>
                        <li>• Daily snacks and tropical fruits</li>
                        <li>• Local coffee and beverages</li>
                      </ul>
                      <div className="mt-2">
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Most Popular
                        </span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">Luxury Package</h4>
                        <span className="text-lg font-bold text-primary">$120/day</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Premium chef-curated experience with wine pairings
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Gourmet breakfast with fresh pastries</li>
                        <li>• Chef's special lunch</li>
                        <li>• Multi-course dinner</li>
                        <li>• Premium snacks and appetizers</li>
                        <li>• Local wine and craft beverages</li>
                        <li>• Personal chef consultation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>5 days × Complete Package</span>
                      <span>$375</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service Fee</span>
                      <span>$25</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">$400</span>
                    </div>
                  </div>

                  <Button variant="hero" size="lg" className="w-full">
                    Continue to Payment
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Final pricing will be calculated based on your exact dates and group size
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Order;