import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Award,
  Truck,
  Phone,
  Upload,
  Package,
  Info,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  ArrowRight
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
  customer_phone?: string;
  store_name: string;
  total_items: number;
  estimated_time: number;
  priority: 'standard' | 'priority' | 'express';
  special_instructions?: string;
  items: OrderItem[];
  customer_rating?: number;
  tip_amount?: number;
  delivery_address: string;
  delivery_instructions?: string;
  batch_number?: number;
  workflow_phase: 'shopping' | 'ready_for_delivery' | 'in_transit' | 'delivered';
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
  const [deliveryQueue, setDeliveryQueue] = useState<ShoppingOrder[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
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
  const [deliveryProof, setDeliveryProof] = useState<string | null>(null);

  // Mock data for demo
  useEffect(() => {
    const mockShoppingOrders: ShoppingOrder[] = [
      {
        id: 'SHOP-001',
        customer_name: 'Sarah Johnson',
        customer_avatar: '/placeholder-avatar.jpg',
        customer_phone: '+1-555-0123',
        store_name: 'Whole Foods Market',
        total_items: 12,
        estimated_time: 45,
        priority: 'express',
        tip_amount: 15.50,
        delivery_address: '123 Oak Street, Apt 4B',
        delivery_instructions: 'Ring doorbell, leave at door if no answer',
        batch_number: 1,
        workflow_phase: 'shopping',
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
            found_status: 'pending'
          }
        ]
      }
    ];

    const mockDeliveryOrders: ShoppingOrder[] = [
      {
        id: 'DEL-001',
        customer_name: 'Mike Chen',
        customer_avatar: '/placeholder-avatar.jpg',
        customer_phone: '+1-555-0456',
        store_name: 'Whole Foods Market',
        total_items: 8,
        estimated_time: 25,
        priority: 'standard',
        tip_amount: 8.00,
        delivery_address: '456 Pine Street, Unit 12',
        delivery_instructions: 'Buzz apartment, leave with doorman if not home',
        workflow_phase: 'ready_for_delivery',
        items: [
          {
            id: '3',
            product_name: 'Greek Yogurt',
            quantity: 3,
            unit_price: 4.99,
            category: 'Dairy',
            found_status: 'found'
          },
          {
            id: '4',
            product_name: 'Chicken Breast',
            quantity: 2,
            unit_price: 12.99,
            category: 'Meat',
            found_status: 'found'
          }
        ]
      }
    ];
    
    setAvailableOrders(mockShoppingOrders);
    setActiveOrder(mockShoppingOrders[0]);
    setDeliveryQueue(mockDeliveryOrders);
    
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

  const completeShoppingAndStartDelivery = () => {
    if (!activeOrder) return;
    
    const completedOrder = {
      ...activeOrder,
      workflow_phase: 'ready_for_delivery' as const
    };
    
    setDeliveryQueue(prev => [...prev, completedOrder]);
    setActiveOrder(null);
    setActiveTab('delivery');
  };

  const startDelivery = (orderId: string) => {
    setDeliveryQueue(prev => prev.map(order =>
      order.id === orderId 
        ? { ...order, workflow_phase: 'in_transit' as const }
        : order
    ));
  };

  const completeDelivery = (orderId: string) => {
    setDeliveryQueue(prev => prev.map(order =>
      order.id === orderId 
        ? { ...order, workflow_phase: 'delivered' as const }
        : order
    ));
  };

  const captureDeliveryProof = () => {
    setDeliveryProof('delivery-proof-captured.jpg');
  };

  const sendCustomerMessage = async () => {
    if (!customerMessage.trim()) return;
    
    console.log('Sending message to customer:', customerMessage);
    setCustomerMessage('');
  };

  const completedItems = activeOrder?.items.filter(item => item.found_status === 'found').length || 0;
  const totalItems = activeOrder?.items.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const allItemsFound = activeOrder && activeOrder.items.every(item => item.found_status === 'found');

  const categories = ['all', 'Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry'];

  // Step-by-step protocols
  const getShoppingSteps = () => [
    {
      id: 1,
      title: "Review Order Details",
      description: "Check special instructions, delivery address, and customer preferences",
      completed: activeOrder !== null,
      action: "Order accepted"
    },
    {
      id: 2,
      title: "Navigate to Store",
      description: "Use GPS navigation to reach the store efficiently",
      completed: activeOrder !== null,
      action: "Arrive at store"
    },
    {
      id: 3,
      title: "Shop Items",
      description: `Find all ${totalItems} items on the shopping list`,
      completed: allItemsFound,
      action: `${completedItems}/${totalItems} items found`
    },
    {
      id: 4,
      title: "Complete Shopping",
      description: "Review cart, process payment, and prepare for delivery",
      completed: allItemsFound,
      action: allItemsFound ? "Ready for delivery" : "Continue shopping"
    }
  ];

  const getDeliverySteps = () => [
    {
      id: 1,
      title: "Load Vehicle",
      description: "Organize items by temperature requirements (frozen, refrigerated, pantry)",
      completed: false,
      action: "Check insulated bags"
    },
    {
      id: 2,
      title: "Navigate to Customer",
      description: "Use GPS to reach delivery address, review delivery instructions",
      completed: false,
      action: "Start navigation"
    },
    {
      id: 3,
      title: "Contact Customer",
      description: "Call/text customer when arriving to coordinate delivery",
      completed: false,
      action: "Call customer"
    },
    {
      id: 4,
      title: "Complete Delivery",
      description: "Deliver items, take photo proof, collect feedback",
      completed: false,
      action: "Take delivery photo"
    }
  ];

  const getCurrentProtocol = () => {
    if (!activeOrder) return "Select an available order to begin";
    if (activeOrder.workflow_phase === 'shopping') {
      if (!allItemsFound) return "Continue finding items on your shopping list";
      return "All items found! Ready to start delivery";
    }
    if (activeOrder.workflow_phase === 'ready_for_delivery') return "Load vehicle and start delivery";
    if (activeOrder.workflow_phase === 'in_transit') return "Navigate to customer and complete delivery";
    return "Order completed successfully";
  };
  
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

      {/* Live Protocol Guide */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              <div>
                <p className="font-semibold text-primary">Current Protocol</p>
                <p className="text-sm text-muted-foreground">{getCurrentProtocol()}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="hover-scale">
              <Info className="h-4 w-4 mr-2" />
              Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="shopping">Shopping</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="communication">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Active Shopping Tab */}
        <TabsContent value="shopping" className="space-y-6">
          {activeOrder ? (
            <>
              {/* Shopping Process Steps */}
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PlayCircle className="h-5 w-5 text-blue-600" />
                    <span>Shopping Protocol</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getShoppingSteps().map((step, index) => (
                      <div key={step.id} className="flex items-center space-x-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          step.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : index === currentStep 
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 text-gray-400'
                        }`}>
                          {step.completed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            step.id
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${step.completed ? 'text-green-600' : 'text-gray-900'}`}>
                            {step.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        <Badge variant={step.completed ? "default" : "outline"} className="animate-fade-in">
                          {step.action}
                        </Badge>
                        {!step.completed && index === currentStep && (
                          <ArrowRight className="h-4 w-4 text-blue-500 animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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

                    {allItemsFound && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">Shopping Complete!</p>
                            <p className="text-sm text-green-700">Ready to start delivery</p>
                          </div>
                          <Button onClick={completeShoppingAndStartDelivery} className="bg-green-600 hover:bg-green-700">
                            <Truck className="h-4 w-4 mr-2" />
                            Start Delivery
                          </Button>
                        </div>
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
                              <div className="flex items-center text-yellow-600">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Pending
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Shopping Order</h3>
                <p className="text-muted-foreground text-center">
                  Accept an order from the Available tab to start shopping
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          {/* Delivery Process Steps */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-orange-600" />
                <span>Delivery Protocol</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getDeliverySteps().map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      step.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-orange-300 bg-orange-50 text-orange-600'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${step.completed ? 'text-green-600' : 'text-gray-900'}`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <Badge variant={step.completed ? "default" : "outline"} className="animate-fade-in">
                      {step.action}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Delivery Queue</h3>
            <Badge variant="outline">
              {deliveryQueue.filter(o => o.workflow_phase !== 'delivered').length} ready
            </Badge>
          </div>

          {deliveryQueue.length > 0 ? (
            <div className="space-y-4">
              {deliveryQueue.map(order => (
                <Card key={order.id} className="border-blue-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={order.customer_avatar} />
                          <AvatarFallback>{order.customer_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <Truck className="h-5 w-5 text-blue-600" />
                            <span>{order.customer_name}</span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id} • {order.total_items} items
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>
                      <Badge variant={order.workflow_phase === 'in_transit' ? 'default' : 'secondary'}>
                        {order.workflow_phase === 'ready_for_delivery' ? 'Ready' : 
                         order.workflow_phase === 'in_transit' ? 'In Transit' : 'Delivered'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tip:</span>
                        <span className="font-bold text-green-600">+{formatCurrency(order.tip_amount || 0)}</span>
                      </div>

                      {order.delivery_instructions && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Delivery Instructions:</p>
                          <p className="text-sm text-blue-800">{order.delivery_instructions}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {order.workflow_phase === 'ready_for_delivery' && (
                          <>
                            <Button onClick={() => startDelivery(order.id)} className="flex-1">
                              <Navigation className="h-4 w-4 mr-2" />
                              Start Delivery
                            </Button>
                            <Button variant="outline" size="icon">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {order.workflow_phase === 'in_transit' && (
                          <>
                            <Button onClick={captureDeliveryProof} variant="outline" className="flex-1">
                              <Camera className="h-4 w-4 mr-2" />
                              Photo Proof
                            </Button>
                            <Button onClick={() => completeDelivery(order.id)} className="flex-1">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                          </>
                        )}

                        {order.workflow_phase === 'delivered' && (
                          <div className="flex items-center text-green-600 font-medium">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Delivered Successfully
                          </div>
                        )}
                      </div>

                      {deliveryProof && order.workflow_phase === 'in_transit' && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-800">✓ Delivery proof captured</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Deliveries Ready</h3>
                <p className="text-muted-foreground text-center">
                  Complete shopping orders to add them to the delivery queue
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Available Orders Tab */}
        <TabsContent value="available" className="space-y-4">
          {availableOrders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">Order #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  </div>
                  <Badge variant={order.priority === 'express' ? 'destructive' : 'secondary'}>
                    {order.priority.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Items:</span>
                    <p className="font-semibold">{order.total_items}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <p className="font-semibold">{order.estimated_time}min</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Store:</span>
                    <p className="font-semibold">{order.store_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tip:</span>
                    <p className="font-semibold text-green-600">+{formatCurrency(order.tip_amount || 0)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Delivery: </span>
                    <span className="font-medium">{order.delivery_address}</span>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => setActiveOrder(order)}
                  >
                    Accept Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Customer Communication</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg min-h-48">
                  <p className="text-sm text-muted-foreground">Messages will appear here...</p>
                </div>
                
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={sendCustomerMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
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
                    <span>Average Rating</span>
                    <span className="font-bold">{shopperStats.customer_rating}/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">Super Shopper Badge</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-green-500" />
                    <span className="text-sm">95%+ Find Rate</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <span className="text-sm">Speed Demon</span>
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