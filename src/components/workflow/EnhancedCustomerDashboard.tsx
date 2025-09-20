import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  MapPin, 
  Clock, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Truck,
  Camera,
  Phone,
  Navigation,
  Bell,
  Heart,
  RefreshCcw,
  Gift,
  Calendar,
  CreditCard,
  Receipt,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  User,
  Home,
  Info,
  PlayCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'found' | 'substituted' | 'unavailable';
  substitution?: {
    product_name: string;
    reason: string;
    price_difference: number;
    image_url?: string;
  };
  photo_url?: string;
  notes?: string;
}

interface OrderTracking {
  id: string;
  order_number: string;
  status: 'confirmed' | 'shopping' | 'checked_out' | 'out_for_delivery' | 'delivered';
  shopper: {
    name: string;
    avatar?: string;
    rating: number;
    total_orders: number;
  };
  driver?: {
    name: string;
    avatar?: string;
    rating: number;
    vehicle: string;
    license_plate: string;
  };
  store_name: string;
  estimated_delivery: string;
  delivery_address: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  tip: number;
  total: number;
  special_instructions?: string;
  timeline: {
    confirmed_at: string;
    shopping_started_at?: string;
    checked_out_at?: string;
    out_for_delivery_at?: string;
    delivered_at?: string;
  };
}

interface Message {
  id: string;
  sender: 'customer' | 'shopper' | 'system';
  content: string;
  timestamp: string;
  image_url?: string;
  type?: 'text' | 'photo' | 'substitution' | 'notification';
}

