import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowError {
  code: string;
  message: string;
  retryable: boolean;
}

export const useEnhancedOrderWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<WorkflowError | null>(null);
  const { toast } = useToast();

  const executeWorkflowAction = async (
    action: string, 
    orderId: string, 
    itemId?: string, 
    data?: any,
    expectedCurrentStatus?: string
  ) => {
    setLoading(true);
    setLastError(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('enhanced-order-workflow', {
        body: { 
          action, 
          orderId, 
          itemId, 
          data,
          expectedCurrentStatus 
        }
      });

      if (error) {
        const workflowError: WorkflowError = {
          code: 'WORKFLOW_ERROR',
          message: error.message || 'Unknown workflow error',
          retryable: error.message?.includes('status has changed') || false
        };
        setLastError(workflowError);
        throw error;
      }

      toast({
        title: "Success",
        description: result.message,
      });

      return result;
    } catch (error: any) {
      console.error(`Error executing ${action}:`, error);
      
      const errorMessage = error.message || `Failed to ${action.replace('_', ' ')}`;
      
      // Check if it's a status inconsistency error
      if (errorMessage.includes('status has changed') || errorMessage.includes('Invalid status transition')) {
        toast({
          title: "Status Conflict",
          description: "The order status has changed. Please refresh and try again.",
          variant: "destructive",
        });
        
        setLastError({
          code: 'STATUS_CONFLICT',
          message: errorMessage,
          retryable: true
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        setLastError({
          code: 'GENERAL_ERROR',
          message: errorMessage,
          retryable: false
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = (orderId: string, currentStatus = 'pending') => 
    executeWorkflowAction('confirm_order', orderId, undefined, undefined, currentStatus);

  const acceptOrder = (orderId: string, currentStatus = 'confirmed') => 
    executeWorkflowAction('accept_order', orderId, undefined, undefined, currentStatus);

  const startShopping = (orderId: string, currentStatus = 'assigned') => 
    executeWorkflowAction('start_shopping', orderId, undefined, undefined, currentStatus);

  const markItemFound = (itemId: string, foundQuantity: number, notes?: string, photoUrl?: string) =>
    executeWorkflowAction('mark_item_found', '', itemId, { foundQuantity, notes, photoUrl });

  const requestSubstitution = (itemId: string, reason: string, suggestedProduct?: string, notes?: string) =>
    executeWorkflowAction('request_substitution', '', itemId, { reason, suggestedProduct, notes });

  const completeShopping = (orderId: string, currentStatus = 'shopping') =>
    executeWorkflowAction('complete_shopping', orderId, undefined, undefined, currentStatus);

  const startDelivery = (orderId: string, currentStatus = 'packed') =>
    executeWorkflowAction('start_delivery', orderId, undefined, undefined, currentStatus);

  const completeDelivery = (orderId: string, currentStatus = 'in_transit') =>
    executeWorkflowAction('complete_delivery', orderId, undefined, undefined, currentStatus);

  const rollbackStatus = (orderId: string, targetStatus: string) =>
    executeWorkflowAction('rollback_status', orderId, undefined, { targetStatus });

  const clearError = () => {
    setLastError(null);
  };

  return {
    loading,
    lastError,
    confirmOrder,
    acceptOrder,
    startShopping,
    markItemFound,
    requestSubstitution,
    completeShopping,
    startDelivery,
    completeDelivery,
    rollbackStatus,
    clearError
  };
};