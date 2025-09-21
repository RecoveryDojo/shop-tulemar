import { useEffect, useCallback, useRef } from 'react';
import { realtimeManager } from '@/utils/realtimeConnectionManager';

interface OrderRealtimeConfig {
  orderId: string;
  onOrderChange?: (payload: any) => void;
  onItemChange?: (payload: any) => void;
  onEventReceived?: (payload: any) => void;
  onReconnect?: () => void;
  onError?: (error: any) => void;
}

export const useOrderRealtime = (config: OrderRealtimeConfig) => {
  const { orderId, onOrderChange, onItemChange, onEventReceived, onReconnect, onError } = config;
  const subscribedOrderId = useRef<string | null>(null);

  const subscribeToOrder = useCallback(async (targetOrderId: string) => {
    if (!targetOrderId) return;

    const channelName = `order-${targetOrderId}`;
    console.log(`[OrderRealtime] Subscribing to order: ${targetOrderId}`);
    
    try {
      // Subscribe to orders table changes for this specific order
      await realtimeManager.subscribe({
        channelName: `${channelName}-orders`,
        table: 'orders',
        filter: `id=eq.${targetOrderId}`,
        onMessage: (payload) => {
          console.log(`[OrderRealtime] Order change for ${targetOrderId}:`, payload);
          onOrderChange?.(payload);
        },
        onError: (error) => {
          console.error(`[OrderRealtime] Orders channel error for ${targetOrderId}:`, error);
          onError?.(error);
        },
        onReconnect: () => {
          console.log(`[OrderRealtime] Orders channel reconnected for ${targetOrderId}`);
          onReconnect?.();
        },
        retryAttempts: 3,
        retryDelay: 3000
      });

      // Subscribe to order_items changes for this specific order
      await realtimeManager.subscribe({
        channelName: `${channelName}-items`,
        table: 'order_items',
        filter: `order_id=eq.${targetOrderId}`,
        onMessage: (payload) => {
          console.log(`[OrderRealtime] Item change for ${targetOrderId}:`, payload);
          onItemChange?.(payload);
        },
        onError: (error) => {
          console.error(`[OrderRealtime] Items channel error for ${targetOrderId}:`, error);
          onError?.(error);
        },
        onReconnect: () => {
          console.log(`[OrderRealtime] Items channel reconnected for ${targetOrderId}`);
          onReconnect?.();
        },
        retryAttempts: 3,
        retryDelay: 3000
      });

      // Subscribe to order events/workflow log for this specific order
      await realtimeManager.subscribe({
        channelName: `${channelName}-events`,
        table: 'order_workflow_log',
        filter: `order_id=eq.${targetOrderId}`,
        onMessage: (payload) => {
          console.log(`[OrderRealtime] Event for ${targetOrderId}:`, payload);
          onEventReceived?.(payload);
        },
        onError: (error) => {
          console.error(`[OrderRealtime] Events channel error for ${targetOrderId}:`, error);
          onError?.(error);
        },
        onReconnect: () => {
          console.log(`[OrderRealtime] Events channel reconnected for ${targetOrderId}`);
          onReconnect?.();
        },
        retryAttempts: 3,
        retryDelay: 3000
      });

      subscribedOrderId.current = targetOrderId;
      console.log(`[OrderRealtime] Successfully subscribed to all channels for order: ${targetOrderId}`);
    } catch (error) {
      console.error(`[OrderRealtime] Failed to subscribe to order ${targetOrderId}:`, error);
      onError?.(error);
    }
  }, [onOrderChange, onItemChange, onEventReceived, onReconnect, onError]);

  const unsubscribeFromOrder = useCallback(async (targetOrderId: string) => {
    if (!targetOrderId) return;
    
    const channelName = `order-${targetOrderId}`;
    console.log(`[OrderRealtime] Unsubscribing from order: ${targetOrderId}`);
    
    try {
      await Promise.all([
        realtimeManager.unsubscribe(`${channelName}-orders`),
        realtimeManager.unsubscribe(`${channelName}-items`),
        realtimeManager.unsubscribe(`${channelName}-events`)
      ]);
      
      if (subscribedOrderId.current === targetOrderId) {
        subscribedOrderId.current = null;
      }
      console.log(`[OrderRealtime] Successfully unsubscribed from order: ${targetOrderId}`);
    } catch (error) {
      console.error(`[OrderRealtime] Failed to unsubscribe from order ${targetOrderId}:`, error);
    }
  }, []);

  // Subscribe/unsubscribe when orderId changes
  useEffect(() => {
    if (!orderId) {
      // Clean up if no orderId
      if (subscribedOrderId.current) {
        unsubscribeFromOrder(subscribedOrderId.current);
      }
      return;
    }

    // Only subscribe if we're not already subscribed to this order
    if (subscribedOrderId.current !== orderId) {
      // Unsubscribe from previous order if different
      if (subscribedOrderId.current) {
        unsubscribeFromOrder(subscribedOrderId.current);
      }
      
      // Subscribe to new order
      subscribeToOrder(orderId);
    }

    return () => {
      if (subscribedOrderId.current) {
        unsubscribeFromOrder(subscribedOrderId.current);
      }
    };
  }, [orderId, subscribeToOrder, unsubscribeFromOrder]);

  return {
    subscribeToOrder,
    unsubscribeFromOrder,
    subscribedOrderId: subscribedOrderId.current
  };
};

// Broadcast minimal delta events to order channel
export const broadcastOrderEvent = async (orderId: string, eventType: string, data: any) => {
  if (!orderId) return;
  
  const channelName = `order-${orderId}`;
  console.log(`[OrderRealtime] Broadcasting ${eventType} to ${channelName}:`, data);
  
  try {
    // Call the backend edge function to broadcast the event
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase.functions.invoke('broadcast-order-event', { 
      body: {
        orderId,
        eventType,
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      }
    });

    if (error) {
      console.error(`[OrderRealtime] Failed to broadcast event:`, error);
    } else {
      console.log(`[OrderRealtime] Successfully broadcasted ${eventType} for order ${orderId}`);
    }
  } catch (error) {
    console.error(`[OrderRealtime] Failed to broadcast event for order ${orderId}:`, error);
  }
};