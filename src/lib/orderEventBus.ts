import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/utils/realtimeConnectionManager';

export interface OrderEvent {
  id: string;
  order_id: string;
  event_type: string;
  payload: any;
  actor_id?: string;
  actor_role?: string;
  created_at: string;
}

export interface OrderEventHandler {
  (event: OrderEvent): void;
}

export interface OrderSnapshot {
  order: any;
  items: any[];
  events: OrderEvent[];
}

class OrderEventBus {
  private subscriptions = new Map<string, Set<OrderEventHandler>>();
  private channelSubscriptions = new Map<string, string[]>();

  /**
   * Publish an event for a specific order
   * Inserts into events table then broadcasts on order-{orderId} channel
   */
  async publish(
    orderId: string, 
    type: string, 
    payload: any, 
    actor?: { id?: string; role?: string }
  ): Promise<void> {
    try {
      console.log(`[OrderEventBus] Publishing event ${type} for order ${orderId}`, { payload, actor });

      // Insert event into database first (use any to work around types)
      const { data: event, error } = await (supabase as any)
        .from('order_events')
        .insert({
          order_id: orderId,
          event_type: type,
          payload,
          actor_id: actor?.id,
          actor_role: actor?.role
        })
        .select()
        .single();

      if (error) {
        console.error('[OrderEventBus] Failed to insert event:', error);
        throw error;
      }

      // Broadcast to order-specific channel
      const channelName = `order-${orderId}`;
      const channel = supabase.channel(channelName);
      
      await channel.send({
        type: 'broadcast',
        event: 'order_event',
        payload: event
      });

      console.log(`[OrderEventBus] Event published successfully:`, event);
    } catch (error) {
      console.error('[OrderEventBus] Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events for a specific order
   * Uses realtimeConnectionManager for reliable connections
   */
  async subscribe(orderId: string, handler: OrderEventHandler): Promise<void> {
    console.log(`[OrderEventBus] Subscribing to order ${orderId}`);

    // Add handler to local registry
    if (!this.subscriptions.has(orderId)) {
      this.subscriptions.set(orderId, new Set());
    }
    this.subscriptions.get(orderId)!.add(handler);

    // Set up realtime subscriptions if this is the first handler for this order
    if (this.subscriptions.get(orderId)!.size === 1) {
      await this.setupOrderSubscriptions(orderId);
    }
  }

  /**
   * Unsubscribe from events for a specific order
   */
  async unsubscribe(orderId: string, handler: OrderEventHandler): Promise<void> {
    console.log(`[OrderEventBus] Unsubscribing from order ${orderId}`);

    const handlers = this.subscriptions.get(orderId);
    if (handlers) {
      handlers.delete(handler);
      
      // Clean up realtime subscriptions if no more handlers
      if (handlers.size === 0) {
        await this.cleanupOrderSubscriptions(orderId);
        this.subscriptions.delete(orderId);
      }
    }
  }

  /**
   * Get current canonical snapshot of order data
   */
  async getOrderSnapshot(orderId: string): Promise<OrderSnapshot | null> {
    try {
      console.log(`[OrderEventBus] Fetching canonical snapshot for order ${orderId}`);

      // Fetch order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) {
        console.error('[OrderEventBus] Failed to fetch order:', orderError);
        return null;
      }

      if (!order) {
        console.warn(`[OrderEventBus] Order ${orderId} not found`);
        return null;
      }

      // Fetch order items with product details
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (name, description, image_url, unit, price)
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('[OrderEventBus] Failed to fetch order items:', itemsError);
        return null;
      }

      // Fetch recent events (use any to work around types)
      const { data: events, error: eventsError } = await (supabase as any)
        .from('order_events')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('[OrderEventBus] Failed to fetch events:', eventsError);
      }

      return {
        order,
        items: items || [],
        events: (events as OrderEvent[]) || []
      };
    } catch (error) {
      console.error('[OrderEventBus] Failed to get order snapshot:', error);
      return null;
    }
  }

