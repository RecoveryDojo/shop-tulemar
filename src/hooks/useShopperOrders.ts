import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { orderEventBus, OrderEvent } from '@/lib/orderEventBus';

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

export interface ShoppingOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  property_address?: string;
  special_instructions?: string;
  status: string;
  total_amount: number;
  created_at: string;
  shopping_started_at?: string;
  shopping_completed_at?: string;
  delivery_started_at?: string;
  delivery_completed_at?: string;
  items: OrderItem[];
}

export const useShopperOrders = () => {
  const [shopperQueue, setShopperQueue] = useState<ShoppingOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<ShoppingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      console.log('useShopperOrders: No user, skipping fetch');
      return;
    }

    try {
      console.log('useShopperOrders: Starting fetch for user:', user.id, user.email);
      setLoading(true);

      // Fetch shopper queue - orders assigned to this shopper in active states
      // Accept both canonical (CLAIMED, SHOPPING, READY, DELIVERED) and legacy (claimed, shopping, ready, delivered)
      const { data: shopperQueueData, error: queueError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description, image_url, unit, price)
          )
        `)
        .eq('assigned_shopper_id', user.id)
        .in('status', ['CLAIMED', 'claimed', 'SHOPPING', 'shopping', 'READY', 'ready', 'DELIVERED', 'delivered']);

      console.log('useShopperOrders: Shopper queue query:', { shopperQueueData, queueError });

      // Fetch available orders (placed, not assigned)
      // Accept both canonical (PLACED) and legacy (placed, pending, confirmed)
      const { data: available, error: availableError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description, image_url, unit, price)
          )
        `)
        .in('status', ['placed'])
        .is('assigned_shopper_id', null);

      console.log('useShopperOrders: Available orders query:', { available, availableError });

      // If there's an error, just log it and continue with empty arrays
      if (queueError) {
        console.log('No shopper queue found:', queueError);
      }
      if (availableError) {
        console.log('No available orders found or permission issue:', availableError);
      }

      // Transform the data
      const transformOrders = (orders: any[]): ShoppingOrder[] => {
        return orders.map(order => ({
          ...order,
          items: order.order_items.map((item: any) => ({
            ...item,
            product: item.products
          }))
        }));
      };

      const transformedQueue = transformOrders(shopperQueueData || []);
      const transformedAvailable = transformOrders(available || []);

      console.log('useShopperOrders: Final transformed data:', {
        queue: transformedQueue.length,
        available: transformedAvailable.length
      });

      setShopperQueue(transformedQueue);
      setAvailableOrders(transformedAvailable);

    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
      // Set empty arrays so the UI shows "no orders" messages
      setShopperQueue([]);
      setAvailableOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refetchOrders = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();

    // Only set up realtime if we have a user
    if (!user) return;

    // Set up per-order event bus subscriptions for shopper's orders
    const currentOrders = [...shopperQueue, ...availableOrders];
    const cleanupFunctions: (() => Promise<void>)[] = [];

    const setupOrderSubscriptions = async () => {
      for (const order of currentOrders) {
        try {
          const handleOrderEvent = (event: OrderEvent) => {
            console.log(`[useShopperOrders] Received event for order ${order.id}:`, event.event_type);
            
            // Handle different event types
            if (event.event_type === 'snapshot_reconciled') {
              // Reconcile with canonical data on reconnect
              console.log(`[useShopperOrders] Reconciling order ${order.id}`);
              fetchOrders();
            } else if (
              event.event_type === 'order_updated' || 
              event.event_type === 'items_updated' ||
              event.event_type.includes('status_changed') ||
              event.event_type === 'ASSIGNED' ||
              event.event_type === 'ITEM_PICKED' ||
              event.event_type === 'SUBSTITUTION_SUGGESTED'
            ) {
              // Refetch on any data changes
              console.log(`[useShopperOrders] Order ${order.id} data changed, refetching...`);
              fetchOrders();
            }
          };

          await orderEventBus.subscribe(order.id, handleOrderEvent);
          
          // Add cleanup function
          cleanupFunctions.push(async () => {
            try {
              await orderEventBus.unsubscribe(order.id, handleOrderEvent);
            } catch (error) {
              console.error(`[useShopperOrders] Cleanup error for order ${order.id}:`, error);
            }
          });
        } catch (error) {
          console.error(`[useShopperOrders] Failed to subscribe to order ${order.id}:`, error);
        }
      }
    };

    if (currentOrders.length > 0) {
      setupOrderSubscriptions();
    }

    return () => {
      // Clean up all subscriptions
      cleanupFunctions.forEach(async (cleanup) => {
        try {
          await cleanup();
        } catch (error) {
          console.error('[useShopperOrders] Cleanup error:', error);
        }
      });
    };
  }, [user?.id]); // Only depend on user.id to prevent excessive re-subscriptions

  return {
    shopperQueue,
    availableOrders,
    loading,
    error,
    refetchOrders
  };
};