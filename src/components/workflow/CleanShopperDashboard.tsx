import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useShopperOrders } from '@/hooks/useShopperOrders';
import { useEnhancedOrderWorkflow } from '@/hooks/useEnhancedOrderWorkflow';
import { orderEventBus } from '@/lib/orderEventBus';
import { 
  Package, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus,
  Minus,
  Camera,
  MessageSquare,
  Truck,
  MapPin,
  User,
  DollarSign,
  Star,
  Info,
  Bug,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function CleanShopperDashboard() {
  const { user } = useAuth();
  const { 
    shopperQueue, 
    availableOrders, 
    loading: ordersLoading, 
    error: ordersError,
    refetchOrders 
  } = useShopperOrders();

  const {
    acceptOrder,
    startShopping,
    markItemFound,
    requestSubstitution,
    completeShopping,
    startDelivery,
    completeDelivery,
    loading: workflowLoading,
    lastError
  } = useEnhancedOrderWorkflow({ optimistic: false, requireExpectedStatus: true });

  const [activeOrder, setActiveOrder] = useState(null);
  const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
  const [itemNotes, setItemNotes] = useState<{ [key: string]: string }>({});
  const [substitutionRequests, setSubstitutionRequests] = useState<{ [key: string]: string }>({});
  const [showSubstitutionForm, setShowSubstitutionForm] = useState<{ [key: string]: boolean }>({});
  const [showDebugData, setShowDebugData] = useState(false);
  const [showMessageInterface, setShowMessageInterface] = useState(false);

  // Order event bus subscriptions are handled in useShopperOrders

  // Set first active order on load
  useEffect(() => {
    if (shopperQueue.length > 0 && !activeOrder) {
      setActiveOrder(shopperQueue[0]);
    }
  }, [shopperQueue, activeOrder]);

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

  const handleItemFound = async (itemId: string, foundQuantity: number, notes?: string, photoUrl?: string) => {
    try {
      await markItemFound(itemId, foundQuantity, notes, photoUrl);
      
      // Publish item picked event
      const item = shopperQueue.flatMap(o => o.items).find(i => i.id === itemId);
      if (item) {
        const order = shopperQueue.find(o => o.items.some(i => i.id === itemId));
        if (order) {
          await orderEventBus.publish(order.id, 'ITEM_PICKED', {
            item_id: itemId,
            product_name: item.product?.name,
            found_quantity: foundQuantity,
            notes,
            photo_url: photoUrl
          });
        }
      }
      
      refetchOrders();
    } catch (error) {
      console.error('Error marking item found:', error);
    }
  };

  const handleSubstitutionRequest = async (itemId: string, reason: string, suggestedProduct?: string, notes?: string) => {
    try {
      await requestSubstitution(itemId, reason, suggestedProduct, notes);
      
      // Publish substitution suggested event
      const item = shopperQueue.flatMap(o => o.items).find(i => i.id === itemId);
      if (item) {
        const order = shopperQueue.find(o => o.items.some(i => i.id === itemId));
        if (order) {
          await orderEventBus.publish(order.id, 'SUBSTITUTION_SUGGESTED', {
            item_id: itemId,
            product_name: item.product?.name,
            reason,
            suggested_product: suggestedProduct,
            notes
          });
        }
      }
      
      refetchOrders();
    } catch (error) {
      console.error('Error requesting substitution:', error);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const order = shopperQueue.find(o => o.id === orderId) || availableOrders.find(o => o.id === orderId);
      await acceptOrder(orderId, order?.status || 'confirmed');
      await refetchOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleStartShopping = async (orderId: string) => {
    try {
      const order = shopperQueue.find(o => o.id === orderId) || availableOrders.find(o => o.id === orderId);
      await startShopping(orderId, order?.status || 'assigned');
      await refetchOrders();
    } catch (error) {
      console.error('Error starting shopping:', error);
    }
  };

  if (ordersLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-white';
      case 'confirmed': return 'bg-blue-500 text-white';
      case 'assigned': return 'bg-purple-500 text-white';
      case 'shopping': return 'bg-orange-500 text-white';
      case 'packed': return 'bg-green-500 text-white';
      case 'in_transit': return 'bg-indigo-500 text-white';
      case 'delivered': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusActions = (order: any) => {
    switch (order.status) {
      case 'assigned':
        return (
          <Button 
            onClick={() => handleStartShopping(order.id)}
            disabled={workflowLoading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Start Shopping
          </Button>
        );
      case 'shopping':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setActiveOrder(order)}
            >
              Manage Items
            </Button>
            <Button 
              onClick={() => completeShopping(order.id, 'shopping')}
              disabled={workflowLoading}
              className="bg-green-500 hover:bg-green-600"
            >
              Complete Shopping
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Shopper Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {user?.user_metadata?.display_name || user?.email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                  <span>Queue: {shopperQueue.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  <span>Available: {availableOrders.length}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebugData(!showDebugData)}
              >
                <Bug className="h-4 w-4 mr-2" />
                {showDebugData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              <UserProfileMenu />
            </div>
          </div>
        </div>

        {/* Debug Data */}
        {showDebugData && (
          <div className="bg-muted border-b p-4">
            <div className="container mx-auto">
              <h3 className="font-semibold mb-2">Debug Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Shopper Queue ({shopperQueue.length}):</strong>
                  <pre className="mt-1 text-xs bg-background p-2 rounded overflow-x-auto">
                    {JSON.stringify(shopperQueue.map(o => ({ id: o.id, status: o.status, customer: o.customer_name })), null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Available Orders ({availableOrders.length}):</strong>
                  <pre className="mt-1 text-xs bg-background p-2 rounded overflow-x-auto">
                    {JSON.stringify(availableOrders.map(o => ({ id: o.id, status: o.status, customer: o.customer_name })), null, 2)}
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queue">My Queue ({shopperQueue.length})</TabsTrigger>
            <TabsTrigger value="available">Available Orders ({availableOrders.length})</TabsTrigger>
          </TabsList>

          {/* Shopper Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            {shopperQueue.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
                  <p className="text-muted-foreground text-center">
                    You don't have any orders assigned to you right now. Check the Available tab for new orders.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {/* Order Selection */}
                {shopperQueue.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Active Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {shopperQueue.map((order) => (
                          <div
                            key={order.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              activeOrder?.id === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                            }`}
                            onClick={() => setActiveOrder(order)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{order.customer_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  ${order.total_amount} • {order.items.length} items
                                </p>
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

                {/* Single Order Display */}
                {shopperQueue.map((order) => (
                  <Card key={order.id} className={activeOrder?.id === order.id ? 'border-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {order.customer_name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${order.total_amount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {order.items.length} items
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(order.created_at).toLocaleTimeString()}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          {getStatusActions(order)}
                        </div>
                      </div>
                    </CardHeader>

                    {activeOrder?.id === order.id && (
                      <CardContent>
                        <div className="space-y-4">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-medium mb-3">Items to Collect</h4>
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="border rounded-lg p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-medium">{item.product?.name}</h5>
                                      <p className="text-sm text-muted-foreground">
                                        Needed: {item.quantity} {item.product?.unit} • ${item.unit_price} each
                                      </p>
                                      
                                      {item.shopping_status === 'found' && (
                                        <div className="flex items-center gap-1 mt-1 text-green-600">
                                          <CheckCircle2 className="h-4 w-4" />
                                          <span className="text-sm">Found: {item.found_quantity}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {item.shopping_status === 'pending' && (
                                        <>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                const newQty = Math.max(0, (itemQuantities[item.id] || 0) - 1);
                                                setItemQuantities(prev => ({ ...prev, [item.id]: newQty }));
                                              }}
                                            >
                                              <Minus className="h-3 w-3" />
                                            </Button>
                                            <Input
                                              type="number"
                                              value={itemQuantities[item.id] || 0}
                                              onChange={(e) => setItemQuantities(prev => ({ 
                                                ...prev, 
                                                [item.id]: parseInt(e.target.value) || 0 
                                              }))}
                                              className="w-16 text-center"
                                              min="0"
                                            />
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                const newQty = (itemQuantities[item.id] || 0) + 1;
                                                setItemQuantities(prev => ({ ...prev, [item.id]: newQty }));
                                              }}
                                            >
                                              <Plus className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <Button
                                            onClick={() => handleItemFound(item.id, itemQuantities[item.id] || 0, itemNotes[item.id])}
                                            disabled={!itemQuantities[item.id]}
                                            size="sm"
                                          >
                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                            Found
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowSubstitutionForm(prev => ({ 
                                              ...prev, 
                                              [item.id]: !prev[item.id] 
                                            }))}
                                          >
                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                            Substitute
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Substitution Form */}
                                  {showSubstitutionForm[item.id] && (
                                    <div className="mt-3 pt-3 border-t space-y-2">
                                      <Textarea
                                        placeholder="Why is substitution needed? Suggest alternative..."
                                        value={substitutionRequests[item.id] || ''}
                                        onChange={(e) => setSubstitutionRequests(prev => ({ 
                                          ...prev, 
                                          [item.id]: e.target.value 
                                        }))}
                                        rows={2}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            handleSubstitutionRequest(item.id, substitutionRequests[item.id]);
                                            setShowSubstitutionForm(prev => ({ ...prev, [item.id]: false }));
                                          }}
                                          disabled={!substitutionRequests[item.id]}
                                        >
                                          Request Substitution
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setShowSubstitutionForm(prev => ({ 
                                            ...prev, 
                                            [item.id]: false 
                                          }))}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  <div className="mt-3">
                                    <Input
                                      placeholder="Add notes about this item..."
                                      value={itemNotes[item.id] || ''}
                                      onChange={(e) => setItemNotes(prev => ({ 
                                        ...prev, 
                                        [item.id]: e.target.value 
                                      }))}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Available Orders Tab */}
          <TabsContent value="available" className="space-y-6">
            {availableOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Available Orders</h3>
                  <p className="text-muted-foreground text-center">
                    There are no new orders available for assignment right now.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availableOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{order.customer_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${order.total_amount} • {order.items.length} items
                          </p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
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
        </Tabs>
      </main>
    </div>
  );
}