  /**
   * Setup realtime subscriptions for a specific order
   */
  private async setupOrderSubscriptions(orderId: string): Promise<void> {
    const channelNames: string[] = [];

    try {
      // Subscribe to order changes
      const orderChannelName = `order-${orderId}-data`;
      await realtimeManager.subscribe({
        channelName: orderChannelName,
        table: 'orders',
        filter: `id=eq.${orderId}`,
        onMessage: (payload) => {
          console.log(`[OrderEventBus] Order data changed for ${orderId}:`, payload);
          this.handleDataChange(orderId, 'order_updated', payload);
        },
        onReconnect: () => {
          console.log(`[OrderEventBus] Reconnected to order ${orderId}, refetching snapshot`);
          this.handleReconnect(orderId);
        },
        onError: (error) => {
          console.error(`[OrderEventBus] Order subscription error for ${orderId}:`, error);
        },
        retryAttempts: 3,
        retryDelay: 2000
      });
      channelNames.push(orderChannelName);

      // Subscribe to order items changes
      const itemsChannelName = `order-${orderId}-items`;
      await realtimeManager.subscribe({
        channelName: itemsChannelName,
        table: 'order_items',
        filter: `order_id=eq.${orderId}`,
        onMessage: (payload) => {
          console.log(`[OrderEventBus] Order items changed for ${orderId}:`, payload);
          this.handleDataChange(orderId, 'items_updated', payload);
        },
        onReconnect: () => {
          console.log(`[OrderEventBus] Reconnected to order items ${orderId}, refetching snapshot`);
          this.handleReconnect(orderId);
        },
        onError: (error) => {
          console.error(`[OrderEventBus] Items subscription error for ${orderId}:`, error);
        },
        retryAttempts: 3,
        retryDelay: 2000
      });
      channelNames.push(itemsChannelName);

      // Subscribe to order events
      const eventsChannelName = `order-${orderId}-events`;
      await realtimeManager.subscribe({
        channelName: eventsChannelName,
        table: 'order_events',
        filter: `order_id=eq.${orderId}`,
        onMessage: (payload) => {
          console.log(`[OrderEventBus] New event for order ${orderId}:`, payload);
          if (payload.eventType === 'INSERT' && payload.new) {
            this.notifyHandlers(orderId, payload.new as OrderEvent);
          }
        },
        onReconnect: () => {
          console.log(`[OrderEventBus] Reconnected to order events ${orderId}, refetching snapshot`);
          this.handleReconnect(orderId);
        },
        onError: (error) => {
          console.error(`[OrderEventBus] Events subscription error for ${orderId}:`, error);
        },
        retryAttempts: 3,
        retryDelay: 2000
      });
      channelNames.push(eventsChannelName);

      // Store channel names for cleanup
      this.channelSubscriptions.set(orderId, channelNames);

      console.log(`[OrderEventBus] Set up subscriptions for order ${orderId}:`, channelNames);
    } catch (error) {
      console.error(`[OrderEventBus] Failed to setup subscriptions for order ${orderId}:`, error);
      
      // Cleanup partial subscriptions
      for (const channelName of channelNames) {
        try {
          await realtimeManager.unsubscribe(channelName);
        } catch (cleanupError) {
          console.error(`[OrderEventBus] Failed to cleanup channel ${channelName}:`, cleanupError);
        }
      }
      throw error;
    }
  }

  /**
   * Cleanup realtime subscriptions for a specific order
   */
  private async cleanupOrderSubscriptions(orderId: string): Promise<void> {
    const channelNames = this.channelSubscriptions.get(orderId);
    if (!channelNames) return;

    console.log(`[OrderEventBus] Cleaning up subscriptions for order ${orderId}:`, channelNames);

    for (const channelName of channelNames) {
      try {
        await realtimeManager.unsubscribe(channelName);
      } catch (error) {
        console.error(`[OrderEventBus] Failed to unsubscribe from ${channelName}:`, error);
      }
    }

    this.channelSubscriptions.delete(orderId);
  }

  /**
   * Handle data changes from realtime subscriptions
   */
  private handleDataChange(orderId: string, eventType: string, payload: any): void {
    const syntheticEvent: OrderEvent = {
      id: `synthetic-${Date.now()}`,
      order_id: orderId,
      event_type: eventType,
      payload,
      created_at: new Date().toISOString()
    };

    this.notifyHandlers(orderId, syntheticEvent);
  }

  /**
   * Handle reconnection by refetching canonical data
   */
  private async handleReconnect(orderId: string): Promise<void> {
    try {
      const snapshot = await this.getOrderSnapshot(orderId);
      if (snapshot) {
        const reconciledEvent: OrderEvent = {
          id: `reconnect-${Date.now()}`,
          order_id: orderId,
          event_type: 'snapshot_reconciled',
          payload: snapshot,
          created_at: new Date().toISOString()
        };

        this.notifyHandlers(orderId, reconciledEvent);
      }
    } catch (error) {
      console.error(`[OrderEventBus] Failed to handle reconnect for order ${orderId}:`, error);
    }
  }

  /**
   * Notify all handlers for a specific order
   */
  private notifyHandlers(orderId: string, event: OrderEvent): void {
    const handlers = this.subscriptions.get(orderId);
    if (!handlers) return;

    console.log(`[OrderEventBus] Notifying ${handlers.size} handlers for order ${orderId}:`, event.event_type);

    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`[OrderEventBus] Handler error for order ${orderId}:`, error);
      }
    });
  }
}

// Export singleton instance
export const orderEventBus = new OrderEventBus();