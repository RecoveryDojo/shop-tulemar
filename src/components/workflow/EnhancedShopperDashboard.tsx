import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ShoppingCart, 
  Package, 
  MapPin, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  MessageSquare, 
  Navigation, 
  PlayCircle, 
  DollarSign,
  Target,
  Zap,
  ArrowRight,
  Search,
  Filter,
  Truck,
  Phone,
  Clock,
  ScanLine,
  Gift,
  Users,
  Info,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { useShopperOrders, ShoppingOrder, OrderItem } from '@/hooks/useShopperOrders';
import { useOrderWorkflow } from '@/hooks/useOrderWorkflow';
import { useShopperStats } from '@/hooks/useShopperStats';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ShopperGuideDialog } from './ShopperGuideDialog';
import { FloatingCommunicationWidget } from './FloatingCommunicationWidget';

// Using ShoppingOrder and OrderItem interfaces from useShopperOrders hook

export function EnhancedShopperDashboard() {
  const { 
    availableOrders, 
    activeOrders, 
    deliveryQueue, 
    loading: ordersLoading, 
    refetchOrders 
  } = useShopperOrders();
  
  const {
    loading: workflowLoading,
    acceptOrder,
    startShopping,
    markItemFound,
    requestSubstitution,
    completeShopping,
    startDelivery,
    completeDelivery
  } = useOrderWorkflow();

  const { stats: shopperStats, loading: statsLoading } = useShopperStats();
  const { teamMembers } = useTeamMembers();
  const { toast } = useToast();

  const [activeOrder, setActiveOrder] = useState<ShoppingOrder | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('shopping');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerMessage, setCustomerMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [deliveryProof, setDeliveryProof] = useState<string | null>(null);
  const [showGuideDialog, setShowGuideDialog] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDeliveryProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrder) return;
    const path = `delivery-proof/${activeOrder.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('message-attachments').upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      setDeliveryProof(path);
      toast({ title: "Delivery proof uploaded", description: "Photo saved successfully." });
    }
    e.currentTarget.value = "";
  };

  // Set the first active order when they load
  useEffect(() => {
    if (activeOrders.length > 0 && !activeOrder) {
      setActiveOrder(activeOrders[0]);
    }
  }, [activeOrders, activeOrder]);

  // Initialize item quantities when active order changes
  useEffect(() => {
    if (activeOrder) {
      const quantities: Record<string, number> = {};
      activeOrder.items.forEach(item => {
        quantities[item.id] = item.found_quantity || item.quantity;
      });
      setItemQuantities(quantities);
    }
  }, [activeOrder]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      refetchOrders();
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  };

  const handleStartShopping = async (orderId: string) => {
    try {
      await startShopping(orderId);
      refetchOrders();
    } catch (error) {
      console.error('Failed to start shopping:', error);
    }
  };

  const handleMarkItemFound = async (itemId: string) => {
    try {
      const quantity = itemQuantities[itemId] || 0;
      const notes = itemNotes[itemId] || '';
      await markItemFound(itemId, quantity, notes);
      refetchOrders();
    } catch (error) {
      console.error('Failed to mark item as found:', error);
    }
  };

  const handleRequestSubstitution = async (itemId: string, reason: string) => {
    try {
      const notes = itemNotes[itemId] || '';
      await requestSubstitution(itemId, reason, '', notes);
      refetchOrders();
    } catch (error) {
      console.error('Failed to request substitution:', error);
    }
  };

  const handleCompleteShopping = async () => {
    if (!activeOrder) return;
    try {
      await completeShopping(activeOrder.id);
      setActiveOrder(null);
      setActiveTab('delivery');
      refetchOrders();
    } catch (error) {
      console.error('Failed to complete shopping:', error);
    }
  };

  const handleStartDelivery = async (orderId: string) => {
    try {
      await startDelivery(orderId);
      refetchOrders();
    } catch (error) {
      console.error('Failed to start delivery:', error);
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    try {
      await completeDelivery(orderId);
      refetchOrders();
    } catch (error) {
      console.error('Failed to complete delivery:', error);
    }
  };

  const getCompletionPercentage = (items?: Array<{shopping_status: string}>) => {
    const orderItems = items || activeOrder?.items || [];
    if (orderItems.length === 0) return 0;
    const completedItems = orderItems.filter(item => 
      ['found', 'substituted'].includes(item.shopping_status)
    ).length;
    return Math.round((completedItems / orderItems.length) * 100);
  };

  const getCurrentProtocol = () => {
    if (!activeOrder) return "No active order - Check available orders";
    
    switch (activeOrder.status) {
      case 'assigned':
        return "Start shopping protocol - Begin with produce and refrigerated items";
      case 'shopping':
        const progress = getCompletionPercentage();
        return `Shopping in progress (${progress}% complete) - Scan items and take photos`;
      case 'packed':
        return "Order packed and ready for delivery handoff";
      default:
        return "Monitor order status and await next steps";
    }
  };

  const getShoppingSteps = () => {
    if (!activeOrder) return [];
    
    const completedItems = activeOrder.items.filter(item => 
      ['found', 'substituted'].includes(item.shopping_status)
    ).length;
    const totalItems = activeOrder.items.length;
    
    return [
      {
        id: 1,
        title: "Start Shopping",
        description: "Begin shopping protocol",
        completed: activeOrder.status !== 'assigned',
        action: "Begin"
      },
      {
        id: 2,
        title: "Find Items",
        description: `${completedItems}/${totalItems} items found`,
        completed: completedItems === totalItems,
        action: "Shopping"
      },
      {
        id: 3,
        title: "Pack & Complete",
        description: "Organize and pack items",
        completed: activeOrder.status === 'packed',
        action: "Pack"
      }
    ];
  };

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-muted rounded w-64 mx-auto"></div>
          <div className="h-32 bg-muted rounded w-96 mx-auto"></div>
        </div>
      </div>
    );
  }

  const completedItems = activeOrder ? activeOrder.items.filter(item => 
    ['found', 'substituted'].includes(item.shopping_status)
  ).length : 0;
  const totalItems = activeOrder?.items.length || 0;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const allItemsFound = activeOrder ? completedItems === totalItems : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Branded Dashboard Header */}
      <div className="bg-gradient-to-r from-primary via-primary to-blue-600 text-white">
        {/* Top Brand Bar */}
        <div className="border-b border-white/20 bg-black/10">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-white">Tulemar Shop</h1>
                  <p className="text-xs text-white/80">Premium Grocery Delivery</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <NotificationDropdown 
                  userRole="shopper" 
                  onViewAll={() => setShowNotificationCenter(true)}
                />
                <UserProfileMenu />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  onClick={() => setIsGuideOpen(true)}
                >
                  <Info className="h-4 w-4 mr-2" />
                  Guide
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Title Section */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Shopper Dashboard</h1>
                  <p className="text-white/80 text-lg">Manage shopping orders and deliveries</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : shopperStats.dailyEarnings > 0 ? formatCurrency(shopperStats.dailyEarnings) : '$0'}
                </div>
                <div className="text-xs text-white/80">Today's Earnings</div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : shopperStats.ordersCompleted}
                </div>
                <div className="text-xs text-white/80">Orders Complete</div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : shopperStats.customerRating > 0 ? shopperStats.customerRating.toFixed(1) : '0'}
                </div>
                <div className="text-xs text-white/80">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="h-4 bg-gradient-to-b from-transparent to-background/20"></div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-white to-primary/5 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(shopperStats.dailyEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 bg-gradient-to-br from-white to-yellow-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-xl font-bold text-yellow-600">{shopperStats.customerRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-gradient-to-br from-white to-green-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Find Rate</p>
                <p className="text-xl font-bold text-green-600">{shopperStats.findRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-xl font-bold text-blue-600">{shopperStats.efficiencyScore}%</p>
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
            <Button size="sm" variant="outline" className="hover-scale" onClick={() => setIsGuideOpen(true)}>
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
                        <AvatarFallback>{activeOrder.customer_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{activeOrder.customer_name}</span>
                          <Badge variant="secondary">Order #{activeOrder.id.slice(-6)}</Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {activeOrder.items.length} items • ${activeOrder.total_amount}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {activeOrder.property_address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mt-2">
                        {activeOrder.status === 'assigned' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStartShopping(activeOrder.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={workflowLoading}
                          >
                            Start Shopping
                          </Button>
                        )}
                        {activeOrder.status === 'shopping' && getCompletionPercentage() === 100 && (
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteShopping()}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={workflowLoading}
                          >
                            Complete & Pack
                          </Button>
                        )}
                        <Badge 
                          variant={activeOrder.status === 'shopping' ? 'default' : 'secondary'}
                          className="animate-fade-in"
                        >
                          {activeOrder.status}
                        </Badge>
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

                    {allItemsFound && activeOrder.status === 'shopping' && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">Shopping Complete!</p>
                            <p className="text-sm text-green-700">Ready to pack and prepare for delivery</p>
                          </div>
                          <Button 
                            onClick={handleCompleteShopping} 
                            className="bg-green-600 hover:bg-green-700"
                            disabled={workflowLoading}
                          >
                            Complete & Pack
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shopping List */}
              <Card>
                <CardHeader>
                  <CardTitle>Shopping List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeOrder.items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{item.product?.name}</h4>
                              <Badge variant={
                                item.shopping_status === 'found' ? 'default' :
                                item.shopping_status === 'substitution_needed' ? 'secondary' :
                                'outline'
                              }>
                                {item.shopping_status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} • ${item.unit_price}
                            </p>
                            
                            {item.shopping_status === 'pending' && activeOrder.status === 'shopping' && (
                              <div className="mt-3 space-y-2">
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => handleMarkItemFound(item.id)}
                                    disabled={workflowLoading}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Found
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleRequestSubstitution(item.id, 'Out of stock')}
                                    disabled={workflowLoading}
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Substitute
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Camera className="h-4 w-4 mr-1" />
                                    Photo
                                  </Button>
                                </div>
                              </div>
                            )}

                            {item.shopping_status === 'found' && (
                              <div className="mt-2 text-sm text-green-600 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Found and added to cart
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Delivery Queue</h3>
            <Badge variant="outline">{deliveryQueue.length} orders ready</Badge>
          </div>

          <div className="space-y-4">
            {deliveryQueue.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{order.customer_name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {order.property_address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} items • ${order.total_amount}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{order.status}</Badge>
                      <Button 
                        size="sm"
                        onClick={() => handleStartDelivery(order.id)}
                        disabled={workflowLoading}
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Start Delivery
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {deliveryQueue.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Deliveries Ready</h3>
                  <p className="text-muted-foreground text-center">
                    Orders will appear here when shopping is complete
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Available Orders Tab */}
        <TabsContent value="available" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available Orders</h3>
            <Badge variant="outline">{availableOrders.length} available</Badge>
          </div>

          <div className="space-y-4">
            {availableOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{order.customer_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items • ${order.total_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Delivery: {order.property_address}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveOrder(order)}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleAcceptOrder(order.id)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={workflowLoading}
                      >
                        Accept Order
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {availableOrders.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Available Orders</h3>
                  <p className="text-muted-foreground text-center">
                    New orders will appear here when available
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Send a message to the customer..."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button>Send Message</Button>
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Send Photo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Today's Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Orders Completed</span>
                    <span className="font-medium">{shopperStats.ordersCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Find Rate</span>
                    <span className="font-medium">{shopperStats.findRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Customer Rating</span>
                    <span className="font-medium">{shopperStats.customerRating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs and Floating Widgets */}
      {showGuideDialog && (
        <ShopperGuideDialog 
          isOpen={showGuideDialog} 
          onClose={() => setShowGuideDialog(false)}
          currentProtocol={getCurrentProtocol()}
        />
      )}

      {showNotificationCenter && (
        <NotificationCenter
          userRole="shopper"
          className={showNotificationCenter ? "fixed inset-0 z-50 bg-background" : "hidden"}
        />
      )}
      
      {/* Hidden input for delivery proof uploads */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleDeliveryProofChange}
      />

      <FloatingCommunicationWidget
        stakeholders={teamMembers}
        orderId={activeOrder?.id}
        orderPhase={activeOrder?.status || 'pending'}
      />
    </div>
  );
}