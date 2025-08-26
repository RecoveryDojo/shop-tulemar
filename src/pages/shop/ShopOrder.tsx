import { ShopLayout } from "@/components/shop/ShopLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MapPin, Users, ShoppingCart, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function ShopOrder() {
  const popularItems = [
    { name: "Costa Rican Coffee (1lb)", price: "$12", category: "Beverages" },
    { name: "Fresh Pineapple", price: "$4", category: "Produce" },
    { name: "Plantains (6 count)", price: "$3", category: "Produce" },
    { name: "Local Cheese Selection", price: "$18", category: "Dairy" },
    { name: "Fresh Fish Fillets (2lb)", price: "$25", category: "Seafood" },
    { name: "Rice & Beans Kit", price: "$8", category: "Pantry" },
    { name: "Tropical Fruit Mix", price: "$15", category: "Produce" },
    { name: "Local Beer (6-pack)", price: "$12", category: "Beverages" }
  ];

  return (
    <ShopLayout>
      <div className="bg-background">
        
        {/* Header */}
      <section className="bg-gradient-tropical text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Place Your Order
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Fill out your grocery list and delivery details. We'll have everything 
            fresh and ready when you arrive.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Grocery Order Form
                </CardTitle>
                <CardDescription>
                  Tell us what you need for your vacation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="Enter your phone number" />
                  </div>
                </div>

                {/* Vacation Details */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Vacation Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="property">Vacation Rental Property</Label>
                      <Input id="property" placeholder="Property name or address" />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="arrivalDate">Arrival Date</Label>
                        <Input id="arrivalDate" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="departureDate">Departure Date</Label>
                        <Input id="departureDate" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="guests">Number of Guests</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select guests" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-2">1-2 guests</SelectItem>
                            <SelectItem value="3-4">3-4 guests</SelectItem>
                            <SelectItem value="5-6">5-6 guests</SelectItem>
                            <SelectItem value="7-8">7-8 guests</SelectItem>
                            <SelectItem value="9+">9+ guests</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grocery Preferences */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Grocery Preferences</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Kosher', 'Halal', 'Keto'].map((diet) => (
                          <div key={diet} className="flex items-center space-x-2">
                            <Checkbox id={diet} />
                            <Label htmlFor={diet} className="text-sm">{diet}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="groceryList">Specific Items Needed</Label>
                      <Textarea 
                        id="groceryList" 
                        placeholder="List specific groceries, brands, or quantities you need..."
                        rows={6}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="budget">Estimated Budget</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-100">Under $100</SelectItem>
                          <SelectItem value="100-200">$100 - $200</SelectItem>
                          <SelectItem value="200-300">$200 - $300</SelectItem>
                          <SelectItem value="300-500">$300 - $500</SelectItem>
                          <SelectItem value="over-500">Over $500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="border-t pt-6">
                  <Label htmlFor="instructions">Special Instructions</Label>
                  <Textarea 
                    id="instructions" 
                    placeholder="Any special requests, delivery instructions, or notes..."
                    rows={3}
                  />
                </div>

                <Button variant="hero" size="lg" className="w-full">
                  Submit Grocery Order
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Items */}
            <Card className="border-0 shadow-elegant">
              <CardHeader>
                <CardTitle>Popular Items</CardTitle>
                <CardDescription>
                  Frequently ordered by our guests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popularItems.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.category}</div>
                      </div>
                      <div className="text-sm font-semibold text-primary">{item.price}</div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <Link to="/categories">Browse All Categories</Link>
                </Button>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="border-0 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-gradient-tropical text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Place Order</div>
                    <div className="text-muted-foreground">Submit your grocery list</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-gradient-tropical text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">We Shop</div>
                    <div className="text-muted-foreground">Fresh groceries sourced locally</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-gradient-tropical text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Delivered</div>
                    <div className="text-muted-foreground">Stocked upon your arrival</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border-0 shadow-elegant bg-gradient-tropical text-white">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription className="text-white/90">
                  Our team is here to assist with your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link to="/order">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </ShopLayout>
  );
}