import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, 
  Package, 
  CheckCircle2, 
  Clock, 
  Camera,
  MapPin,
  Users,
  FileText,
  AlertTriangle,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StockingOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  property_address: string;
  arrival_date: string;
  departure_date: string;
  guest_count: number;
  dietary_restrictions: any;
  special_instructions: string;
  total_amount: number;
  status: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
}

interface StockingTask {
  id: string;
  category: string;
  location: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    stocked: boolean;
  }>;
  completed: boolean;
}

const STOCKING_PROTOCOL = [
  {
    category: "Refrigerated Items",
    location: "Main Refrigerator",
    priority: 1,
    instructions: "Store at proper temperatures, organize by expiration date"
  },
  {
    category: "Frozen Items", 
    location: "Freezer",
    priority: 1,
    instructions: "Ensure proper freezer storage, separate meat and vegetables"
  },
  {
    category: "Fresh Produce",
    location: "Refrigerator Crisper",
    priority: 2,
    instructions: "Wash and store in appropriate humidity settings"
  },
  {
    category: "Pantry Items",
    location: "Kitchen Pantry",
    priority: 3,
    instructions: "Organize by type, check expiration dates"
  },
  {
    category: "Beverages",
    location: "Refrigerator/Pantry",
    priority: 4,
    instructions: "Chill beverages, store extras in pantry"
  },
  {
    category: "Snacks & Condiments",
    location: "Pantry/Refrigerator",
    priority: 5,
    instructions: "Organize for easy access"
  }
];

