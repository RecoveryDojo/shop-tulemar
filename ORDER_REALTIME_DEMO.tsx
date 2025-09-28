import React, { useState } from 'react';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Demo component showing order realtime hook usage
export function OrderRealtimeDemo() {
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderEvents, setOrderEvents] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const {
    isConnected,
    subscribedOrderId,
    fetchSnapshot
  } = useOrderRealtime({
    orderId,
    onOrderChange: (payload) => {
      addLog(`🔄 Order ${payload.eventType}: ${payload.new?.status || 'unknown'}`);
      setOrderData(payload.new);
    },
    onItemChange: (payload) => {
      addLog(`📦 Item ${payload.eventType}: quantity ${payload.new?.quantity || payload.old?.quantity}`);
      
      if (payload.eventType === 'INSERT') {
        setOrderItems(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setOrderItems(prev => prev.map(item => 
          item.id === payload.new.id ? payload.new : item
        ));
      } else if (payload.eventType === 'DELETE') {
        setOrderItems(prev => prev.filter(item => item.id !== payload.old.id));
      }
    },
    onEventReceived: (payload) => {
      addLog(`📋 Event: ${payload.new?.event_type || 'unknown'}`);
      setOrderEvents(prev => [...prev, payload.new].slice(-10)); // Keep last 10 events
    },
    onSnapshotReconciled: (snapshot) => {
      addLog(`🔄 Snapshot reconciled: ${snapshot.items.length} items, ${snapshot.events.length} events`);
      setSnapshots(prev => [...prev, {
        timestamp: new Date().toISOString(),
        itemCount: snapshot.items.length,
        eventCount: snapshot.events.length,
        orderStatus: snapshot.order?.status
      }].slice(-5)); // Keep last 5 snapshots
      
      // Update local state with reconciled data
      if (snapshot.order) setOrderData(snapshot.order);
      setOrderItems(snapshot.items);
      setOrderEvents(snapshot.events.slice(-10));
    },
    onReconnect: () => {
      addLog('🔗 Reconnected to realtime channels');
    },
    onError: (error) => {
      addLog(`❌ Error: ${error.message}`);
    }
  });

  const handleFetchSnapshot = async () => {
    if (!orderId) return;
    
    const snapshot = await fetchSnapshot();
    if (snapshot) {
      addLog(`📸 Manual snapshot: ${snapshot.items.length} items`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Realtime Hook Demo</CardTitle>
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
            <Button onClick={handleFetchSnapshot} disabled={!orderId}>
              Fetch Snapshot
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {subscribedOrderId && (
              <Badge variant="outline">
                Subscribed: {subscribedOrderId.slice(0, 8)}...
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Data</CardTitle>
          </CardHeader>
          <CardContent>
            {orderData ? (
              <div className="space-y-2">
                <div><strong>Status:</strong> {orderData.status}</div>
                <div><strong>Customer:</strong> {orderData.customer_name}</div>
                <div><strong>Total:</strong> ${orderData.total_amount}</div>
                <div><strong>Updated:</strong> {new Date(orderData.updated_at).toLocaleString()}</div>
              </div>
            ) : (
              <p className="text-muted-foreground">No order data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items ({orderItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {orderItems.length > 0 ? (
                orderItems.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between text-sm">
                    <span>Qty: {item.quantity}</span>
                    <span>${item.total_price}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No items yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {orderEvents.length > 0 ? (
                orderEvents.slice(-5).map((event, index) => (
                  <div key={event.id || index} className="text-sm">
                    <Badge variant="outline" className="mr-2">
                      {event.event_type}
                    </Badge>
                    {new Date(event.created_at).toLocaleTimeString()}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No events yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Snapshots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Snapshots ({snapshots.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {snapshots.map((snapshot, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium">{new Date(snapshot.timestamp).toLocaleTimeString()}</div>
                  <div className="text-muted-foreground">
                    Items: {snapshot.itemCount}, Events: {snapshot.eventCount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No activity yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Usage in your component:
/*
function MyOrderComponent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  
  const { isConnected } = useOrderRealtime({
    orderId,
    onOrderChange: (payload) => {
      if (payload.eventType === 'UPDATE') {
        setOrder(payload.new);
      }
    },
    onItemChange: (payload) => {
      if (payload.eventType === 'INSERT') {
        setItems(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setItems(prev => prev.map(item => 
          item.id === payload.new.id ? payload.new : item
        ));
      } else if (payload.eventType === 'DELETE') {
        setItems(prev => prev.filter(item => item.id !== payload.old.id));
      }
    },
    onEventReceived: (payload) => {
      console.log('New order event:', payload.new);
    },
    onSnapshotReconciled: (snapshot) => {
      // Fresh data after reconnection
      setOrder(snapshot.order);
      setItems(snapshot.items);
    }
  });
  
  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Order: {order?.status}</div>
      <div>Items: {items.length}</div>
    </div>
  );
}
*/