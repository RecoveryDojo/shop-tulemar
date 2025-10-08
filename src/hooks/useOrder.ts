import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export interface OrderState {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  property_address?: string;
  special_instructions?: string;
  status: string;
  total_amount: number;
  assigned_shopper_id?: string;
  assigned_concierge_id?: string;
  created_at: string;
  updated_at: string;
  shopping_started_at?: string;
  shopping_completed_at?: string;
  delivery_started_at?: string;
  delivery_completed_at?: string;
  items: OrderItem[];
  events: OrderEvent[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  shopping_status: 'pending' | 'found' | 'substitution_needed' | 'skipped';
  found_quantity: number;
  shopper_notes?: string;
  substitution_data?: any;
  photo_url?: string;
  product?: {
    name: string;
    description?: string;
    image_url?: string;
    unit: string;
    price: number;
  };
}

/**
 * Single source of truth for order state across all roles
 * Subscribes to Supabase realtime for updates
 */
export const useOrder = (orderId: string) => {
  const [order, setOrder] = useState<OrderState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrderSnapshot = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);

      const [orderResult, itemsResult, eventsResult] = await Promise.allSettled([
        supabase.from('orders').select('*').eq('id', orderId).single(),
        supabase.from('new_order_items').select('*, products(name, description, image_url, unit, price)').eq('order_id', orderId).order('created_at'),
        supabase.from('new_order_events').select('*').eq('order_id', orderId).order('created_at', { ascending: false }).limit(50)
      ]);

      const snapshot: OrderSnapshot = {
        order: orderResult.status === 'fulfilled' && !orderResult.value.error ? orderResult.value.data : null,
        items: itemsResult.status === 'fulfilled' && !itemsResult.value.error ? itemsResult.value.data || [] : [],
        events: eventsResult.status === 'fulfilled' && !eventsResult.value.error ? eventsResult.value.data || [] : []
      };

      if (snapshot.order) {
        const transformedOrder: OrderState = {
          ...snapshot.order,
          items: snapshot.items.map(item => ({
            ...item,
            product: item.products
          })),
          events: snapshot.events
        };
        setOrder(transformedOrder);
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      console.error('[useOrder] Failed to fetch order:', err);
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const handleOrderEvent = useCallback((event: OrderEvent) => {
    console.log(`[useOrder] Processing event for order ${orderId}:`, event.event_type);

    // Handle snapshot reconciliation on reconnect
    if (event.event_type === 'SNAPSHOT_RECONCILED') {
      const snapshot = event.data as OrderSnapshot;
      const transformedOrder: OrderState = {
        ...snapshot.order,
        items: snapshot.items.map(item => ({
          ...item,
          product: item.products
        })),
        events: snapshot.events
      };
      setOrder(transformedOrder);
      return;
    }

    // Handle real-time updates
    setOrder(prevOrder => {
      if (!prevOrder) return prevOrder;

      // Update order data
      if (event.event_type === 'order_updated' && event.data.new) {
        return {
          ...prevOrder,
          ...event.data.new,
          events: [event, ...prevOrder.events]
        };
      }

      // Update items
      if (event.event_type === 'items_updated' && event.data.new) {
        const updatedItems = prevOrder.items.map(item =>
          item.id === event.data.new.id 
            ? { ...item, ...event.data.new, product: item.product }
            : item
        );
        return {
          ...prevOrder,
          items: updatedItems,
          events: [event, ...prevOrder.events]
        };
      }

      // Add event to history
      return {
        ...prevOrder,
        events: [event, ...prevOrder.events]
      };
    });

    // Show user-friendly notifications based on event type
    if (event.event_type.startsWith('status_changed_to_')) {
      const newStatus = event.event_type.replace('status_changed_to_', '');
      toast({
        title: "Order Status Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } else if (event.event_type === 'ITEM_PICKED') {
      toast({
        title: "Item Found",
        description: `Item has been picked by the shopper`,
      });
    } else if (event.event_type === 'SUBSTITUTION_SUGGESTED') {
      toast({
        title: "Substitution Suggested",
        description: "Please review the suggested substitution",
      });
    } else if (event.event_type === 'ASSIGNED') {
      const { shopper_id, concierge_id } = event.data;
      toast({
        title: "Staff Assigned",
        description: `Staff has been assigned to your order`,
      });
    } else if (['ARRIVED_PROPERTY', 'STOCKING_STARTED', 'STOCKED_IN_UNIT'].includes(event.event_type)) {
      toast({
        title: "Concierge Update",
        description: `Property service: ${event.event_type.toLowerCase().replace('_', ' ')}`,
      });
    }
  }, [orderId, toast]);

  // Set up Supabase realtime subscription
  useEffect(() => {
    if (!orderId) return;

    // Fetch initial data
    fetchOrderSnapshot();

    // Subscribe to order updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('[useOrder] Order updated:', payload);
        fetchOrderSnapshot();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'new_order_items',
        filter: `order_id=eq.${orderId}`
      }, (payload) => {
        console.log('[useOrder] Item updated:', payload);
        fetchOrderSnapshot();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'new_order_events',
        filter: `order_id=eq.${orderId}`
      }, (payload) => {
        console.log('[useOrder] Event received:', payload);
        handleOrderEvent(payload.new as OrderEvent);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, handleOrderEvent, fetchOrderSnapshot]);

  const refetch = useCallback(() => {
    fetchOrderSnapshot();
  }, [fetchOrderSnapshot]);

  return {
    order,
    loading,
    error,
    refetch
  };
};