export function ConciergeDashboard() {
  const [orders, setOrders] = useState<StockingOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<StockingOrder | null>(null);
  const [stockingTasks, setStockingTasks] = useState<StockingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionNotes, setCompletionNotes] = useState("");
  const [qualityChecks, setQualityChecks] = useState<Record<string, boolean>>({});
  const [notificationMessage, setNotificationMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchStockingOrders();
  }, []);

  const fetchStockingOrders = async () => {
    try {
      // Get orders assigned to concierge
      const { data: assignments } = await supabase
        .from('stakeholder_assignments')
        .select('order_id')
        .eq('role', 'concierge')
        .eq('status', 'assigned');

      if (assignments && assignments.length > 0) {
        const orderIds = assignments.map(a => a.order_id);
        
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(
              *,
              products(name, unit, category_id)
            )
          `)
          .in('id', orderIds)
          .in('status', ['delivered', 'stocking']);

        if (error) throw error;
        
        const formattedOrders = ordersData?.map(order => ({
          ...order,
          items: order.order_items?.map(item => ({
            id: item.id,
            product_name: item.products?.name || 'Unknown Product',
            quantity: item.quantity,
            unit: item.products?.unit || 'unit',
            category: item.products?.category_id || 'other'
          })) || []
        })) || [];

        setOrders(formattedOrders);

        // Set first stocking order as active
        const stockingOrder = formattedOrders.find(o => o.status === 'stocking');
        if (stockingOrder) {
          setActiveOrder(stockingOrder);
          generateStockingTasks(stockingOrder);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stocking orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateStockingTasks = (order: StockingOrder) => {
    const tasksByCategory = order.items.reduce((acc, item) => {
      const category = getCategoryDisplayName(item.category);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        stocked: false
      });
      return acc;
    }, {} as Record<string, any[]>);

    const tasks = STOCKING_PROTOCOL.map(protocol => ({
      id: protocol.category,
      category: protocol.category,
      location: protocol.location,
      items: tasksByCategory[protocol.category] || [],
      completed: false
    })).filter(task => task.items.length > 0);

    setStockingTasks(tasks);
  };

  const getCategoryDisplayName = (categoryId: string): string => {
    const categoryMap: Record<string, string> = {
      'dairy-eggs': 'Refrigerated Items',
      'dairy': 'Refrigerated Items',
      'meat': 'Refrigerated Items', 
      'frozen': 'Frozen Items',
      'produce': 'Fresh Produce',
      'pantry': 'Pantry Items',
      'beverages': 'Beverages',
      'snacks': 'Snacks & Condiments'
    };
    return categoryMap[categoryId] || 'Pantry Items';
  };

  const startStocking = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'stocking' })
        .eq('id', orderId);

      if (error) throw error;

      // Log workflow
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: orderId,
          phase: 'stocking',
          action: 'stocking_started',
          notes: 'Concierge began kitchen stocking protocol'
        });

      toast({
        title: "Stocking Started",
        description: "Kitchen preparation protocol initiated",
      });

      fetchStockingOrders();
    } catch (error) {
      console.error('Error starting stocking:', error);
    }
  };

  const toggleItemStocked = (taskId: string, itemIndex: number) => {
    setStockingTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedItems = [...task.items];
        updatedItems[itemIndex].stocked = !updatedItems[itemIndex].stocked;
        const allStocked = updatedItems.every(item => item.stocked);
        return {
          ...task,
          items: updatedItems,
          completed: allStocked
        };
      }
      return task;
    }));
  };

  const completeStocking = async () => {
    if (!activeOrder) return;

    try {
      // Update order status to completed
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', activeOrder.id);

      if (error) throw error;

      // Send notifications to ALL stakeholders
      await sendCompletionNotifications(activeOrder);

      // Log completion in workflow
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: activeOrder.id,
          phase: 'completion',
          action: 'order_completed',
          actor_role: 'concierge',
          notes: `Rental unit stocked and organized. All stakeholders notified. ${completionNotes}`,
          metadata: {
            completion_notes: completionNotes,
            quality_checks: qualityChecks,
            completion_time: new Date().toISOString(),
            property_address: activeOrder.property_address,
            stakeholders_notified: ['customer', 'store_manager', 'driver', 'admin']
          }
        });

      toast({
        title: "Order Complete!",
        description: "Rental unit stocked successfully. All stakeholders have been notified.",
      });

      setActiveOrder(null);
      setStockingTasks([]);
      setCompletionNotes("");
      setQualityChecks({});
      setNotificationMessage("");
      
      fetchStockingOrders();
    } catch (error) {
      console.error('Error completing stocking:', error);
      toast({
        title: "Error",
        description: "Failed to complete stocking process",
        variant: "destructive",
      });
    }
  };

  const sendCompletionNotifications = async (order: StockingOrder) => {
    try {
      // Notification to customer
      await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          recipient_type: 'customer',
          recipient_identifier: order.customer_email,
          notification_type: 'stocking_complete',
          channel: 'email',
          message_content: notificationMessage || `Great news! Your groceries have been delivered and professionally organized at ${order.property_address}. Everything is stocked and ready for your arrival on ${new Date(order.arrival_date).toLocaleDateString()}. Welcome package has been prepared. Enjoy your stay!`,
          metadata: {
            property_address: order.property_address,
            arrival_date: order.arrival_date,
            guest_count: order.guest_count,
            completion_time: new Date().toISOString()
          }
        });

      // Notification to store manager
      await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          recipient_type: 'store_manager',
          recipient_identifier: 'store_manager',
          notification_type: 'stocking_complete',
          channel: 'system',
          message_content: `Order ${order.id.slice(-8)} has been successfully stocked and organized at rental property ${order.property_address}. Customer: ${order.customer_name}. Order total: $${order.total_amount}. All quality checks completed.`,
          metadata: {
            order_value: order.total_amount,
            completion_notes: completionNotes,
            quality_checks: qualityChecks
          }
        });

      // Notification to driver (delivery confirmation)
      await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          recipient_type: 'driver',
          recipient_identifier: 'driver',
          notification_type: 'delivery_confirmed',
          channel: 'system',
          message_content: `Delivery to ${order.property_address} has been confirmed complete by concierge. Order has been professionally stocked and organized. Final delivery status: COMPLETED.`,
          metadata: {
            final_confirmation: true,
            stocking_completed: true
          }
        });

      // Notification to admin/operations
      await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          recipient_type: 'admin',
          recipient_identifier: 'operations',
          notification_type: 'order_complete',
          channel: 'system',
          message_content: `Order workflow completed. Order ${order.id.slice(-8)} delivered, stocked, and guest-ready at ${order.property_address}. Revenue: $${order.total_amount}.`,
          metadata: {
            workflow_complete: true,
            revenue: order.total_amount,
            completion_time: new Date().toISOString()
          }
        });

      console.log('All stakeholder notifications sent successfully');
    } catch (error) {
      console.error('Error sending completion notifications:', error);
      // Still continue with order completion even if notifications fail
    }
  };

  const getOverallProgress = () => {
    if (stockingTasks.length === 0) return 0;
    const completedTasks = stockingTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / stockingTasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Concierge Dashboard</h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          {orders.length} Properties
        </Badge>
      </div>

      {/* Order Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stocking Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  activeOrder?.id === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setActiveOrder(order);
                  generateStockingTasks(order);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {order.property_address}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {order.guest_count} guests
                      </span>
                      <span>Arrival: {new Date(order.arrival_date).toLocaleDateString()}</span>
                      <span>${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={order.status === 'stocking' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                    {order.status === 'delivered' && (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          startStocking(order.id);
                        }}
                      >
                        Start Stocking
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Stocking */}
      {activeOrder && stockingTasks.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Kitchen Stocking Protocol</span>
                  <Progress value={getOverallProgress()} className="w-32" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {stockingTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                            {task.category}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Store in: {task.location}
                          </div>
                        </div>
                        <Badge variant={task.completed ? "default" : "secondary"}>
                          {task.items.filter(i => i.stocked).length}/{task.items.length}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {task.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={item.stocked}
                                onCheckedChange={() => toggleItemStocked(task.id, index)}
                              />
                              <div>
                                <div className={`font-medium ${item.stocked ? 'line-through text-muted-foreground' : ''}`}>
                                  {item.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {item.quantity} {item.unit}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {getOverallProgress() === 100 && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800 mb-2">
                      All items stocked! Ready for final quality check.
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Quality Checklist:</div>
                      {[
                        'All refrigerated items at proper temperature',
                        'Frozen items properly stored',
                        'Fresh produce washed and organized',
                        'Expiration dates checked and organized',
                        'Kitchen clean and guest-ready'
                      ].map((check, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={qualityChecks[check] || false}
                            onCheckedChange={(checked) => 
                              setQualityChecks(prev => ({ ...prev, [check]: checked as boolean }))
                            }
                          />
                          <div className="text-sm">{check}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Guest Details</div>
                  <div className="text-muted-foreground">{activeOrder.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{activeOrder.guest_count} guests</div>
                </div>

                <div>
                  <div className="text-sm font-medium">Stay Dates</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(activeOrder.arrival_date).toLocaleDateString()} - {new Date(activeOrder.departure_date).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Property Address</div>
                  <div className="text-sm text-muted-foreground">{activeOrder.property_address}</div>
                </div>

                {activeOrder.dietary_restrictions && Object.keys(activeOrder.dietary_restrictions).length > 0 && (
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Dietary Restrictions
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(activeOrder.dietary_restrictions)}
                    </div>
                  </div>
                )}

                {activeOrder.special_instructions && (
                  <div>
                    <div className="text-sm font-medium">Special Instructions</div>
                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                      {activeOrder.special_instructions}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium mb-2">Completion Notes</div>
                  <Textarea
                    placeholder="Add notes about the stocking process, any issues, or special touches..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Customer Notification Message</div>
                  <Textarea
                    placeholder="Customize the completion message sent to the customer (optional - default message will be used if empty)..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                  />
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Completion Photo
                </Button>

                {getOverallProgress() === 100 && Object.keys(qualityChecks).length >= 5 && (
                  <Button 
                    onClick={completeStocking}
                    className="w-full"
                    size="lg"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Complete & Notify All Stakeholders
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}