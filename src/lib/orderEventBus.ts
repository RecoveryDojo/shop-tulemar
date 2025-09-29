import { supabase } from '@/integrations/supabase/client';

export interface OrderEvent {
  order_id: string;
  event_type: string;
  actor_role?: string;
  data: any;
  timestamp?: string;
}

export interface OrderSnapshot {
  order: any;
  items: any[];
  events: any[];
}

export type OrderEventHandler = (event: OrderEvent) => void;

class OrderEventBus {
  private subscriptions = new Map<string, Set<OrderEventHandler>>();

  /**
   * Subscribe to events for a specific order
   * No duplicate handlers - uses Set to ensure uniqueness
   */
  subscribe(orderId: string, handler: OrderEventHandler): void {
    console.log(`[OrderEventBus] Subscribing to order ${orderId}`);
    
    if (!this.subscriptions.has(orderId)) {
      this.subscriptions.set(orderId, new Set());
    }
    
    const handlers = this.subscriptions.get(orderId)!;
    const sizeBefore = handlers.size;
    handlers.add(handler);
    
    if (handlers.size === sizeBefore) {
      console.log(`[OrderEventBus] Handler already subscribed to order ${orderId}`);
    } else {
      console.log(`[OrderEventBus] Added handler to order ${orderId} (total: ${handlers.size})`);
    }
  }

  /**
   * Unsubscribe from events for a specific order
   */
  unsubscribe(orderId: string, handler: OrderEventHandler): void {
    console.log(`[OrderEventBus] Unsubscribing from order ${orderId}`);
    
    const handlers = this.subscriptions.get(orderId);
    if (!handlers) {
      console.log(`[OrderEventBus] No handlers found for order ${orderId}`);
      return;
    }
    
    const removed = handlers.delete(handler);
    if (removed) {
      console.log(`[OrderEventBus] Removed handler from order ${orderId} (remaining: ${handlers.size})`);
      
      // Clean up empty sets
      if (handlers.size === 0) {
        this.subscriptions.delete(orderId);
        console.log(`[OrderEventBus] Cleaned up empty subscription for order ${orderId}`);
      }
    } else {
      console.log(`[OrderEventBus] Handler not found for order ${orderId}`);
    }
  }

  /**
   * Publish event - CLIENT-SIDE OPTIMISTIC ONLY
   * Real persistence must happen via RPC/insert to DB separately
   */
  publish(event: OrderEvent): void {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    };
    
    console.log(`[OrderEventBus] Publishing optimistic event for order ${event.order_id}:`, eventWithTimestamp);
    
    const handlers = this.subscriptions.get(event.order_id);
    if (!handlers || handlers.size === 0) {
      console.log(`[OrderEventBus] No handlers for order ${event.order_id}`);
      return;
    }
    
    // Notify all handlers for this order
    handlers.forEach(handler => {
      try {
        handler(eventWithTimestamp);
      } catch (error) {
        console.error(`[OrderEventBus] Handler error for order ${event.order_id}:`, error);
      }
    });
    
