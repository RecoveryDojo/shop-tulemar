import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { orderEventBus } from '@/lib/orderEventBus';

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
  const { toast } = useToast();

  const fetchConciergeOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('id, customer_name, customer_email, property_address, total_amount, status')
        .in('status', ['enroute', 'arrived_property', 'stocking']);

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
      await orderEventBus.publish(orderId, 'ARRIVED_PROPERTY', { status: 'arrived_property' }, { role: 'concierge' });

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
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'stocking' })
        .eq('id', orderId);

      if (error) throw error;

      // Publish event
      await orderEventBus.publish(orderId, 'STOCKING_STARTED', { status: 'stocking' }, { role: 'concierge' });

      toast({
        title: "Stocking Started",
        description: "Kitchen preparation protocol initiated",
      });

      fetchConciergeOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start stocking",
        variant: "destructive",
      });
    }
  };

  const completeStocking = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'stocked_in_unit' })
        .eq('id', orderId);

      if (error) throw error;

      // Publish event
      await orderEventBus.publish(orderId, 'STOCKED_IN_UNIT', { status: 'stocked_in_unit' }, { role: 'concierge' });

      toast({
        title: "Stocking Complete",  
        description: "Unit is now guest-ready",
      });

      fetchConciergeOrders();
    } catch (error) {
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
    refetchOrders: fetchConciergeOrders,
    arrivedProperty,
    startStocking,
    completeStocking
  };
};