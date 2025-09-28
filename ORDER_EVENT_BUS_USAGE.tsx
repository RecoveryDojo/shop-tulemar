import React, { useState, useEffect, useCallback } from 'react';
import { orderEventBus, reconcileFromEvent, OrderEvent, OrderSnapshot } from '@/lib/orderEventBus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Example component showing OrderEventBus usage
export function OrderEventBusDemo() {
  const [orderId, setOrderId] = useState('');
  const [orderState, setOrderState] = useState<OrderSnapshot | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  // Event handler for the order
  const handleOrderEvent = useCallback((event: OrderEvent) => {
    console.log('[Demo] Received event:', event);
    
    // Add to events log
    setEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    
    // Reconcile state from event
    if (orderState) {
      const newState = reconcileFromEvent(event, orderState);
      if (newState !== orderState) {
        setOrderState(newState);
      }
    }
  }, [orderState]);

  // Subscribe to order when orderId changes
  useEffect(() => {
    if (!orderId) return;

    console.log('[Demo] Subscribing to order:', orderId);
    orderEventBus.subscribe(orderId, handleOrderEvent);
    setSubscriptionCount(orderEventBus.getSubscriptionCount(orderId));

    return () => {
      console.log('[Demo] Unsubscribing from order:', orderId);
      orderEventBus.unsubscribe(orderId, handleOrderEvent);
    };
  }, [orderId, handleOrderEvent]);

  // Load initial snapshot
  const loadSnapshot = async () => {
    if (!orderId) return;
    
    console.log('[Demo] Loading snapshot for order:', orderId);
    const snapshot = await orderEventBus.fetchSnapshot(orderId);
    if (snapshot) {
      setOrderState(snapshot);
    }
  };

  // Simulate order events
  const simulateItemFound = () => {
    if (!orderId) return;
    
    orderEventBus.publish({
      order_id: orderId,
      event_type: 'ITEM_FOUND',
      actor_role: 'shopper',
      data: {
        item_id: 'item-123',
        found_quantity: 2,
        shopper_notes: 'Found in dairy section'
      }
    });
  };

  const simulateStatusChange = () => {
    if (!orderId) return;
    
    orderEventBus.publish({
      order_id: orderId,
      event_type: 'STATUS_CHANGED',
      actor_role: 'shopper',
      data: {
        old_status: 'assigned',
        new_status: 'shopping',
        notes: 'Shopper started shopping'
      }
    });
  };

  const simulateItemSubstitution = () => {
    if (!orderId) return;
    
    orderEventBus.publish({
      order_id: orderId,
      event_type: 'ITEM_SUBSTITUTED',
      actor_role: 'shopper',
      data: {
        item_id: 'item-456',
        substitution_data: {
          original_product: 'Brand A Milk',
          substitute_product: 'Brand B Milk',
          reason: 'Out of stock',
          price_difference: -0.50
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OrderEventBus Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Order ID</label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order UUID"
              />
            </div>
            <Button onClick={loadSnapshot} disabled={!orderId}>
              Load Snapshot
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="outline">
              Subscriptions: {subscriptionCount}
            </Badge>
            <Badge variant="outline">
              Active Orders: {orderEventBus.getSubscribedOrders().length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Order State</CardTitle>
          </CardHeader>
          <CardContent>
            {orderState ? (
              <div className="space-y-3">
                <div>
                  <strong>Status:</strong> {orderState.order?.status || 'Unknown'}
                </div>
                <div>
                  <strong>Customer:</strong> {orderState.order?.customer_name || 'Unknown'}
                </div>
                <div>
                  <strong>Items:</strong> {orderState.items.length}
                </div>
                <div>
                  <strong>Events:</strong> {orderState.events.length}
                </div>
                {orderState.order?.updated_at && (
                  <div>
                    <strong>Updated:</strong> {new Date(orderState.order.updated_at).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No order state loaded</p>
            )}
          </CardContent>
        </Card>

        {/* Event Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Simulate Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={simulateItemFound} 
              disabled={!orderId}
              className="w-full"
            >
              📦 Item Found
            </Button>
            <Button 
              onClick={simulateStatusChange} 
              disabled={!orderId}
              variant="outline"
              className="w-full"
            >
              🔄 Status Changed
            </Button>
            <Button 
              onClick={simulateItemSubstitution} 
              disabled={!orderId}
              variant="outline"
              className="w-full"
            >
              🔄 Item Substitution
            </Button>
            <p className="text-sm text-muted-foreground">
              These are optimistic events - real persistence happens separately via RPC/DB insert
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.length > 0 ? (
              events.map((event, index) => (
                <div key={index} className="border rounded p-3 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {event.event_type}
                    </Badge>
                    {event.actor_role && (
                      <Badge variant="outline">
                        {event.actor_role}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'No timestamp'}
                    </span>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No events yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Basic usage example:
/*
function OrderDashboard({ orderId }: { orderId: string }) {
  const [orderData, setOrderData] = useState(null);
  
  useEffect(() => {
    const handleEvent = (event: OrderEvent) => {
      // Apply optimistic updates
      setOrderData(current => reconcileFromEvent(event, current));
    };
    
    // Subscribe to order events
    orderEventBus.subscribe(orderId, handleEvent);
    
    // Load initial data
    orderEventBus.fetchSnapshot(orderId).then(snapshot => {
      if (snapshot) setOrderData(snapshot);
    });
    
    return () => {
      orderEventBus.unsubscribe(orderId, handleEvent);
    };
  }, [orderId]);
  
  return (
    <div>
      <h1>Order {orderId}</h1>
      <p>Status: {orderData?.order?.status}</p>
      <p>Items: {orderData?.items?.length || 0}</p>
    </div>
  );
}
*/