    console.log(`[OrderEventBus] Notified ${handlers.size} handlers for order ${event.order_id}`);
  }

  /**
   * Fetch fresh snapshot from database using current Supabase schema
   * After fetch, emits snapshot_reconciled event
   */
  async fetchSnapshot(orderId: string): Promise<OrderSnapshot | null> {
    try {
      console.log(`[OrderEventBus] Fetching snapshot for order ${orderId}`);
      
      // Fetch order, items, and events in parallel
      const [orderResult, itemsResult, eventsResult] = await Promise.allSettled([
        supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single(),
        
        supabase
          .from('order_items')
          .select(`
            *,
            products!inner(name, description, image_url, unit, price)
          `)
          .eq('order_id', orderId)
          .order('created_at'),
        
        supabase
          .from('order_events')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      const snapshot: OrderSnapshot = {
        order: orderResult.status === 'fulfilled' && !orderResult.value.error 
          ? orderResult.value.data 
          : null,
        items: itemsResult.status === 'fulfilled' && !itemsResult.value.error 
          ? itemsResult.value.data || [] 
          : [],
        events: eventsResult.status === 'fulfilled' && !eventsResult.value.error 
          ? eventsResult.value.data || [] 
          : []
      };

      console.log(`[OrderEventBus] Snapshot fetched for order ${orderId}:`, {
        hasOrder: !!snapshot.order,
        itemCount: snapshot.items.length,
        eventCount: snapshot.events.length
      });

      // Emit snapshot_reconciled event
      this.publish({
        order_id: orderId,
        event_type: 'SNAPSHOT_RECONCILED',
        actor_role: 'system',
        data: snapshot
      });

      return snapshot;
    } catch (error) {
      console.error(`[OrderEventBus] Failed to fetch snapshot for order ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Get current subscription count for debugging
   */
  getSubscriptionCount(orderId?: string): number {
    if (orderId) {
      return this.subscriptions.get(orderId)?.size ?? 0;
    }
    
    let total = 0;
    this.subscriptions.forEach(handlers => {
      total += handlers.size;
    });
    return total;
  }

  /**
   * Get all subscribed order IDs for debugging
   */
  getSubscribedOrders(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Export singleton
export const orderEventBus = new OrderEventBus();

export const reconcileFromEvent = (event: OrderEvent, currentState: any) => {
  console.log(`[reconcileFromEvent] Processing ${event.event_type} for order ${event.order_id}`);
  
  switch (event.event_type) {
    case 'ITEM_PICKED':
      // Update specific item's qty_picked
      if (event.data.item_id && event.data.qty_picked !== undefined) {
        const updatedItems = currentState.items.map((item: any) => 
          item.id === event.data.item_id 
            ? { ...item, qty_picked: event.data.qty_picked, shopping_status: 'found' }
            : item
        );
        return { ...currentState, items: updatedItems };
      }
      break;
    
    case 'SUBSTITUTION_SUGGESTED':
      // Update item with substitution data
      if (event.data.item_id && event.data.suggested_sku) {
        const updatedItems = currentState.items.map((item: any) => 
          item.id === event.data.item_id 
            ? { 
                ...item, 
                substitution_data: { suggested_sku: event.data.suggested_sku, status: 'pending' },
                shopping_status: 'substitution_needed' 
              }
            : item
        );
        return { ...currentState, items: updatedItems };
      }
      break;
    
    case 'SUBSTITUTION_DECISION':
      // Update item with decision
      if (event.data.item_id && event.data.decision) {
        const updatedItems = currentState.items.map((item: any) => 
          item.id === event.data.item_id 
            ? { 
                ...item, 
                substitution_data: { ...item.substitution_data, decision: event.data.decision },
                shopping_status: event.data.decision === 'accept' ? 'substituted' : 'not_available'
              }
            : item
        );
        return { ...currentState, items: updatedItems };
      }
      break;
    
    case 'STATUS_CHANGED':
      // Update order status
      if (event.data.to) {
        return { 
          ...currentState, 
          order: { 
            ...currentState.order, 
            status: event.data.to.toLowerCase(),
            updated_at: event.timestamp || new Date().toISOString()
          }
        };
      }
      break;
    
    case 'SNAPSHOT_RECONCILED':
      // Complete state replacement from fresh snapshot
      console.log('[reconcileFromEvent] SNAPSHOT_RECONCILED: Replacing entire state');
      return event.data;
    
    default:
      // Unknown event type - fetch fresh snapshot for safety
      console.log(`[reconcileFromEvent] Unknown event type ${event.event_type}, fetching snapshot`);
      orderEventBus.fetchSnapshot(event.order_id);
      return currentState;
  }
  
  // Fallback: fetch fresh snapshot if we can't patch cleanly
  console.log(`[reconcileFromEvent] ${event.event_type}: Invalid data, fetching snapshot`);
  orderEventBus.fetchSnapshot(event.order_id);
  return currentState;
};