export function EnhancedCustomerDashboard() {
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tracking');
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);
  const { toast } = useToast();

  // Mock data for demo
  useEffect(() => {
    const mockOrder: OrderTracking = {
      id: '1',
      order_number: 'ORD-2024-001',
      status: 'shopping',
      shopper: {
        name: 'Maria Rodriguez',
        avatar: '/placeholder-avatar.jpg',
        rating: 4.96,
        total_orders: 247
      },
      store_name: 'Whole Foods Market - Downtown',
      estimated_delivery: '3:30 PM - 4:00 PM',
      delivery_address: '123 Oak Street, Apt 4B, Seattle, WA 98101',
      subtotal: 87.43,
      tax: 7.87,
      delivery_fee: 5.99,
      tip: 15.50,
      total: 116.79,
      special_instructions: 'Please ring doorbell and leave at door if no answer',
      timeline: {
        confirmed_at: '2:15 PM',
        shopping_started_at: '2:30 PM'
      },
      items: [
        {
          id: '1',
          product_name: 'Organic Bananas',
          quantity: 2,
          unit_price: 3.99,
          total_price: 7.98,
          status: 'found',
          photo_url: '/placeholder-product.jpg'
        },
        {
          id: '2',
          product_name: 'Almond Milk (Unsweetened)',
          quantity: 1,
          unit_price: 4.99,
          total_price: 4.99,
          status: 'substituted',
          substitution: {
            product_name: 'Almond Milk (Vanilla)',
            reason: 'Unsweetened was out of stock',
            price_difference: 0.50,
            image_url: '/placeholder-substitution.jpg'
          }
        },
        {
          id: '3',
          product_name: 'Organic Ground Turkey',
          quantity: 1,
          unit_price: 12.99,
          total_price: 12.99,
          status: 'pending'
        }
      ]
    };

    const mockMessages: Message[] = [
      {
        id: '1',
        sender: 'system',
        content: 'Your order has been confirmed! Maria is starting to shop for you.',
        timestamp: '2:30 PM',
        type: 'notification'
      },
      {
        id: '2',
        sender: 'shopper',
        content: 'Hi! I\'m Maria, your shopper today. I\'m starting with your produce items first!',
        timestamp: '2:31 PM',
        type: 'text'
      },
      {
        id: '3',
        sender: 'shopper',
        content: 'Found your organic bananas - they look perfect!',
        timestamp: '2:35 PM',
        type: 'photo',
        image_url: '/placeholder-found-item.jpg'
      },
      {
        id: '4',
        sender: 'shopper',
        content: 'The unsweetened almond milk is out of stock. I found vanilla almond milk for $0.50 more. Is this okay?',
        timestamp: '2:40 PM',
        type: 'substitution'
      }
    ];

    setOrder(mockOrder);
    setMessages(mockMessages);
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      sender: 'customer',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  const approveSubstitution = (itemId: string) => {
    if (!order) return;
    
    setOrder({
      ...order,
      items: order.items.map(item =>
        item.id === itemId ? { ...item, status: 'found' } : item
      )
    });
  };

  if (!order) return <div>Loading...</div>;

  const completedItems = order.items.filter(item => item.status === 'found').length;
  const totalItems = order.items.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500';
      case 'shopping': return 'bg-yellow-500';
      case 'checked_out': return 'bg-purple-500';
      case 'out_for_delivery': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Order Confirmed';
      case 'shopping': return 'Shopping in Progress';
      case 'checked_out': return 'Heading to You';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  // Customer guidance based on order status
  const getCustomerProtocol = () => {
    switch (order.status) {
      case 'confirmed':
        return "Your order is confirmed! Your shopper will start shopping soon. You can track progress here.";
      case 'shopping':
        return "Your shopper is finding your items. Watch for substitution requests and photos of items.";
      case 'checked_out':
        return "Shopping complete! Your order is being prepared for delivery.";
      case 'out_for_delivery':
        return "Your order is on the way! Track your driver and prepare to receive your delivery.";
      case 'delivered':
        return "Order delivered! Please rate your experience and leave feedback.";
      default:
        return "Track your order status and communicate with your shopper.";
    }
  };

  const getNextSteps = () => {
    switch (order.status) {
      case 'confirmed':
        return ["Shopper will start shopping within 15 minutes", "You'll receive photos of items", "Watch for substitution requests"];
      case 'shopping':
        return ["Respond to substitution requests quickly", "Track shopping progress", "Prepare delivery area"];
      case 'checked_out':
        return ["Driver is loading your order", "Ensure delivery address is accessible", "Have phone ready for delivery updates"];
      case 'out_for_delivery':
        return ["Driver is en route to you", "Be available for delivery", "Check delivery instructions"];
      case 'delivered':
        return ["Rate your shopper and driver", "Review substitutions", "Schedule your next order"];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Customer Guidance Protocol */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
              <div>
                <p className="font-semibold text-primary">What to Expect</p>
                <p className="text-sm text-muted-foreground">{getCustomerProtocol()}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="hover-scale">
              <Info className="h-4 w-4 mr-2" />
              Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Card */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            <span>Your Next Steps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getNextSteps().map((step, index) => (
              <div key={index} className="flex items-center space-x-3 animate-fade-in">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-medium">
                  {index + 1}
                </div>
                <p className="text-sm">{step}</p>
                <ChevronRight className="h-4 w-4 text-green-500 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Status Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Order #{order.order_number}</h1>
              <div className="flex items-center space-x-3">
                <Badge className={`${getStatusColor(order.status)} text-white animate-pulse`}>
                  {getStatusText(order.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Expected: {order.estimated_delivery}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setShowDeliveryMap(!showDeliveryMap)}>
                <MapPin className="h-4 w-4 mr-2" />
                Track Live
              </Button>
              <UserProfileMenu />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Shopping Progress</span>
              <span>{completedItems}/{totalItems} items found</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Timeline */}
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {[
              { key: 'confirmed', label: 'Confirmed', time: order.timeline.confirmed_at },
              { key: 'shopping', label: 'Shopping', time: order.timeline.shopping_started_at },
              { key: 'checked_out', label: 'Checkout', time: order.timeline.checked_out_at },
              { key: 'delivery', label: 'Delivery', time: order.timeline.out_for_delivery_at },
              { key: 'delivered', label: 'Delivered', time: order.timeline.delivered_at }
            ].map((step, index) => (
              <div key={step.key} className="flex flex-col items-center min-w-max">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.time ? 'bg-primary text-white' : 'bg-gray-200'
                }`}>
                  {step.time ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs mt-1 text-center">{step.label}</span>
                {step.time && (
                  <span className="text-xs text-muted-foreground">{step.time}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shopper Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={order.shopper.avatar} />
                <AvatarFallback>{order.shopper.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{order.shopper.name}</h3>
                <p className="text-sm text-muted-foreground">Your Shopper</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                    <span className="text-xs">{order.shopper.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    • {order.shopper.total_orders} orders
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </Button>
              <Button size="sm" variant="outline">
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Status & Actions */}
      {order && (order.status === 'out_for_delivery' || order.status === 'delivered') && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    {order.status === 'delivered' ? 'Order Delivered!' : 'Out for Delivery'}
                  </h3>
                  <p className="text-sm text-green-600">
                    {order.status === 'delivered' 
                      ? 'Please confirm you received your order'
                      : 'Your order is on the way to you'
                    }
                  </p>
                </div>
              </div>
              
              {order.status === 'delivered' && (
                <Button 
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                  onClick={() => {
                    toast({
                      title: "Thank you!",
                      description: "Delivery confirmed. We hope you enjoy your groceries!",
                    });
                  }}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Confirm Delivery Received
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="chat">Messages</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
        </TabsList>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Live Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messages.filter(m => m.type === 'notification' || m.type === 'photo').map((message) => (
                  <div key={message.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-primary text-white rounded-full p-1">
                      <Bell className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{message.timestamp}</p>
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Update"
                          className="mt-2 rounded-lg max-w-48 h-32 object-cover"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Store & Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Store</h4>
                    <p className="text-sm text-muted-foreground">{order.store_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Delivery</h4>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {order.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{item.product_name}</h4>
                      <Badge variant={
                        item.status === 'found' ? 'default' :
                        item.status === 'substituted' ? 'secondary' :
                        'outline'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      Quantity: {item.quantity} • Unit Price: {formatCurrency(item.unit_price)}
                    </p>

                    {item.status === 'substituted' && item.substitution && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm font-medium text-yellow-900 mb-1">Substitution Suggested</p>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800">
                              <strong>{item.substitution.product_name}</strong>
                            </p>
                            <p className="text-xs text-yellow-700">
                              Reason: {item.substitution.reason}
                            </p>
                            <p className="text-xs text-yellow-600">
                              Price difference: {item.substitution.price_difference > 0 ? '+' : ''}
                              {formatCurrency(item.substitution.price_difference)}
                            </p>
                          </div>
                          {item.substitution.image_url && (
                            <img
                              src={item.substitution.image_url}
                              alt="Substitution"
                              className="w-16 h-16 rounded object-cover ml-3"
                            />
                          )}
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => approveSubstitution(item.id)}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {item.photo_url && item.status === 'found' && (
                      <div className="mt-3">
                        <img
                          src={item.photo_url}
                          alt="Found item"
                          className="w-24 h-24 rounded object-cover"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.total_price)}</p>
                    {item.status === 'found' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto mt-1" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat with {order.shopper.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        message.sender === 'customer'
                          ? 'bg-primary text-white'
                          : message.sender === 'system'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Message attachment"
                          className="mt-2 rounded max-w-full h-32 object-cover"
                        />
                      )}
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[100px]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  Send
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button variant="outline" size="sm">
                  👍 Looks good!
                </Button>
                <Button variant="outline" size="sm">
                  🛒 Please find alternative
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Tab */}
        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-sm">
                      {item.product_name} x{item.quantity}
                    </span>
                    <span className="text-sm">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>{formatCurrency(order.tip)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Paid with •••• 4242</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}