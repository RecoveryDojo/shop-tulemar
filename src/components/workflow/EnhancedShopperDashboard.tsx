import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  ShoppingCart, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign, 
  Camera, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation,
  Mic,
  Search,
  Filter,
  BarChart3,
  Smartphone,
  Mail,
  Bell,
  Gift,
  Target,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  category: string;
  aisle_location?: string;
  customer_notes?: string;
  found_status: 'pending' | 'found' | 'substitution_needed' | 'unavailable';
  substitution_reason?: string;
  photo_url?: string;
  estimated_find_time?: number;
}

interface ShoppingOrder {
  id: string;
  customer_name: string;
  customer_avatar?: string;
  store_name: string;
  total_items: number;
  estimated_time: number;
  priority: 'standard' | 'priority' | 'express';
  special_instructions?: string;
  items: OrderItem[];
  customer_rating?: number;
  tip_amount?: number;
  delivery_address: string;
  batch_number?: number;
}

interface ShopperStats {
  daily_earnings: number;
  weekly_earnings: number;
  orders_completed: number;
  customer_rating: number;
  efficiency_score: number;
  find_rate: number;
}

export function EnhancedShopperDashboard() {
  const [activeOrder, setActiveOrder] = useState<ShoppingOrder | null>(null);
  const [availableOrders, setAvailableOrders] = useState<ShoppingOrder[]>([]);
  const [shopperStats, setShopperStats] = useState<ShopperStats>({
    daily_earnings: 0,
    weekly_earnings: 0,
    orders_completed: 0,
    customer_rating: 0,
    efficiency_score: 0,
    find_rate: 0
  });
  const [activeTab, setActiveTab] = useState('shopping');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerMessage, setCustomerMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Mock data for demo
  useEffect(() => {
    const mockOrders: ShoppingOrder[] = [
      {
        id: '1',
        customer_name: 'Sarah Johnson',
        customer_avatar: '/placeholder-avatar.jpg',
        store_name: 'Whole Foods Market',
        total_items: 12,
        estimated_time: 45,
        priority: 'express',
        tip_amount: 15.50,
        delivery_address: '123 Oak Street, Apt 4B',
        batch_number: 1,
        items: [
          {
            id: '1',
            product_name: 'Organic Bananas',
            quantity: 2,
            unit_price: 3.99,
            category: 'Produce',
            aisle_location: 'Produce Section - Front',
            found_status: 'found',
            estimated_find_time: 2
          },
          {
            id: '2',
            product_name: 'Almond Milk (Unsweetened)',
            quantity: 1,
            unit_price: 4.99,
            category: 'Dairy',
            aisle_location: 'Aisle 7 - Refrigerated',
            customer_notes: 'Prefer organic if available',
            found_status: 'substitution_needed',
            substitution_reason: 'Out of unsweetened, have vanilla available'
          }
        ]
      }
    ];
    
    setAvailableOrders(mockOrders);
    setActiveOrder(mockOrders[0]);
    
    setShopperStats({
      daily_earnings: 156.75,
      weekly_earnings: 892.40,
      orders_completed: 23,
      customer_rating: 4.94,
      efficiency_score: 96,
      find_rate: 98.5
    });
  }, []);

  const markItemFound = (itemId: string) => {
    if (!activeOrder) return;
    
    setActiveOrder({
      ...activeOrder,
      items: activeOrder.items.map(item =>
        item.id === itemId ? { ...item, found_status: 'found' } : item
      )
    });
  };

  const requestSubstitution = (itemId: string, reason: string) => {
    if (!activeOrder) return;
    
    setActiveOrder({
      ...activeOrder,
      items: activeOrder.items.map(item =>
        item.id === itemId 
          ? { ...item, found_status: 'substitution_needed', substitution_reason: reason }
          : item
      )
    });
  };

  const sendCustomerMessage = async () => {
    if (!customerMessage.trim()) return;
    
    // Here would be the actual messaging implementation
    console.log('Sending message to customer:', customerMessage);
    setCustomerMessage('');
  };

  const completedItems = activeOrder?.items.filter(item => item.found_status === 'found').length || 0;
  const totalItems = activeOrder?.items.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const categories = ['all', 'Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry'];
  
  const filteredItems = activeOrder?.items.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-xl font-bold">{formatCurrency(shopperStats.daily_earnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-xl font-bold">{shopperStats.customer_rating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Find Rate</p>
                <p className="text-xl font-bold">{shopperStats.find_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-xl font-bold">{shopperStats.efficiency_score}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shopping">Active Shopping</TabsTrigger>
          <TabsTrigger value="available">Available Orders</TabsTrigger>
          <TabsTrigger value="communication">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Active Shopping Tab */}
        <TabsContent value="shopping" className="space-y-6">
          {activeOrder ? (
            <>
              {/* Order Header */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={activeOrder.customer_avatar} />
                        <AvatarFallback>{activeOrder.customer_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{activeOrder.customer_name}</span>
                          {activeOrder.priority === 'express' && (
                            <Badge variant="destructive">Express</Badge>
                          )}
                          {activeOrder.batch_number && (
                            <Badge variant="secondary">Batch #{activeOrder.batch_number}</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {activeOrder.store_name} • {activeOrder.total_items} items • Est. {activeOrder.estimated_time}min
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {activeOrder.delivery_address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +{formatCurrency(activeOrder.tip_amount || 0)} tip
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Navigation className="h-4 w-4 mr-1" />
                          Navigate
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress: {completedItems}/{totalItems} items</span>
                        <span>{Math.round(progress)}% complete</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    {activeOrder.special_instructions && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Special Instructions:</p>
                        <p className="text-sm text-blue-800">{activeOrder.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Smart Shopping Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Smart Shopping Tools</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4 mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <MapPin className="h-4 w-4 mr-2" />
                      Optimize Route
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Camera className="h-4 w-4 mr-2" />
                      Batch Photos
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Mic className="h-4 w-4 mr-2" />
                      Voice Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Shopping List */}
              <Card>
                <CardHeader>
                  <CardTitle>Shopping List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg transition-all ${
                          item.found_status === 'found' 
                            ? 'bg-green-50 border-green-200' 
                            : item.found_status === 'substitution_needed'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium">{item.product_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              {item.estimated_find_time && (
                                <Badge variant="secondary" className="text-xs">
                                  ~{item.estimated_find_time}min
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} • {formatCurrency(item.unit_price)}
                            </p>
                            {item.aisle_location && (
                              <p className="text-sm text-blue-600 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {item.aisle_location}
                              </p>
                            )}
                            {item.customer_notes && (
                              <p className="text-sm text-orange-600 mt-1">
                                Note: {item.customer_notes}
                              </p>
                            )}
                            {item.substitution_reason && (
                              <p className="text-sm text-yellow-700 mt-1">
                                Substitution: {item.substitution_reason}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            {item.found_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => markItemFound(item.id)}
                                  className="flex items-center"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Found
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => requestSubstitution(item.id, 'Customer approval needed')}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Issue
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Camera className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            {item.found_status === 'found' && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Found
                              </div>
                            )}
                            
                            {item.found_status === 'substitution_needed' && (
                              <div className="space-y-2">
                                <div className="flex items-center text-yellow-600">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Pending
                                </div>
                                <Button size="sm" variant="outline">
                                  Message Customer
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <Button className="w-full" size="lg">
                      Complete Shopping & Proceed to Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Orders</h3>
                <p className="text-muted-foreground">Check available orders to start shopping</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Available Orders Tab */}
        <TabsContent value="available" className="space-y-4">
          {availableOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={order.customer_avatar} />
                      <AvatarFallback>{order.customer_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium flex items-center space-x-2">
                        <span>{order.customer_name}</span>
                        {order.priority === 'express' && (
                          <Badge variant="destructive">Express</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {order.store_name} • {order.total_items} items • {formatCurrency(order.tip_amount || 0)} tip
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setActiveOrder(order)}>
                    Accept Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Customer Communication</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="bg-blue-100 p-3 rounded ml-8">
                  <p className="text-sm">Hi! I'm starting your shopping now. I'll keep you updated!</p>
                  <p className="text-xs text-muted-foreground mt-1">You - 2:30 PM</p>
                </div>
                <div className="bg-white p-3 rounded mr-8">
                  <p className="text-sm">Great! Thank you. If you can't find the organic almond milk, regular is fine.</p>
                  <p className="text-xs text-muted-foreground mt-1">Sarah - 2:35 PM</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  className="flex-1"
                />
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    onClick={sendCustomerMessage}
                    disabled={!customerMessage.trim()}
                  >
                    Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsRecording(!isRecording)}
                    className={isRecording ? 'bg-red-100' : ''}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  🍌 Found item
                </Button>
                <Button variant="outline" size="sm">
                  ❌ Out of stock
                </Button>
                <Button variant="outline" size="sm">
                  🔄 Substitution needed
                </Button>
                <Button variant="outline" size="sm">
                  ✅ Heading to checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Weekly Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Orders Completed</span>
                    <span className="font-bold">{shopperStats.orders_completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Earnings</span>
                    <span className="font-bold">{formatCurrency(shopperStats.weekly_earnings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Order Value</span>
                    <span className="font-bold">{formatCurrency(shopperStats.weekly_earnings / shopperStats.orders_completed)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">🏆</Badge>
                    <span className="text-sm">Top Performer This Week</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">⚡</Badge>
                    <span className="text-sm">Speed Demon (Sub 30min avg)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">🎯</Badge>
                    <span className="text-sm">Perfect Find Rate (7 days)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}