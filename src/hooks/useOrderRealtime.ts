import { useEffect, useCallback, useRef, useState } from 'react';
import { realtimeManager, createOrderChannelName } from '@/utils/realtimeConnectionManager';
import { supabase } from '@/integrations/supabase/client';

interface OrderSnapshot {
  order: any;
  items: any[];
  events: any[];
}

interface OrderRealtimeConfig {
  orderId: string;
  onOrderChange?: (payload: any) => void;
  onItemChange?: (payload: any) => void;
  onEventReceived?: (payload: any) => void;
  onSnapshotReconciled?: (snapshot: OrderSnapshot) => void;
  onReconnect?: () => void;
  onError?: (error: any) => void;
}

export const useOrderRealtime = (config: OrderRealtimeConfig) => {
  const { 
    orderId, 
    onOrderChange, 
    onItemChange, 
    onEventReceived, 
    onSnapshotReconciled,
    onReconnect, 
    onError 
  } = config;
  
  const subscribedOrderId = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Debounce timers for UI updates
  const debounceTimers = useRef<{
    order?: NodeJS.Timeout;
    items?: NodeJS.Timeout;
    events?: NodeJS.Timeout;
  }>({});

  const clearDebounceTimers = useCallback(() => {
    Object.values(debounceTimers.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    debounceTimers.current = {};
  }, []);

  const fetchOrderSnapshot = useCallback(async (targetOrderId: string): Promise<OrderSnapshot | null> => {
    try {
      console.log(`[OrderRealtime] Fetching fresh snapshot for order: ${targetOrderId}`);
      
      const [orderResult, itemsResult, eventsResult] = await Promise.allSettled([
        supabase.from('orders').select('*').eq('id', targetOrderId).single(),
        supabase.from('order_items').select('*').eq('order_id', targetOrderId).order('created_at'),
        supabase.from('order_events').select('*').eq('order_id', targetOrderId).order('created_at')
      ]);

      const snapshot: OrderSnapshot = {
        order: orderResult.status === 'fulfilled' && !orderResult.value.error ? orderResult.value.data : null,
        items: itemsResult.status === 'fulfilled' && !itemsResult.value.error ? itemsResult.value.data || [] : [],
        events: eventsResult.status === 'fulfilled' && !eventsResult.value.error ? eventsResult.value.data || [] : []
      };

      console.log(`[OrderRealtime] Snapshot fetched for order ${targetOrderId}:`, snapshot);
      return snapshot;
    } catch (error) {
      console.error(`[OrderRealtime] Failed to fetch snapshot for order ${targetOrderId}:`, error);
      onError?.(error);
      return null;
    }
  }, [onError]);

  const handleReconnect = useCallback(async (targetOrderId: string) => {
    console.log(`[OrderRealtime] Handling reconnect for order: ${targetOrderId}`);
    
    // Fetch fresh snapshot and reconcile
    const snapshot = await fetchOrderSnapshot(targetOrderId);
    if (snapshot) {
      onSnapshotReconciled?.(snapshot);
    }
    
    onReconnect?.();
  }, [fetchOrderSnapshot, onSnapshotReconciled, onReconnect]);

  const debouncedOrderUpdate = useCallback((payload: any) => {
    if (debounceTimers.current.order) {
      clearTimeout(debounceTimers.current.order);
    }
    
    debounceTimers.current.order = setTimeout(() => {
      onOrderChange?.(payload);
    }, 50);
  }, [onOrderChange]);

  const debouncedItemUpdate = useCallback((payload: any) => {
    if (debounceTimers.current.items) {
      clearTimeout(debounceTimers.current.items);
    }
    
    debounceTimers.current.items = setTimeout(() => {
      onItemChange?.(payload);
    }, 50);
  }, [onItemChange]);

  const debouncedEventUpdate = useCallback((payload: any) => {
    if (debounceTimers.current.events) {
      clearTimeout(debounceTimers.current.events);
    }
    
    debounceTimers.current.events = setTimeout(() => {
      onEventReceived?.(payload);
    }, 50);
  }, [onEventReceived]);

  const subscribeToOrder = useCallback(async (targetOrderId: string) => {
    if (!targetOrderId) return;

    console.log(`[OrderRealtime] Subscribing to order: ${targetOrderId}`);
    
    try {
      // Subscribe to orders table - UPDATE events only
      await realtimeManager.subscribe({
        channelName: createOrderChannelName(targetOrderId, 'orders'),
        table: 'orders',
        event: 'UPDATE',
        filter: `id=eq.${targetOrderId}`,
        onMessage: (payload) => {
          console.log(`[OrderRealtime] Order UPDATE for ${targetOrderId}:`, payload);
          debouncedOrderUpdate(payload);
        },
        onError: (error) => {
          console.error(`[OrderRealtime] Orders channel error for ${targetOrderId}:`, error);
          onError?.(error);
        },
        onReconnect: () => {
          console.log(`[OrderRealtime] Orders channel reconnected for ${targetOrderId}`);
          handleReconnect(targetOrderId);
        },
        retryAttempts: 5,
        retryDelay: 1000
      });

      // Subscribe to order_items - INSERT/UPDATE/DELETE events
      await realtimeManager.subscribe({
        channelName: createOrderChannelName(targetOrderId, 'items'),
        table: 'order_items',
        event: '*', // All events (INSERT/UPDATE/DELETE)
        filter: `order_id=eq.${targetOrderId}`,
        onMessage: (payload) => {
          console.log(`[OrderRealtime] Item ${payload.eventType} for ${targetOrderId}:`, payload);
          // Only process INSERT, UPDATE, DELETE events
          if (['INSERT', 'UPDATE', 'DELETE'].includes(payload.eventType)) {
            debouncedItemUpdate(payload);
          }
        },
        onError: (error) => {
          console.error(`[OrderRealtime] Items channel error for ${targetOrderId}:`, error);
          onError?.(error);
        },
        onReconnect: () => {
          console.log(`[OrderRealtime] Items channel reconnected for ${targetOrderId}`);
          handleReconnect(targetOrderId);
        },
        retryAttempts: 5,
        retryDelay: 1000
      });

      // Subscribe to order_events - INSERT events only
      await realtimeManager.subscribe({
        channelName: createOrderChannelName(targetOrderId, 'events'),
        table: 'order_events',
        event: 'INSERT',
        filter: `order_id=eq.${targetOrderId}`,
        onMessage: (payload) => {
          console.log(`[OrderRealtime] Event INSERT for ${targetOrderId}:`, payload);
          debouncedEventUpdate(payload);
        },
        onError: (error) => {
          console.error(`[OrderRealtime] Events channel error for ${targetOrderId}:`, error);
          onError?.(error);
        },
        onReconnect: () => {
          console.log(`[OrderRealtime] Events channel reconnected for ${targetOrderId}`);
          handleReconnect(targetOrderId);
        },
        retryAttempts: 5,
        retryDelay: 1000
      });

      subscribedOrderId.current = targetOrderId;
      setIsConnected(true);
      console.log(`[OrderRealtime] Successfully subscribed to all channels for order: ${targetOrderId}`);
    } catch (error) {
      console.error(`[OrderRealtime] Failed to subscribe to order ${targetOrderId}:`, error);
      setIsConnected(false);
      onError?.(error);
    }
  }, [debouncedOrderUpdate, debouncedItemUpdate, debouncedEventUpdate, handleReconnect, onError]);

  const unsubscribeFromOrder = useCallback(async (targetOrderId: string) => {
    if (!targetOrderId) return;
    
    console.log(`[OrderRealtime] Unsubscribing from order: ${targetOrderId}`);
    
    // Clear debounce timers
    clearDebounceTimers();
    
    try {
      await Promise.all([
        realtimeManager.unsubscribe(createOrderChannelName(targetOrderId, 'orders')),
        realtimeManager.unsubscribe(createOrderChannelName(targetOrderId, 'items')),
        realtimeManager.unsubscribe(createOrderChannelName(targetOrderId, 'events'))
      ]);
      
      if (subscribedOrderId.current === targetOrderId) {
        subscribedOrderId.current = null;
        setIsConnected(false);
      }
      console.log(`[OrderRealtime] Successfully unsubscribed from order: ${targetOrderId}`);
    } catch (error) {
      console.error(`[OrderRealtime] Failed to unsubscribe from order ${targetOrderId}:`, error);
    }
  }, [clearDebounceTimers]);

  // Subscribe/unsubscribe when orderId changes
  useEffect(() => {
    if (!orderId) {
      // Clean up if no orderId
      if (subscribedOrderId.current) {
        unsubscribeFromOrder(subscribedOrderId.current);
      }
      return;
    }

    // Always unsubscribe old then subscribe new to ensure clean state
    const handleOrderChange = async () => {
      // Unsubscribe from previous order if exists
      if (subscribedOrderId.current && subscribedOrderId.current !== orderId) {
        await unsubscribeFromOrder(subscribedOrderId.current);
      }
      
      // Subscribe to new order if different
      if (subscribedOrderId.current !== orderId) {
        await subscribeToOrder(orderId);
      }
    };

    handleOrderChange();

    return () => {
      clearDebounceTimers();
      if (subscribedOrderId.current) {
        unsubscribeFromOrder(subscribedOrderId.current);
      }
    };
  }, [orderId, subscribeToOrder, unsubscribeFromOrder, clearDebounceTimers]);

  return {
    subscribeToOrder,
    unsubscribeFromOrder,
    subscribedOrderId: subscribedOrderId.current,
    isConnected,
    fetchSnapshot: () => orderId ? fetchOrderSnapshot(orderId) : null
  };
};

// Legacy broadcast function - now routes through orderEventBus
export const broadcastOrderEvent = async (orderId: string, eventType: string, data: any) => {
  if (!orderId) return;
  
  console.log(`[OrderRealtime] Broadcasting ${eventType} to order ${orderId}:`, data);
  
  try {
    const { orderEventBus } = await import('@/lib/orderEventBus');
    await orderEventBus.publish(orderId, eventType, data);
    console.log(`[OrderRealtime] Successfully broadcasted ${eventType} for order ${orderId}`);
  } catch (error) {
    console.error(`[OrderRealtime] Failed to broadcast event for order ${orderId}:`, error);
  }
};