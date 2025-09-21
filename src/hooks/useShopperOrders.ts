import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeManager } from '@/utils/realtimeConnectionManager';
import { useToast } from '@/hooks/use-toast';

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
  const [availableOrders, setAvailableOrders] = useState<ShoppingOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<ShoppingOrder[]>([]);
  const [deliveryQueue, setDeliveryQueue] = useState<ShoppingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOrders = async () => {
    if (!user) {
      console.log('useShopperOrders: No user, skipping fetch');
      return;
    }

    try {
      console.log('useShopperOrders: Starting fetch for user:', user.id, user.email);
      setLoading(true);

      // Fetch available orders (pending, not assigned)
      const { data: available, error: availableError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description, image_url, unit, price)
          )
        `)
        .eq('status', 'pending')
        .is('assigned_shopper_id', null);

      console.log('useShopperOrders: Available orders query:', { available, availableError });

      // If there's an error, just log it and continue with empty arrays
      if (availableError) {
        console.log('No available orders found or permission issue:', availableError);
      }

      // Fetch shopper's active orders (assigned to them OR via stakeholder assignments)
      // Remove the accepted_at requirement since admin assignments should be immediately visible
      const { data: assignedOrders, error: assignedError } = await supabase
        .from('stakeholder_assignments')
        .select(`
          order_id,
          status,
          accepted_at,
          orders!inner (
            *,
            order_items (
              *,
              products (name, description, image_url, unit, price)
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'shopper')
        .in('orders.status', ['confirmed', 'assigned', 'shopping']);

      console.log('useShopperOrders: Stakeholder assignments query:', { assignedOrders, assignedError });

      const { data: directAssigned, error: directError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description, image_url, unit, price)
          )
        `)
        .eq('assigned_shopper_id', user.id)
        .in('status', ['assigned', 'shopping']);

      console.log('useShopperOrders: Direct assignment query:', { directAssigned, directError });

      // Combine both assignment methods
      let active: any[] = [];
      if (assignedOrders) {
        active = active.concat(assignedOrders.map((assignment: any) => assignment.orders));
      }
      if (directAssigned) {
        active = active.concat(directAssigned);
      }

      // Remove duplicates
      active = active.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );

      console.log('useShopperOrders: Combined active orders:', active);

      if (assignedError) {
        console.log('No assigned orders found:', assignedError);
      }
      if (directError) {
        console.log('No direct assigned orders found:', directError);
      }

      // Fetch delivery queue (packed orders assigned to shopper)
      const { data: delivery, error: deliveryError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description, image_url, unit, price)
          )
        `)
        .eq('assigned_shopper_id', user.id)
        .in('status', ['packed', 'in_transit']);

      console.log('useShopperOrders: Delivery queue query:', { delivery, deliveryError });

      if (deliveryError) {
        console.log('No delivery orders found:', deliveryError);
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

      const transformedAvailable = transformOrders(available || []);
      const transformedActive = transformOrders(active || []);
      const transformedDelivery = transformOrders(delivery || []);

      console.log('useShopperOrders: Final transformed data:', {
        available: transformedAvailable.length,
        active: transformedActive.length,
        delivery: transformedDelivery.length
      });

      setAvailableOrders(transformedAvailable);
      setActiveOrders(transformedActive);
      setDeliveryQueue(transformedDelivery);

    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
      // Set empty arrays so the UI shows "no orders" messages
      setAvailableOrders([]);
      setActiveOrders([]);
      setDeliveryQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const refetchOrders = () => {
    fetchOrders();
  };

  useEffect(() => {
    fetchOrders();

    // Only set up realtime if we have a user
    if (!user) return;

    // Set up order-scoped real-time subscriptions for current user's orders
    const currentOrders = [...availableOrders, ...activeOrders, ...deliveryQueue];
    const subscriptions: string[] = [];

    const setupRealtimeForOrders = async () => {
      for (const order of currentOrders) {
        const ordersChannelName = `shopper-orders-${order.id}`;
        const itemsChannelName = `shopper-orders-${order.id}-items`;
        
        try {
          await realtimeManager.subscribe({
            channelName: ordersChannelName,
            table: 'orders',
            filter: `id=eq.${order.id}`,
            onMessage: () => {
              console.log(`Order ${order.id} changed, refetching...`);
              fetchOrders();
            },
            onReconnect: () => {
              console.log(`Reconnected to order ${order.id}, refetching...`);
              fetchOrders();
            },
            onError: (error) => {
              console.error(`Error with order ${order.id} subscription:`, error);
            },
            retryAttempts: 2, // Reduced to prevent loops
            retryDelay: 3000
          });

          await realtimeManager.subscribe({
            channelName: itemsChannelName,
            table: 'order_items',
            filter: `order_id=eq.${order.id}`,
            onMessage: () => {
              console.log(`Order items for ${order.id} changed, refetching...`);
              fetchOrders();
            },
            onReconnect: () => {
              console.log(`Reconnected to order items ${order.id}, refetching...`);
              fetchOrders();
            },
            onError: (error) => {
              console.error(`Error with order items ${order.id} subscription:`, error);
            },
            retryAttempts: 2,
            retryDelay: 3000
          });

          subscriptions.push(ordersChannelName, itemsChannelName);
        } catch (error) {
          console.error(`Failed to subscribe to order ${order.id}:`, error);
        }
      }
    };

    if (currentOrders.length > 0) {
      setupRealtimeForOrders();
    }

    return () => {
      // Clean up all subscriptions
      subscriptions.forEach(async (channelName) => {
        try {
          await realtimeManager.unsubscribe(channelName);
        } catch (error) {
          console.log(`Cleanup error for ${channelName}:`, error);
        }
      });
    };
  }, [user?.id]); // Only depend on user.id to prevent excessive re-subscriptions

  return {
    availableOrders,
    activeOrders,
    deliveryQueue,
    loading,
    error,
    refetchOrders
  };
};