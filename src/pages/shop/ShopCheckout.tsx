import { useState, useEffect } from 'react';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, getDeliveryFee, TAX_RATE } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';

import { toast } from 'sonner';

export default function ShopCheckout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    property_address: '',
    arrival_date: '',
    departure_date: '',
    guest_count: '',
    special_instructions: '',
    dietary_restrictions: [] as string[],
  });

  // Auto-fill form with user data when authenticated
  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        customer_name: profile.display_name || '',
        customer_email: user.email || '',
        customer_phone: profile.phone || '',
      }));
    }
  }, [user, profile]);

  const subtotal = total;
  const deliveryFee = getDeliveryFee(subtotal);
  const tax = subtotal * TAX_RATE;
  const finalTotal = subtotal + tax + deliveryFee;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDietaryRestriction = (restriction: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dietary_restrictions: checked
        ? [...prev.dietary_restrictions, restriction]
        : prev.dietary_restrictions.filter(r => r !== restriction)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) return;

    try {
      setIsSubmitting(true);
      
      // Prepare order data for Stripe
      const orderData = {
        customerName: formData.customer_name,
        customerEmail: formData.customer_email,
        customerPhone: formData.customer_phone,
        propertyAddress: formData.property_address,
        arrivalDate: formData.arrival_date,
        departureDate: formData.departure_date,
        guestCount: formData.guest_count ? parseInt(formData.guest_count) : null,
        dietaryRestrictions: formData.dietary_restrictions.length > 0 ? formData.dietary_restrictions : null,
        specialInstructions: formData.special_instructions,
        subtotal: subtotal,
        taxAmount: tax,
        deliveryFee: deliveryFee,
        totalAmount: finalTotal,
      };

      // Prepare items data
      const orderItems = items.map(item => ({
        productId: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      }));

      console.log("Creating payment session...");
      
      // Create payment with Stripe
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          orderData, 
          items: orderItems,
          siteOrigin: window.location.origin
        }
      });

      if (error) {
        console.error("Payment creation error details:", error);
        throw new Error(error.message || "Failed to create payment session");
      }

      if (!data?.url) {
        console.error("Payment response data:", data);
        throw new Error("No payment URL received");
      }

      console.log("Payment session created, redirecting to Stripe...");
      
      // Clear cart before redirecting to Stripe
      clearCart();
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error("Order placement failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <ShopLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Loading...</h1>
          </div>
        </div>
      </ShopLayout>
    );
  }

  // Require authentication for checkout
  if (!user) {
    return (
      <ShopLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <LogIn className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to your account to proceed with checkout. This helps us track your order and provide better service.
            </p>
            <div className="space-x-4">
              <Link to="/auth">
                <Button className="bg-gradient-tropical hover:opacity-90 text-white">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In / Sign Up
                </Button>
              </Link>
              <Link to="/cart">
                <Button variant="outline">
                  Back to Cart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (items.length === 0) {
    return (
      <ShopLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some items to your cart before proceeding to checkout.
            </p>
            <Link to="/categories">
              <Button className="bg-gradient-tropical hover:opacity-90 text-white">
                Browse Categories
              </Button>
            </Link>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/cart">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Order Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Information */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Full Name *</Label>
                        <Input
                          id="customer_name"
                          value={formData.customer_name}
                          onChange={(e) => handleInputChange('customer_name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_email">Email Address *</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={formData.customer_email}
                          onChange={(e) => handleInputChange('customer_email', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">Phone Number</Label>
                      <Input
                        id="customer_phone"
                        type="tel"
                        value={formData.customer_phone}
                        onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Vacation Details */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Vacation Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="property_address">Property Address</Label>
                      <Textarea
                        id="property_address"
                        value={formData.property_address}
                        onChange={(e) => handleInputChange('property_address', e.target.value)}
                        placeholder="Enter your vacation rental address"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="arrival_date">Arrival Date</Label>
                        <Input
                          id="arrival_date"
                          type="date"
                          value={formData.arrival_date}
                          onChange={(e) => handleInputChange('arrival_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="departure_date">Departure Date</Label>
                        <Input
                          id="departure_date"
                          type="date"
                          value={formData.departure_date}
                          onChange={(e) => handleInputChange('departure_date', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="guest_count">Number of Guests</Label>
                      <Select value={formData.guest_count} onValueChange={(value) => handleInputChange('guest_count', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of guests" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9,10].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} guest{num > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Dietary Restrictions */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Dietary Restrictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut Allergies', 'Shellfish Allergies'].map((restriction) => (
                        <div key={restriction} className="flex items-center space-x-2">
                          <Checkbox
                            id={restriction}
                            checked={formData.dietary_restrictions.includes(restriction)}
                            onCheckedChange={(checked) => handleDietaryRestriction(restriction, checked as boolean)}
                          />
                          <Label htmlFor={restriction} className="text-sm">{restriction}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Special Instructions */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Special Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.special_instructions}
                      onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                      placeholder="Any special requests or delivery instructions..."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="border-border sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-foreground">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-foreground ml-2">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {deliveryFee === 0 ? 'Delivery Fee (FREE!)' : 'Delivery Fee'}
                        </span>
                        <span className="text-foreground">{formatCurrency(deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (IVA 13%)</span>
                        <span className="text-foreground">{formatCurrency(tax)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">{formatCurrency(finalTotal)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-tropical hover:opacity-90 text-white"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Creating Payment...' : 'Proceed to Payment'}
                    </Button>

                    <div className="text-xs text-muted-foreground mt-4">
                      <p>• Payment will be processed securely</p>
                      <p>• You'll receive a confirmation email</p>
                      <p>• Delivery within 2-4 hours</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ShopLayout>
  );
}