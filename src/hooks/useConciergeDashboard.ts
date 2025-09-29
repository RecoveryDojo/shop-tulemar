import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { orderEventBus } from '@/lib/orderEventBus';
import { useEnhancedOrderWorkflow } from '@/hooks/useEnhancedOrderWorkflow';
import type { OrderStatus } from '@/hooks/useEnhancedOrderWorkflow';

export interface ConciergeOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  property_address: string;
  total_amount: number;
  status: string;
  arrival_date?: string;
  departure_date?: string;
  guest_count?: number;
  dietary_restrictions?: any;
  special_instructions?: string;
}

export const useConciergeDashboard = () => {
  const [conciergeQueue, setConciergeQueue] = useState<ConciergeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const { toast } = useToast();
  const { advanceStatus } = useEnhancedOrderWorkflow();

  const fetchConciergeOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Accept both canonical (READY, DELIVERED) and legacy (ready, delivered)
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('id, customer_name, customer_email, property_address, total_amount, status, arrival_date, departure_date, guest_count, assigned_concierge_id')
        .in('status', ['READY', 'ready', 'DELIVERED', 'delivered']);

      if (fetchError) throw fetchError;

      setConciergeQueue((data as unknown as ConciergeOrder[]) ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      setConciergeQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConciergeOrders();
  }, []);

  const arrivedProperty = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'arrived_property' })
        .eq('id', orderId);

      if (error) throw error;

      // Publish event
      orderEventBus.publish({
        order_id: orderId,
        event_type: 'ARRIVED_PROPERTY',
        actor_role: 'concierge',
        data: { status: 'arrived_property' }
      });

      toast({
        title: "Arrived at Property",
        description: "Marked as arrived at property",
      });

      fetchConciergeOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update arrival status",
        variant: "destructive",
      });
    }
  };

  const startStocking = async (orderId: string) => {
    if (isProcessing || processingAction === 'startStocking') return;
    
    setIsProcessing(true);
    setProcessingAction('startStocking');
    
    try {
      const order = conciergeQueue.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');
      
      // Only advance if not already DELIVERED
      if (order.status !== 'delivered') {
        await advanceStatus({ 
          orderId, 
          to: 'DELIVERED', 
          expectedStatus: order.status.toUpperCase() as OrderStatus 
        });
      }

      // Insert order_events row
      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          event_type: 'STOCKING_STARTED',
          actor_role: 'concierge',
          data: { status: 'delivered' }
        });

      if (eventError) throw eventError;

      // Publish event
      orderEventBus.publish({
        order_id: orderId,
        event_type: 'STOCKING_STARTED',
        actor_role: 'concierge',
        data: { status: 'delivered' }
      });

      toast({
        title: "Stocking Started",
        description: "Kitchen preparation protocol initiated",
      });

      fetchConciergeOrders();
    } catch (error: any) {
      console.error('[useConciergeDashboard] startStocking error:', error);
      if (error.message?.includes('STALE_WRITE')) {
        toast({ title: "Order Changed", description: "Order changed in the background. Refreshing…", variant: "destructive" });
      } else if (error.message?.includes('ILLEGAL_TRANSITION')) {
        toast({ title: "Invalid Action", description: "That step isn't allowed from the current status.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || 'Failed to start stocking', variant: "destructive" });
      }
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const completeStocking = async (orderId: string) => {
    if (isProcessing || processingAction === 'completeStocking') return;
    
    setIsProcessing(true);
    setProcessingAction('completeStocking');
    
    try {
      const order = conciergeQueue.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');
      
      await advanceStatus({ 
        orderId, 
        to: 'CLOSED', 
        expectedStatus: 'DELIVERED' 
      });

      // Insert order_events row
      const { error: eventError } = await supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          event_type: 'STOCKED_IN_UNIT',
          actor_role: 'concierge',
          data: { status: 'closed' }
        });

      if (eventError) throw eventError;

      // Publish event
      orderEventBus.publish({
        order_id: orderId,
        event_type: 'STOCKED_IN_UNIT',
        actor_role: 'concierge',
        data: { status: 'closed' }
      });

      toast({
        title: "Stocking Complete",  
        description: "Unit is now guest-ready",
      });

      fetchConciergeOrders();
    } catch (error: any) {
      console.error('[useConciergeDashboard] completeStocking error:', error);
      if (error.message?.includes('STALE_WRITE')) {
        toast({ title: "Order Changed", description: "Order changed in the background. Refreshing…", variant: "destructive" });
      } else if (error.message?.includes('ILLEGAL_TRANSITION')) {
        toast({ title: "Invalid Action", description: "That step isn't allowed from the current status.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || 'Failed to complete stocking', variant: "destructive" });
      }
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  return {
    conciergeQueue,
    loading,
    error,
    isProcessing,
    processingAction,
    refetchOrders: fetchConciergeOrders,
    arrivedProperty,
    startStocking,
    completeStocking
  };
};