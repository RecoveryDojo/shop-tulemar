import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  const fetchOrders = useCallback(async () => {
    if (!user) {
      console.log('useShopperOrders: No user, skipping fetch');
      return;
    }

    try {
      console.log('useShopperOrders: Starting fetch for user:', user.id);
      setLoading(true);

      // Fetch shopper queue - orders assigned to this shopper
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
        .in('status', ['claimed', 'shopping', 'ready']);

      // Fetch available orders (placed, not assigned)
      const { data: available, error: availableError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description, image_url, unit, price)
          )
        `)
        .eq('status', 'placed')
        .is('assigned_shopper_id', null);

      if (queueError) {
        console.log('No shopper queue found:', queueError);
      }
      if (availableError) {
        console.log('No available orders found:', availableError);
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

      setShopperQueue(transformedQueue);
      setAvailableOrders(transformedAvailable);

    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
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

    if (!user) return;

    // Scoped realtime subscription - only orders assigned to this shopper
    const channel = supabase
      .channel('shopper-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `assigned_shopper_id=eq.${user.id}`
      }, (payload) => {
        console.log('[useShopperOrders] Order change detected:', payload);
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOrders]);

  return {
    shopperQueue,
    availableOrders,
    loading,
    error,
    refetchOrders
  };
};
