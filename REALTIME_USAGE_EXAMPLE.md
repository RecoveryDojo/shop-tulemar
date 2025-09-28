# Hardened Realtime Connection Manager - Usage Examples

## Basic Order Channel Usage

```typescript
import { 
  realtimeManager, 
  createOrderChannelName,
  useRealtimeConnection 
} from '@/utils/realtimeConnectionManager';

// 1. Enforce per-order channel naming
const orderId = "123e4567-e89b-12d3-a456-426614174000";

const orderChannelName = createOrderChannelName(orderId, 'orders');
const itemsChannelName = createOrderChannelName(orderId, 'items'); 
const eventsChannelName = createOrderChannelName(orderId, 'events');

// Result: "order-123e4567-e89b-12d3-a456-426614174000-orders"
//         "order-123e4567-e89b-12d3-a456-426614174000-items"
//         "order-123e4567-e89b-12d3-a456-426614174000-events"

// 2. Idempotent subscriptions
const config = {
  channelName: orderChannelName,
  table: 'orders',
  event: 'UPDATE' as const,
  filter: `id=eq.${orderId}`,
  onMessage: (payload) => console.log('Order updated:', payload),
  onError: (error) => console.error('Connection error:', error),
  onReconnect: () => console.log('Reconnected successfully!')
};

// Multiple calls with same config won't create duplicate subscriptions
await realtimeManager.subscribe(config);
await realtimeManager.subscribe(config); // No-op, returns existing channel

// 3. Manual unsubscribe
await realtimeManager.unsubscribe(orderChannelName);

// 4. Check channel status
const status = realtimeManager.getChannelStatus(orderChannelName);
// Returns: 'subscribed' | 'pending' | 'disconnected'

// 5. Debug active channels (only with ?debug=1 in URL)
// Navigate to: http://localhost:3000?debug=1
const activeChannels = realtimeManager.getActiveChannels();
console.log('Active channels:', activeChannels);
```

## React Hook Usage

```typescript
function OrderTracker({ orderId }: { orderId: string }) {
  const { status, connect, disconnect, checkStatus } = useRealtimeConnection({
    channelName: createOrderChannelName(orderId, 'orders'),
    table: 'orders',
    event: 'UPDATE',
    filter: `id=eq.${orderId}`,
    onMessage: (payload) => {
      console.log('Order status changed:', payload.new.status);
    },
    onReconnect: () => {
      console.log('Reconnected to order updates');
    },
    onError: (error) => {
      console.error('Order tracking error:', error);
    }
  });

  return (
    <div>
      <p>Connection status: {status}</p>
      <button onClick={checkStatus}>Check Status</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={connect}>Reconnect</button>
    </div>
  );
}
```

## Multi-Channel Order Tracking

```typescript
function CompleteOrderTracker({ orderId }: { orderId: string }) {
  // Track orders, items, and events for the same order
  const orderConnection = useRealtimeConnection({
    channelName: createOrderChannelName(orderId, 'orders'),
    table: 'orders',
    event: 'UPDATE',
    filter: `id=eq.${orderId}`,
    onMessage: (payload) => updateOrderState(payload.new)
  });

  const itemsConnection = useRealtimeConnection({
    channelName: createOrderChannelName(orderId, 'items'),
    table: 'order_items',
    event: '*',
    filter: `order_id=eq.${orderId}`,
    onMessage: (payload) => updateOrderItems(payload)
  });

  const eventsConnection = useRealtimeConnection({
    channelName: createOrderChannelName(orderId, 'events'),
    table: 'order_events',
    event: 'INSERT',
    filter: `order_id=eq.${orderId}`,
    onMessage: (payload) => addOrderEvent(payload.new)
  });

  return (
    <div>
      <div>Order Status: {orderConnection.status}</div>
      <div>Items Status: {itemsConnection.status}</div>
      <div>Events Status: {eventsConnection.status}</div>
    </div>
  );
}
```

## Key Features Implemented

✅ **Per-order channel enforcement**: Use `createOrderChannelName()` helper  
✅ **Idempotent subscriptions**: Same config won't create duplicates  
✅ **Full unsubscribe**: Cleanly detaches handlers and closes channels  
✅ **Exponential backoff**: 1s → 2s → 4s → 8s → 16s → 30s (capped)  
✅ **Proper reconnection**: Calls `onReconnect()` after successful resubscription  
✅ **Status tracking**: Returns 'subscribed' | 'pending' | 'disconnected'  
✅ **Debug helper**: View active channels with `?debug=1` URL parameter  

## Error Recovery & Reconnection

The manager automatically handles:
- Network disconnections with exponential backoff
- Browser tab visibility changes  
- WebSocket timeouts and errors
- Maximum retry attempts (5 by default)
- Graceful cleanup on component unmount