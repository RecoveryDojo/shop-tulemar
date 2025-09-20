import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
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
  ArrowRight,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { ShopperGuideDialog } from './ShopperGuideDialog';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { useNotifications } from '@/hooks/useNotifications';
import { FloatingCommunicationWidget } from './FloatingCommunicationWidget';
import { useShopperOrders, ShoppingOrder, OrderItem } from '@/hooks/useShopperOrders';
import { useShopperStats } from '@/hooks/useShopperStats';
import { useOrderWorkflow } from '@/hooks/useOrderWorkflow';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ShopperStats {
  daily_earnings: number;
  weekly_earnings: number;
  orders_completed: number;
  customer_rating: number;
  efficiency_score: number;
  find_rate: number;
}

export function EnhancedShopperDashboard() {
  const { user } = useAuth();
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

  const { availableOrders, activeOrders, deliveryQueue, loading, refetchOrders } = useShopperOrders();
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

  const captureDeliveryProof = () => {
    fileInputRef.current?.click();
  };

  const sendCustomerMessage = async () => {
    if (!customerMessage.trim() || !activeOrder) return;
    try {
      await supabase.functions.invoke('create-notification', {
        body: {
          orderId: activeOrder.id,
          notificationType: 'shopper_message',
          recipientType: 'client',
          recipientIdentifier: activeOrder.customer_email,
          channel: 'in_app',
          message: customerMessage.trim()
        }
      });
      toast({ title: 'Message sent', description: 'Customer has been notified.' });
      setCustomerMessage('');
    } catch (error: any) {
      toast({ title: 'Failed to send', description: error.message || 'Unable to send message', variant: 'destructive' });
    }
  };

  const completedItems = activeOrder?.items.filter(item => item.shopping_status === 'found').length || 0;
  const totalItems = activeOrder?.items.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const allItemsFound = activeOrder && activeOrder.items.every(item => item.shopping_status === 'found');

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
      completed: activeOrder !== null && activeOrder.shopping_started_at !== null,
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
    if (activeOrder.status === 'assigned') return "Start shopping for this order";
    if (activeOrder.status === 'shopping') {
      if (!allItemsFound) return "Continue finding items on your shopping list";
      return "All items found! Ready to complete shopping";
    }
    if (activeOrder.status === 'packed') return "Order is packed and ready for delivery";
    if (activeOrder.status === 'in_transit') return "Navigate to customer and complete delivery";
    return "Order completed successfully";
  };
  
  const filteredItems = activeOrder?.items.filter(item => {
    const matchesSearch = item.product?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all'; // For now, show all since we don't have category data
    return matchesSearch && matchesCategory;
  }) || [];

  if (ordersLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading shopper dashboard...</span>
        </div>
                </div>
    );
  }

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
                  onClick={() => setShowGuideDialog(true)}
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
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
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Shopper Dashboard</h1>
                  <p className="text-white/80 text-lg">Manage your shopping orders and deliveries</p>
                </div>
              </div>
            </div>

            {/* Stats Preview */}
            <div className="hidden md:grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : formatCurrency(shopperStats.dailyEarnings)}
                </div>
                <div className="text-xs text-white/80">Today's Earnings</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : shopperStats.customerRating > 0 ? shopperStats.customerRating.toFixed(1) : '0'}
                </div>
                <div className="text-xs text-white/80">Customer Rating</div>
              </div>
                </div>
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
                <p className="text-xl font-bold text-primary">{formatCurrency(shopperStats.daily_earnings)}</p>
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
                <p className="text-xl font-bold text-yellow-600">{shopperStats.customer_rating}</p>
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
                <p className="text-xl font-bold text-green-600">{shopperStats.find_rate}%</p>
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
                <p className="text-xl font-bold text-blue-600">{shopperStats.efficiency_score}%</p>
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
                            disabled={workflowLoading}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Start Shopping
                          </Button>
                        )}
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
                            <Package className="h-4 w-4 mr-2" />
                            Complete Shopping
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
                      <Input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Batch Photos
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
                          item.shopping_status === 'found' 
                            ? 'bg-green-50 border-green-200' 
                            : item.shopping_status === 'substitution_needed'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium">{item.product?.name || 'Unknown Product'}</h4>
                              <Badge variant="outline" className="text-xs">
                                ${item.unit_price}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} • {item.product?.unit || 'each'}
                            </p>
                            {item.shopper_notes && (
                              <p className="text-sm text-blue-600 mt-1">
                                Note: {item.shopper_notes}
                              </p>
                            )}
                            {item.substitution_data && Object.keys(item.substitution_data).length > 0 && (
                              <p className="text-sm text-yellow-700 mt-1">
                                Substitution: {item.substitution_data.reason}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            {item.shopping_status === 'pending' && (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setItemQuantities(prev => ({
                                      ...prev,
                                      [item.id]: Math.max(0, (prev[item.id] || item.quantity) - 1)
                                    }))}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={itemQuantities[item.id] || item.quantity}
                                    onChange={(e) => setItemQuantities(prev => ({
                                      ...prev,
                                      [item.id]: parseInt(e.target.value) || 0
                                    }))}
                                    className="w-16 text-center text-sm"
                                    min="0"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setItemQuantities(prev => ({
                                      ...prev,
                                      [item.id]: (prev[item.id] || item.quantity) + 1
                                    }))}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Input
                                  placeholder="Notes..."
                                  value={itemNotes[item.id] || ''}
                                  onChange={(e) => setItemNotes(prev => ({
                                    ...prev,
                                    [item.id]: e.target.value
                                  }))}
                                  className="text-sm"
                                />
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkItemFound(item.id)}
                                    disabled={workflowLoading}
                                    className="flex-1"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Found
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRequestSubstitution(item.id, 'Customer approval needed')}
                                    disabled={workflowLoading}
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Issue
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Camera className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {item.shopping_status === 'found' && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Found ({item.found_quantity})
                              </div>
                            )}

                            {item.shopping_status === 'substitution_needed' && (
                              <div className="flex items-center text-yellow-600">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Pending Approval
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
            <Badge variant="outline">
              {deliveryQueue.filter(o => o.status !== 'delivered').length} ready
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
                          <AvatarFallback>{order.customer_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <Truck className="h-5 w-5 text-blue-600" />
                            <span>{order.customer_name}</span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id.slice(-6)} • {order.items.length} items
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {order.property_address}
                          </p>
                        </div>
                      </div>
                      <Badge variant={order.status === 'in_transit' ? 'default' : 'secondary'}>
                        {order.status === 'packed' ? 'Ready' : 
                         order.status === 'in_transit' ? 'In Transit' : 'Delivered'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                      </div>

                      <div className="flex gap-2">
                        {order.status === 'packed' && (
                          <>
                            <Button 
                              onClick={() => handleStartDelivery(order.id)} 
                              className="flex-1"
                              disabled={workflowLoading}
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              Start Delivery
                            </Button>
                            <Button variant="outline" size="icon">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {order.status === 'in_transit' && (
                          <>
                            <Button onClick={captureDeliveryProof} variant="outline" className="flex-1">
                              <Camera className="h-4 w-4 mr-2" />
                              Photo Proof
                            </Button>
                            <Button 
                              onClick={() => handleCompleteDelivery(order.id)}
                              disabled={workflowLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Delivery Orders</h3>
                <p className="text-muted-foreground text-center">
                  Complete shopping orders to see them here for delivery
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Available Orders Tab */}
        <TabsContent value="available" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available Orders</h3>
            <Badge variant="outline">
              {availableOrders.length} available
            </Badge>
          </div>

          {availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.map(order => (
                <Card key={order.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{order.customer_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{order.customer_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} items • {formatCurrency(order.total_amount)}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {order.property_address}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={workflowLoading}
                      >
                        Accept Order
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Available Orders</h3>
                <p className="text-muted-foreground text-center">
                  Check back later for new shopping opportunities
                </p>
              </CardContent>
            </Card>
          )}
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
                  placeholder="Type your message to the customer..."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                />
                <Button onClick={sendCustomerMessage} disabled={!customerMessage.trim()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
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
                    <span className="font-bold">
                      {statsLoading ? '...' : shopperStats.ordersCompleted}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Earnings</span>
                    <span className="font-bold">
                      {statsLoading ? '...' : formatCurrency(shopperStats.weeklyEarnings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Rating</span>
                    <span className="font-bold flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {statsLoading ? '...' : shopperStats.customerRating > 0 ? shopperStats.customerRating.toFixed(1) : '0'}
                    </span>
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
                    <span>Super Shopper</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-green-500" />
                    <span>Perfect Find Rate</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <span>Speed Demon</span>
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
    </div>
  );
}