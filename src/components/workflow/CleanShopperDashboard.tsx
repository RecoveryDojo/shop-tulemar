import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShoppingCart, 
  Package, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Truck,
  Clock,
  User,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useShopperOrders, ShoppingOrder, OrderItem } from '@/hooks/useShopperOrders';
import { useOrderWorkflow } from '@/hooks/useOrderWorkflow';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import { MessageInterface } from './MessageInterface';

export function CleanShopperDashboard() {
  const { user } = useAuth();
  const { 
    availableOrders, 
    activeOrders, 
    deliveryQueue, 
    loading: ordersLoading, 
    error: ordersError,
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

  const { toast } = useToast();
  
  const [activeOrder, setActiveOrder] = useState<ShoppingOrder | null>(null);
  const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
  const [itemNotes, setItemNotes] = useState<{ [key: string]: string }>({});
  const [showDebugData, setShowDebugData] = useState(false);
  const [showMessageInterface, setShowMessageInterface] = useState(false);

  // Set first active order on load
  useEffect(() => {
    if (activeOrders.length > 0 && !activeOrder) {
      setActiveOrder(activeOrders[0]);
    }
  }, [activeOrders, activeOrder]);

  // Initialize item quantities
  useEffect(() => {
    if (activeOrder?.items) {
      const quantities: { [key: string]: number } = {};
      activeOrder.items.forEach(item => {
        quantities[item.id] = item.found_quantity || 0;
      });
      setItemQuantities(quantities);
    }
  }, [activeOrder]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      await refetchOrders();
      toast({
        title: "Order Accepted",
        description: "You can now start shopping for this order."
      });
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleStartShopping = async (orderId: string) => {
    try {
      await startShopping(orderId);
      await refetchOrders();
    } catch (error) {
      console.error('Error starting shopping:', error);
    }
  };

  const handleMarkItemFound = async (itemId: string) => {
    try {
      const quantity = itemQuantities[itemId] || 0;
      const notes = itemNotes[itemId] || '';
      
      if (quantity === 0) {
        toast({
          title: "Error",
          description: "Please enter a quantity found greater than 0",
          variant: "destructive",
        });
        return;
      }
      
      await markItemFound(itemId, quantity, notes);
      
      // Show success feedback
      toast({
        title: "Item Found!",
        description: `Marked ${quantity} items as found`,
      });
      
      // Clear the input for this item
      setItemQuantities(prev => ({ ...prev, [itemId]: 0 }));
      setItemNotes(prev => ({ ...prev, [itemId]: '' }));
      
      // Refresh data
      await refetchOrders();
    } catch (error) {
      console.error('Error marking item found:', error);
    }
  };

  const handleRequestSubstitution = async (itemId: string, reason: string) => {
    try {
      const notes = itemNotes[itemId] || '';
      await requestSubstitution(itemId, reason, '', notes);
      
      // Show success feedback  
      toast({
        title: "Substitution Requested",
        description: "Customer will be notified about substitution options",
      });
      
      // Clear the input for this item
      setItemNotes(prev => ({ ...prev, [itemId]: '' }));
      
      // Refresh data
      await refetchOrders();
    } catch (error) {
      console.error('Error requesting substitution:', error);
    }
  };

  const handleCompleteShopping = async () => {
    if (!activeOrder) return;
    
    try {
      await completeShopping(activeOrder.id);
      await refetchOrders();
      setActiveOrder(null);
      toast({
        title: "Shopping Complete",
        description: "Order is ready for delivery."
      });
    } catch (error) {
      console.error('Error completing shopping:', error);
    }
  };

  const handleStartDelivery = async (orderId: string) => {
    try {
      await startDelivery(orderId);
      await refetchOrders();
    } catch (error) {
      console.error('Error starting delivery:', error);
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    try {
      await completeDelivery(orderId);
      await refetchOrders();
      toast({
        title: "Delivery Complete",
        description: "Order has been successfully delivered."
      });
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  const getCompletionPercentage = (items: OrderItem[]) => {
    if (!items || items.length === 0) return 0;
    const completedItems = items.filter(item => 
      item.shopping_status === 'found' || 
      item.shopping_status === 'substitution_needed'
    ).length;
    return Math.round((completedItems / items.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'shopping': return 'bg-orange-500';
      case 'packed': return 'bg-purple-500';
      case 'in_transit': return 'bg-green-500';
      case 'delivered': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Shopper Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                  <span>Active: {activeOrders.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  <span>Available: {availableOrders.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-green-500" />
                  <span>Delivery: {deliveryQueue.length}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebugData(!showDebugData)}
              >
                {showDebugData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDebugData ? 'Hide' : 'Show'} Data
              </Button>
              
              <Button variant="outline" size="sm" onClick={refetchOrders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebugData && (
        <div className="bg-muted border-b p-4">
          <div className="container mx-auto">
            <h3 className="font-semibold mb-2">Debug Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Active Orders ({activeOrders.length}):</strong>
                <pre className="mt-1 text-xs bg-background p-2 rounded overflow-x-auto">
                  {JSON.stringify(activeOrders.map(o => ({ id: o.id, status: o.status, customer: o.customer_name })), null, 2)}
                </pre>
              </div>
              <div>
                <strong>Available Orders ({availableOrders.length}):</strong>
                <pre className="mt-1 text-xs bg-background p-2 rounded overflow-x-auto">
                  {JSON.stringify(availableOrders.map(o => ({ id: o.id, status: o.status, customer: o.customer_name })), null, 2)}
                </pre>
              </div>
              <div>
                <strong>Delivery Queue ({deliveryQueue.length}):</strong>
                <pre className="mt-1 text-xs bg-background p-2 rounded overflow-x-auto">
                  {JSON.stringify(deliveryQueue.map(o => ({ id: o.id, status: o.status, customer: o.customer_name })), null, 2)}
                </pre>
              </div>
            </div>
            {ordersError && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                <strong>Error:</strong> {ordersError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="available">Available Orders ({availableOrders.length})</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Queue ({deliveryQueue.length})</TabsTrigger>
          </TabsList>

          {/* Active Orders Tab */}
          <TabsContent value="active" className="space-y-6">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
                  <p className="text-muted-foreground text-center">
                    You don't have any active shopping orders. Check the Available Orders tab to accept new orders.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {/* Order Selection */}
                {activeOrders.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Active Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {activeOrders.map((order) => (
                          <div
                            key={order.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              activeOrder?.id === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                            }`}
                            onClick={() => setActiveOrder(order)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{order.customer_name}</div>
                                <div className="text-sm text-muted-foreground">{order.property_address}</div>
                              </div>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Order Details */}
                {activeOrder && (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Shopping for {activeOrder.customer_name}</CardTitle>
                            <p className="text-muted-foreground">{activeOrder.property_address}</p>
                          </div>
                          <Badge className={getStatusColor(activeOrder.status)}>
                            {activeOrder.status}
                          </Badge>
                        </div>
                        <Progress value={getCompletionPercentage(activeOrder.items || [])} className="w-full" />
                        <p className="text-sm text-muted-foreground">
                          {getCompletionPercentage(activeOrder.items || [])}% complete
                        </p>
                      </CardHeader>
                    </Card>

                    {/* Shopping List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Shopping List ({activeOrder.items?.length || 0} items)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {activeOrder.items?.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-start gap-4 mb-3">
                              {/* Product Image */}
                              {item.product?.image_url && (
                                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.product.image_url} 
                                    alt={item.product.name || 'Product'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium">{item.product?.name || 'Product'}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Quantity: {item.quantity} • {formatCurrency(item.unit_price)} each
                                    </p>
                                    {item.product?.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{item.product.description}</p>
                                    )}
                                  </div>
                                  <Badge variant={
                                    item.shopping_status === 'found' ? 'default' :
                                    item.shopping_status === 'substitution_needed' ? 'secondary' :
                                    'outline'
                                  }>
                                    {item.shopping_status || 'pending'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {item.shopping_status === 'pending' && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Found quantity"
                                    value={itemQuantities[item.id] || ''}
                                    onChange={(e) => setItemQuantities(prev => ({
                                      ...prev,
                                      [item.id]: parseInt(e.target.value) || 0
                                    }))}
                                    min="0"
                                    max={item.quantity}
                                    className="w-32"
                                  />
                                  <span className="text-sm text-muted-foreground">of {item.quantity}</span>
                                </div>

                                <Textarea
                                  placeholder="Notes (optional)"
                                  value={itemNotes[item.id] || ''}
                                  onChange={(e) => setItemNotes(prev => ({
                                    ...prev,
                                    [item.id]: e.target.value
                                  }))}
                                  className="min-h-[60px]"
                                />

                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkItemFound(item.id)}
                                    disabled={workflowLoading || (itemQuantities[item.id] || 0) === 0}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {workflowLoading ? 'Updating...' : 'Mark Found'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      handleRequestSubstitution(item.id, 'Not available in requested quantity');
                                      setShowMessageInterface(true);
                                    }}
                                    disabled={workflowLoading}
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {workflowLoading ? 'Requesting...' : 'Request Substitution'}
                                  </Button>
                                </div>
                                
                                {/* Show what happens when buttons are clicked */}
                                <div className="text-xs text-muted-foreground mt-2">
                                  <p>• Mark Found: Updates quantity and notifies customer</p>
                                  <p>• Request Substitution: Asks customer for alternate product approval</p>
                                </div>
                              </div>
                            )}

                            {item.shopping_status === 'found' && (
                              <div className="text-sm text-green-600">
                                ✓ Found {item.found_quantity} of {item.quantity}
                                {item.shopper_notes && <p className="mt-1">Notes: {item.shopper_notes}</p>}
                              </div>
                            )}

                            {item.shopping_status === 'substitution_needed' && (
                              <div className="text-sm text-orange-600">
                                ⚠ Substitution needed
                                {item.shopper_notes && <p className="mt-1">Notes: {item.shopper_notes}</p>}
                              </div>
                            )}
                          </div>
                        ))}

                        {activeOrder.status === 'shopping' && 
                         getCompletionPercentage(activeOrder.items || []) === 100 && (
                          <div className="pt-4 border-t">
                            <Button 
                              onClick={handleCompleteShopping}
                              disabled={workflowLoading}
                              className="w-full"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Complete Shopping & Pack Items
                            </Button>
                          </div>
                        )}

                        {(activeOrder.status === 'assigned' || activeOrder.status === 'confirmed') && (
                          <div className="pt-4 border-t">
                            <Button 
                              onClick={() => handleStartShopping(activeOrder.id)}
                              disabled={workflowLoading}
                              className="w-full"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {workflowLoading ? 'Starting...' : 'Start Shopping'}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              This will change order status to "Shopping" and you can start marking items as found
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Order Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Order Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Customer:</strong> {activeOrder.customer_name}
                          </div>
                          <div>
                            <strong>Phone:</strong> {activeOrder.customer_phone || 'Not provided'}
                          </div>
                          <div>
                            <strong>Address:</strong> {activeOrder.property_address}
                          </div>
                          <div>
                            <strong>Total:</strong> {formatCurrency(activeOrder.total_amount)}
                          </div>
                        </div>
                        {activeOrder.special_instructions && (
                          <div>
                            <strong>Special Instructions:</strong>
                            <p className="mt-1 text-muted-foreground">{activeOrder.special_instructions}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Available Orders Tab */}
          <TabsContent value="available" className="space-y-4">
            {availableOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Available Orders</h3>
                  <p className="text-muted-foreground text-center">
                    There are no orders available to accept at the moment. Check back later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availableOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{order.customer_name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{order.property_address}</p>
                          <p className="text-sm">
                            {order.items?.length || 0} items • {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={workflowLoading}
                        >
                          Accept Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Delivery Queue Tab */}
          <TabsContent value="delivery" className="space-y-4">
            {deliveryQueue.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Deliveries Pending</h3>
                  <p className="text-muted-foreground text-center">
                    You don't have any orders ready for delivery.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {deliveryQueue.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{order.customer_name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{order.property_address}</p>
                          <p className="text-sm">
                            {order.items?.length || 0} items • {formatCurrency(order.total_amount)}
                          </p>
                          <Badge className={`${getStatusColor(order.status)} mt-2`}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'packed' && (
                            <Button 
                              onClick={() => handleStartDelivery(order.id)}
                              disabled={workflowLoading}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Start Delivery
                            </Button>
                          )}
                          {order.status === 'in_transit' && (
                            <Button 
                              onClick={() => handleCompleteDelivery(order.id)}
                              disabled={workflowLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete Delivery
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Message Interface Overlay */}
      {showMessageInterface && activeOrder && (
        <MessageInterface
          orderId={activeOrder.id}
          customerEmail={activeOrder.customer_email}
          customerName={activeOrder.customer_name}
          isVisible={showMessageInterface}
          onClose={() => setShowMessageInterface(false)}
        />
      )}
    </div>
  );
}