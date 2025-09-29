import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

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
  const [seeding, setSeeding] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [showRawResults, setShowRawResults] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<string>('');
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isDebugMode = searchParams.get('debug') === '1';

  const runSmokeTests = async () => {
    setLoading(true);
    setLastRunTime(new Date().toLocaleTimeString());
    const testResults: SmokeTestResult[] = [];

    try {
      // Test 1: Fetch most recent order for demo_client@tulemar.test
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, status, created_at, customer_name, total_amount')
        .eq('customer_email', 'demo_client@tulemar.test')
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
          message: 'No demo order found for demo_client@tulemar.test'
        });
      } else {
        const statusOk = orderData.status === 'CLAIMED';
        testResults.push({
          name: 'Recent Order Query',
          passed: statusOk,
          message: statusOk 
            ? `Found order ${orderData.id.slice(0, 8)} (${orderData.status})` 
            : `Found order but status is ${orderData.status} (expected CLAIMED)`,
          data: orderData
        });
        setOrder(orderData);

        // Test 2: Fetch items for this order from view (backed by new_order_items)
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
        } else {
          const coffeeItems = itemsData?.filter(item => item.name?.includes('Coffee')) || [];
          const milkItems = itemsData?.filter(item => item.name?.includes('Milk')) || [];
          const bananaItems = itemsData?.filter(item => item.name?.includes('Banana')) || [];
          const passed = coffeeItems.length > 0 && milkItems.length > 0 && bananaItems.length > 0;
          testResults.push({
            name: 'Order Items Query',
            passed,
            message: passed ? `Found Coffee, Milk, Bananas (${itemsData.length} total)` : `Missing items: ${[
              coffeeItems.length === 0 ? 'Coffee' : '',
              milkItems.length === 0 ? 'Milk' : '',
              bananaItems.length === 0 ? 'Bananas' : ''
            ].filter(Boolean).join(', ')}`,
            data: itemsData
          });
          setItems(itemsData || []);
        }

        // Test 3: Fetch recent events for this order from view (backed by new_order_events)
        const { data: eventsData, error: eventsError } = await supabase
          .from('order_events')
          .select('id, event_type, actor_role, data, created_at')
          .eq('order_id', orderData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (eventsError) {
          testResults.push({
            name: 'Order Events Query',
            passed: false,
            message: `Error: ${eventsError.message}`
          });
        } else {
          const statusChangedEvents = eventsData?.filter(e => e.event_type === 'STATUS_CHANGED') || [];
          const passed = statusChangedEvents.length > 0;
          testResults.push({
            name: 'Order Events Query',
            passed,
            message: passed ? `Found ${eventsData?.length || 0} events (${statusChangedEvents.length} STATUS_CHANGED)` : `Found ${eventsData?.length || 0} events (no STATUS_CHANGED)`,
            data: eventsData
          });
          setEvents(eventsData || []);
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

  const seedDemoData = async () => {
    setSeeding(true);
    try {
      // Insert demo order via views to exercise write-through rules
      const demoOrderData = {
        customer_email: 'demo_client@tulemar.test',
        customer_name: 'Demo Client',
        customer_phone: '+1-555-DEMO',
        property_address: '123 Demo Street, Demo City',
        status: 'PLACED',
        subtotal: 25.50,
        tax_amount: 2.04,
        delivery_fee: 5.00,
        total_amount: 32.54,
        special_instructions: 'Demo order for smoke testing'
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(demoOrderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert demo items via views 
      const demoItems = [
        { order_id: newOrder.id, sku: 'COFFEE-001', name: 'Premium Coffee', qty: 2, notes: 'Ground beans' },
        { order_id: newOrder.id, sku: 'MILK-001', name: 'Organic Milk', qty: 1, notes: '1 gallon' },
        { order_id: newOrder.id, sku: 'BANANA-001', name: 'Fresh Bananas', qty: 1, notes: '1 bunch' }
      ];

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(demoItems);

      if (itemsError) throw itemsError;

      // Insert demo events via views
      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: newOrder.id,
          event_type: 'STATUS_CHANGED',
          actor_role: 'system',
          data: { from: null, to: 'PLACED', timestamp: new Date().toISOString() }
        });

      if (eventError) throw eventError;

      toast({
        title: "Demo data seeded",
        description: `Created order ${newOrder.id.slice(0, 8)} with 3 items`
      });

      // Re-run tests to show the new data
      await runSmokeTests();
    } catch (error) {
      toast({
        title: "Failed to seed demo data",
        description: `Error: ${error}`,
        variant: "destructive"
      });
    }
    setSeeding(false);
  };

  const addTestEvent = async () => {
    if (!order) {
      toast({
        title: "No order found",
        description: "Please seed demo data first",
        variant: "destructive"
      });
      return;
    }

    setAddingEvent(true);
    try {
      const { data, error } = await supabase.rpc('rpc_add_test_event', {
        p_order_id: order.id
      });

      if (error) throw error;

      toast({
        title: "Test event added",
        description: "Event added successfully"
      });

      // Auto-refresh to show the new event
      await runSmokeTests();
    } catch (error: any) {
      toast({
        title: "Failed to add test event",
        description: error.message || String(error),
        variant: "destructive"
      });
    }
    setAddingEvent(false);
  };

  // Set up realtime subscription for order events
  useEffect(() => {
    runSmokeTests();

    if (!order) return;

    const channel = supabase
      .channel('order-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'new_order_events',
          filter: `order_id=eq.${order.id}`
        },
        (payload) => {
          console.log('New event received:', payload);
          // Refresh the events list
          runSmokeTests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

  const allTestsPassed = results.length > 0 && results.every(r => r.passed);
  const anyTestsFailed = results.some(r => !r.passed);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Smoke Test</h1>
          {lastRunTime && (
            <p className="text-sm text-muted-foreground mt-1">Last run: {lastRunTime}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runSmokeTests} 
            disabled={loading || seeding || addingEvent}
            variant="outline"
            title="Checks database state"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running...' : 'Refresh Results → Checks DB State'}
          </Button>
          <Button 
            onClick={seedDemoData} 
            disabled={seeding || loading || addingEvent}
            variant="secondary"
          >
            <Plus className={`w-4 h-4 mr-2 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
          <Button 
            onClick={addTestEvent} 
            disabled={addingEvent || loading || seeding || !order}
            variant="default"
            title="Checks realtime wiring"
          >
            <Plus className={`w-4 h-4 mr-2 ${addingEvent ? 'animate-spin' : ''}`} />
            {addingEvent ? 'Adding...' : 'Add Test Event → Checks Realtime'}
          </Button>
          {isDebugMode && (
            <Button 
              onClick={() => setShowRawResults(!showRawResults)}
              variant="ghost"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showRawResults ? 'Hide' : 'Show'} Raw Results
            </Button>
          )}
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

      {/* Debug Raw Results */}
      {isDebugMode && showRawResults && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Results (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm font-mono">
              <div>
                <div className="font-semibold">Order ID:</div>
                <div>{order?.id || 'None'}</div>
              </div>
              <div>
                <div className="font-semibold">Order Status:</div>
                <div>{order?.status || 'None'}</div>
              </div>
              <div>
                <div className="font-semibold">Item Count:</div>
                <div>{items.length}</div>
              </div>
              <div>
                <div className="font-semibold">Event Count:</div>
                <div>{events.length}</div>
              </div>
              <div>
                <div className="font-semibold">STATUS_CHANGED Events:</div>
                <div>{events.filter(e => e.event_type === 'STATUS_CHANGED').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Button Labels */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span><strong>Refresh Results</strong> → checks database state</span>
            </div>
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-500" />
              <span><strong>Add Test Event</strong> → checks realtime wiring</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expected Green Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Results When Working</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Recent Order Query: Should find demo order for demo_client@tulemar.test</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Order Items Query: Should find Coffee, Milk, and Bananas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Order Events Query: Should find at least one STATUS_CHANGED event</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}