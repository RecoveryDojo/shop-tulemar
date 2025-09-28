import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  status: string;
  created_at: string;
  customer_name: string;
  total_amount: number;
}

interface OrderItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  qty_picked: number;
  notes: string;
}

interface OrderEvent {
  id: string;
  event_type: string;
  actor_role: string;
  data: any;
  created_at: string;
}

interface SmokeTestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

export default function DbSmoke() {
  const [results, setResults] = useState<SmokeTestResult[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const { toast } = useToast();

  const runSmokeTests = async () => {
    setLoading(true);
    const testResults: SmokeTestResult[] = [];

    try {
      // Test 1: Fetch most recent order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, status, created_at, customer_name, total_amount')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) {
        testResults.push({
          name: 'Recent Order Query',
          passed: false,
          message: `Error: ${orderError.message}`
        });
      } else if (!orderData) {
        testResults.push({
          name: 'Recent Order Query',
          passed: false,
          message: 'No orders found in database'
        });
      } else {
        testResults.push({
          name: 'Recent Order Query',
          passed: true,
          message: `Found order ${orderData.id.slice(0, 8)} (${orderData.status})`,
          data: orderData
        });
        setOrder(orderData);

        // Test 2: Fetch items for this order
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, sku, name, qty, qty_picked, notes')
          .eq('order_id', orderData.id);

        if (itemsError) {
          testResults.push({
            name: 'Order Items Query',
            passed: false,
            message: `Error: ${itemsError.message}`
          });
        } else if (!itemsData || itemsData.length === 0) {
          testResults.push({
            name: 'Order Items Query',
            passed: false,
            message: 'No items found for this order'
          });
        } else {
          testResults.push({
            name: 'Order Items Query',
            passed: true,
            message: `Found ${itemsData.length} items`,
            data: itemsData
          });
          setItems(itemsData);
        }

        // Test 3: Fetch recent events for this order
        const { data: eventsData, error: eventsError } = await supabase
          .from('order_events')
          .select('id, event_type, actor_role, data, created_at')
          .eq('order_id', orderData.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (eventsError) {
          testResults.push({
            name: 'Order Events Query',
            passed: false,
            message: `Error: ${eventsError.message}`
          });
        } else if (!eventsData || eventsData.length === 0) {
          testResults.push({
            name: 'Order Events Query',
            passed: false,
            message: 'No events found for this order'
          });
        } else {
          testResults.push({
            name: 'Order Events Query',
            passed: true,
            message: `Found ${eventsData.length} events`,
            data: eventsData
          });
          setEvents(eventsData);
        }
      }
    } catch (error) {
      testResults.push({
        name: 'General Error',
        passed: false,
        message: `Unexpected error: ${error}`
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  const addTestEvent = async () => {
    if (!order || items.length === 0) {
      toast({
        title: "Cannot add event",
        description: "No order or items found",
        variant: "destructive"
      });
      return;
    }

    setAddingEvent(true);
    try {
      // Update the first item's qty_picked to trigger an ITEM_UPDATED event
      const firstItem = items[0];
      const newQtyPicked = (firstItem.qty_picked || 0) + 1;

      const { error: updateError } = await supabase
        .from('order_items')
        .update({ qty_picked: newQtyPicked })
        .eq('id', firstItem.id);

      if (updateError) {
        throw updateError;
      }

      // Insert an explicit event via the view to test write-through rules
      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: order.id,
          event_type: 'ITEM_UPDATED',
          actor_role: 'smoke_test',
          data: {
            item_id: firstItem.id,
            sku: firstItem.sku,
            name: firstItem.name,
            qty_picked_from: firstItem.qty_picked || 0,
            qty_picked_to: newQtyPicked,
            timestamp: new Date().toISOString(),
            test: true
          }
        });

      if (eventError) {
        throw eventError;
      }

      toast({
        title: "Test event added",
        description: `Updated ${firstItem.name} qty_picked to ${newQtyPicked}`
      });

      // Re-run tests to show the new event
      await runSmokeTests();
    } catch (error) {
      toast({
        title: "Failed to add event",
        description: `Error: ${error}`,
        variant: "destructive"
      });
    }
    setAddingEvent(false);
  };

  useEffect(() => {
    runSmokeTests();
  }, []);

  const allTestsPassed = results.length > 0 && results.every(r => r.passed);
  const anyTestsFailed = results.some(r => !r.passed);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Database Smoke Test</h1>
        <div className="flex gap-2">
          <Button 
            onClick={runSmokeTests} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Tests
          </Button>
          <Button 
            onClick={addTestEvent} 
            disabled={addingEvent || !order}
            variant="secondary"
          >
            <Plus className={`w-4 h-4 mr-2 ${addingEvent ? 'animate-spin' : ''}`} />
            Add Test Event
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allTestsPassed && (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-green-600">All Tests Passed</span>
              </>
            )}
            {anyTestsFailed && (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                <span className="text-red-600">Some Tests Failed</span>
              </>
            )}
            {results.length === 0 && (
              <span className="text-gray-500">No tests run yet</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded border">
                {result.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <div>
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-gray-600">{result.message}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      {order && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-500">Order ID</div>
                <div className="font-mono">{order.id.slice(0, 8)}...</div>
              </div>
              <div>
                <div className="font-medium text-gray-500">Status</div>
                <div className="uppercase font-medium">{order.status}</div>
              </div>
              <div>
                <div className="font-medium text-gray-500">Customer</div>
                <div>{order.customer_name}</div>
              </div>
              <div>
                <div className="font-medium text-gray-500">Total</div>
                <div>${Number(order.total_amount).toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                    {item.notes && (
                      <div className="text-sm text-gray-600">{item.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">Qty: {item.qty}</div>
                    <div className="text-sm text-gray-500">Picked: {item.qty_picked || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Events ({events.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-blue-600">{event.event_type}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Actor: {event.actor_role}
                  </div>
                  {event.data && (
                    <div className="text-sm">
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expected Green Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Results When Working</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Recent Order Query: Should find demo order with status 'confirmed'</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Order Items Query: Should find 3 items (Coffee, Milk, Bananas)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Order Events Query: Should find STATUS_CHANGED events</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}