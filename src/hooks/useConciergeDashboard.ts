import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { orderEventBus, OrderEvent } from '@/lib/orderEventBus';

export interface ConciergeOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  property_address: string;
  arrival_date: string;
  departure_date: string;
  guest_count: number;
  dietary_restrictions: any;
  special_instructions: string;
  total_amount: number;
  status: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
}

export const useConciergeDashboard = () => {
  const [conciergeQueue, setConciergeQueue] = useState<ConciergeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConciergeOrders = useCallback(async () => {
    if (!user) {
      console.log('useConciergeDashboard: No user, skipping fetch');
      return;
    }

    try {
      console.log('useConciergeDashboard: Starting fetch for user:', user.id);
      setLoading(true);

      // Fetch concierge queue - orders in delivery/stocking states assigned to this concierge
      const { data: conciergeQueueData, error: queueError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, unit, category_id)
          )
        `)
        .eq('assigned_concierge_id', user.id)
        .in('status', ['enroute', 'arrived_property', 'stocking']);

      console.log('useConciergeDashboard: Concierge queue query:', { conciergeQueueData, queueError });

      if (queueError) {
        console.log('No concierge queue found:', queueError);
      }

      // Transform the data
      const transformOrders = (orders: any[]): ConciergeOrder[] => {
        return orders.map(order => ({
          ...order,
          items: order.order_items?.map((item: any) => ({
            id: item.id,
            product_name: item.products?.name || 'Unknown Product',
            quantity: item.quantity,
            unit: item.products?.unit || 'unit',
            category: item.products?.category_id || 'other'
          })) || []
        }));
      };

      const transformedQueue = transformOrders(conciergeQueueData || []);

      console.log('useConciergeDashboard: Final transformed data:', {
        queue: transformedQueue.length
      });

      setConciergeQueue(transformedQueue);

    } catch (error: any) {
      console.error('Error fetching concierge orders:', error);
      setError(error.message || 'Failed to fetch orders');
      setConciergeQueue([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refetchOrders = useCallback(() => {
    fetchConciergeOrders();
  }, [fetchConciergeOrders]);

  useEffect(() => {
    fetchConciergeOrders();

    // Only set up realtime if we have a user
    if (!user) return;

    // Set up per-order event bus subscriptions for concierge's orders
    const currentOrders = [...conciergeQueue];
    const cleanupFunctions: (() => Promise<void>)[] = [];

    const setupOrderSubscriptions = async () => {
      for (const order of currentOrders) {
        try {
          const handleOrderEvent = (event: OrderEvent) => {
            console.log(`[useConciergeDashboard] Received event for order ${order.id}:`, event.event_type);
            
            // Handle different event types
            if (event.event_type === 'snapshot_reconciled') {
              // Reconcile with canonical data on reconnect
              console.log(`[useConciergeDashboard] Reconciling order ${order.id}`);
              fetchConciergeOrders();
            } else if (
              event.event_type === 'order_updated' || 
              event.event_type === 'items_updated' ||
              event.event_type.includes('status_changed') ||
              ['ARRIVED_PROPERTY', 'STOCKING_STARTED', 'STOCKED_IN_UNIT'].includes(event.event_type)
            ) {
              // Refetch on any data changes
              console.log(`[useConciergeDashboard] Order ${order.id} data changed, refetching...`);
              fetchConciergeOrders();
            }
          };

          await orderEventBus.subscribe(order.id, handleOrderEvent);
          
          // Add cleanup function
          cleanupFunctions.push(async () => {
            try {
              await orderEventBus.unsubscribe(order.id, handleOrderEvent);
            } catch (error) {
              console.error(`[useConciergeDashboard] Cleanup error for order ${order.id}:`, error);
            }
          });
        } catch (error) {
          console.error(`[useConciergeDashboard] Failed to subscribe to order ${order.id}:`, error);
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
          console.error('[useConciergeDashboard] Cleanup error:', error);
        }
      });
    };
  }, [user?.id]); // Only depend on user.id to prevent excessive re-subscriptions

  const arrivedProperty = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'arrived_property' })
        .eq('id', orderId);

      if (error) throw error;

      // Publish event
      await orderEventBus.publish(orderId, 'ARRIVED_PROPERTY', {
        timestamp: new Date().toISOString(),
        concierge_id: user?.id
      }, {
        id: user?.id,
        role: 'concierge'
      });

      toast({
        title: "Arrived at Property",
        description: "Marked as arrived at property",
      });

      refetchOrders();
    } catch (error) {
      console.error('Error marking arrived:', error);
      toast({
        title: "Error",
        description: "Failed to update arrival status",
        variant: "destructive",
      });
    }
  };

  const startStocking = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'stocking' })
        .eq('id', orderId);

      if (error) throw error;

      // Publish event
      await orderEventBus.publish(orderId, 'STOCKING_STARTED', {
        timestamp: new Date().toISOString(),
        concierge_id: user?.id
      }, {
        id: user?.id,
        role: 'concierge'
      });

      toast({
        title: "Stocking Started",
        description: "Kitchen preparation protocol initiated",
      });

      refetchOrders();
    } catch (error) {
      console.error('Error starting stocking:', error);
      toast({
        title: "Error",
        description: "Failed to start stocking",
        variant: "destructive",
      });
    }
  };

  const completeStocking = async (orderId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'stocked_in_unit' })
        .eq('id', orderId);

      if (error) throw error;

      // Publish event
      await orderEventBus.publish(orderId, 'STOCKED_IN_UNIT', {
        timestamp: new Date().toISOString(),
        concierge_id: user?.id,
        completion_notes: notes
      }, {
        id: user?.id,
        role: 'concierge'
      });

      toast({
        title: "Stocking Complete",
        description: "Unit is now guest-ready",
      });

      refetchOrders();
    } catch (error) {
      console.error('Error completing stocking:', error);
      toast({
        title: "Error",
        description: "Failed to complete stocking",
        variant: "destructive",
      });
    }
  };

  return {
    conciergeQueue,
    loading,
    error,
    refetchOrders,
    arrivedProperty,
    startStocking,
    completeStocking
  };
};