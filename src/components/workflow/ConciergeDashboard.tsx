import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserProfileMenu } from "@/components/ui/UserProfileMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
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
  Star,
  ShoppingCart,
  Info,
  ChefHat
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCommunicationWidget } from './FloatingCommunicationWidget';
import { useConciergeDashboard } from '@/hooks/useConciergeDashboard';

import { ConciergeOrder } from '@/hooks/useConciergeDashboard';

interface StockingOrder extends ConciergeOrder {
  arrival_date?: string;
  departure_date?: string;
  guest_count?: number;
  dietary_restrictions?: any;
  special_instructions?: string;
  items?: Array<{
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
  const { 
    conciergeQueue, 
    loading, 
    error,
    arrivedProperty,
    startStocking,
    completeStocking,
    refetchOrders 
  } = useConciergeDashboard();
  
  const [activeOrder, setActiveOrder] = useState<ConciergeOrder | null>(null);
  const [stockingTasks, setStockingTasks] = useState<StockingTask[]>([]);
  const [completionNotes, setCompletionNotes] = useState("");
  const [qualityChecks, setQualityChecks] = useState<Record<string, boolean>>({});
  const [notificationMessage, setNotificationMessage] = useState("");
  const { toast } = useToast();

  // Mock stakeholders for communication
  const mockStakeholders = [
    { id: 'store-mgr-1', name: 'Store Manager', role: 'store_manager', status: 'online' as const },
    { id: 'driver-1', name: 'Delivery Driver', role: 'driver', status: 'offline' as const },
    { id: 'shopper-1', name: 'Shopper', role: 'shopper', status: 'offline' as const },
    { id: 'customer-1', name: activeOrder?.customer_name || 'Customer', role: 'customer', status: 'away' as const }
  ];

  useEffect(() => {
    if (conciergeQueue.length > 0 && !activeOrder) {
      setActiveOrder(conciergeQueue[0]);
    }
  }, [conciergeQueue, activeOrder]);

  const generateStockingTasks = (order: ConciergeOrder) => {
    // For now, create default stocking tasks since we don't have order items
    const defaultTasks = STOCKING_PROTOCOL.map(protocol => ({
      id: protocol.category,
      category: protocol.category,
      location: protocol.location,
      items: [
        { name: `${protocol.category} items`, quantity: 1, unit: 'batch', stocked: false }
      ],
      completed: false
    }));

    setStockingTasks(defaultTasks);
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

  const handleCompleteStocking = async () => {
    if (!activeOrder) return;
    await completeStocking(activeOrder.id);
    setActiveOrder(null);
    setStockingTasks([]);
    setCompletionNotes("");
    setQualityChecks({});
    setNotificationMessage("");
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
            guest_count: order.guest_count
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
            revenue: order.total_amount
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-blue-500/5">
      {/* Branded Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white">
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
                  userRole="concierge" 
                  onViewAll={() => {}}
                />
                <UserProfileMenu />
                <Button
                  variant="outline"
                  size="sm"
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
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Concierge Dashboard</h1>
                  <p className="text-white/80 text-lg">Manage property stocking and guest services</p>
                </div>
              </div>
            </div>

            {/* Properties Badge */}
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white">
                <Home className="h-5 w-5" />
                <span className="font-bold text-lg">{conciergeQueue.length}</span>
                <span className="text-sm text-white/80">Properties</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="h-4 bg-gradient-to-b from-transparent to-background/20"></div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

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
            {conciergeQueue.map((order) => (
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
                    onClick={() => handleCompleteStocking()}
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

      {/* Floating Communication Widget */}
      <FloatingCommunicationWidget
        orderId={activeOrder?.id}
        orderPhase="stocking"
        stakeholders={mockStakeholders}
        unreadCount={0}
      />
      </div>
    </div>
  );
}