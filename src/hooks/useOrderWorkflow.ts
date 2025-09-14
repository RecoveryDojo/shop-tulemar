import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOrderWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const executeWorkflowAction = async (action: string, orderId: string, itemId?: string, data?: any) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('order-workflow', {
        body: { action, orderId, itemId, data }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: result.message,
      });

      return result;
    } catch (error: any) {
      console.error(`Error executing ${action}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action.replace('_', ' ')}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = (orderId: string) => 
    executeWorkflowAction('accept_order', orderId);

  const startShopping = (orderId: string) => 
    executeWorkflowAction('start_shopping', orderId);

  const markItemFound = (itemId: string, foundQuantity: number, notes?: string, photoUrl?: string) =>
    executeWorkflowAction('mark_item_found', '', itemId, { foundQuantity, notes, photoUrl });

  const requestSubstitution = (itemId: string, reason: string, suggestedProduct?: string, notes?: string) =>
    executeWorkflowAction('request_substitution', '', itemId, { reason, suggestedProduct, notes });

  const completeShopping = (orderId: string) =>
    executeWorkflowAction('complete_shopping', orderId);

  const startDelivery = (orderId: string) =>
    executeWorkflowAction('start_delivery', orderId);

  const completeDelivery = (orderId: string) =>
    executeWorkflowAction('complete_delivery', orderId);

  return {
    loading,
    acceptOrder,
    startShopping,
    markItemFound,
    requestSubstitution,
    completeShopping,
    startDelivery,
    completeDelivery
  };
};