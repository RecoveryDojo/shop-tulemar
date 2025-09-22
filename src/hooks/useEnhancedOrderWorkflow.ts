import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowError {
  code: string;
  message: string;
  retryable: boolean;
}

// Centralized transitions map - single source of truth
const ALLOWED_TRANSITIONS = {
  "pending": ["confirmed", "cancelled"],
  "confirmed": ["assigned", "cancelled"], 
  "assigned": ["shopping", "cancelled"],
  "shopping": ["packed", "cancelled"],
  "packed": ["in_transit", "cancelled"],
  "in_transit": ["delivered", "cancelled"],
  "delivered": [],
  "cancelled": []
};

export interface WorkflowOptions {
  optimistic?: boolean;
  requireExpectedStatus?: boolean;
}

export const useEnhancedOrderWorkflow = (options: WorkflowOptions = {}) => {
  const { optimistic = false, requireExpectedStatus = true } = options;
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<WorkflowError | null>(null);
  const { toast } = useToast();

  const executeWorkflowAction = async (
    orderId: string,
    targetStatus: string,
    expectedCurrentStatus: string,
    actor?: { id?: string; role?: string },
    data?: any,
    itemId?: string
  ) => {
    setLoading(true);
    setLastError(null);

    // Validate transition using centralized map
    if (requireExpectedStatus && !ALLOWED_TRANSITIONS[expectedCurrentStatus]?.includes(targetStatus)) {
      const error = new Error(`ILLEGAL_TRANSITION: Cannot transition from ${expectedCurrentStatus} to ${targetStatus}`);
      setLastError({
        code: 'ILLEGAL_TRANSITION',
        message: error.message,
        retryable: false
      });
      throw error;
    }

    try {
      const { data: result, error } = await supabase.functions.invoke('enhanced-order-workflow', {
        body: { 
          orderId,
          to: targetStatus,
          expectedStatus: expectedCurrentStatus,
          actor: {
            id: actor?.id || 'current_user',
            role: actor?.role || 'shopper'
          },
          data,
          itemId,
          optimistic
        }
      });

      if (error) {
        const errorCode = error.message?.split(':')[0] || 'UNKNOWN_ERROR';
        const workflowError: WorkflowError = {
          code: errorCode,
          message: error.message || 'Unknown workflow error',
          retryable: errorCode === 'STALE_WRITE'
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
      console.error(`Error executing workflow action:`, error);
      
      const errorMessage = error.message || 'Failed to execute workflow action';
      const errorCode = errorMessage.split(':')[0];
      
      // Handle specific error types
      if (errorCode === 'STALE_WRITE') {
        toast({
          title: "Status Conflict",
          description: "The order status has changed. Please refresh and try again.",
          variant: "destructive",
        });
        
        setLastError({
          code: 'STALE_WRITE',
          message: errorMessage,
          retryable: true
        });
      } else if (errorCode === 'ILLEGAL_TRANSITION') {
        toast({
          title: "Invalid Transition",
          description: "This status change is not allowed.",
          variant: "destructive",
        });
        
        setLastError({
          code: 'ILLEGAL_TRANSITION', 
          message: errorMessage,
          retryable: false
        });
      } else if (errorCode === 'UNAUTHORIZED') {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to perform this action.",
          variant: "destructive",
        });
        
        setLastError({
          code: 'UNAUTHORIZED',
          message: errorMessage,
          retryable: false
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
    executeWorkflowAction(orderId, 'confirmed', currentStatus);

  const acceptOrder = (orderId: string, currentStatus = 'confirmed') => 
    executeWorkflowAction(orderId, 'assigned', currentStatus);

  const startShopping = (orderId: string, currentStatus = 'assigned') => 
    executeWorkflowAction(orderId, 'shopping', currentStatus);

  const markItemFound = (itemId: string, foundQuantity: number, notes?: string, photoUrl?: string) => {
    if (requireExpectedStatus) {
      throw new Error('ILLEGAL_TRANSITION: Item operations require expectedStatus parameter');
    }
    // Item updates - no client timestamps, let DB handle them
    const data = { foundQuantity, notes, photoUrl };
    return supabase.functions.invoke('enhanced-order-workflow', {
      body: { action: 'mark_item_found', itemId, data }
    }).then(({ data: result, error }) => {
      if (error) throw error;
      toast({ title: "Item Found", description: "Item marked as found successfully" });
      return result;
    });
  };

  const requestSubstitution = (itemId: string, reason: string, suggestedProduct?: string, notes?: string) => {
    if (requireExpectedStatus) {
      throw new Error('ILLEGAL_TRANSITION: Item operations require expectedStatus parameter');
    }
    // Item updates - no client timestamps, let DB handle them
    const data = { reason, suggestedProduct, notes };
    return supabase.functions.invoke('enhanced-order-workflow', {
      body: { action: 'request_substitution', itemId, data }
    }).then(({ data: result, error }) => {
      if (error) throw error;
      toast({ title: "Substitution Requested", description: "Substitution request sent successfully" });
      return result;
    });
  };

  const completeShopping = (orderId: string, currentStatus = 'shopping') =>
    executeWorkflowAction(orderId, 'packed', currentStatus);

  const startDelivery = (orderId: string, currentStatus = 'packed') =>
    executeWorkflowAction(orderId, 'in_transit', currentStatus);

  const completeDelivery = (orderId: string, currentStatus = 'in_transit') =>
    executeWorkflowAction(orderId, 'delivered', currentStatus);

  const rollbackStatus = (orderId: string, targetStatus: string) => {
    // Rollback uses legacy API
    const data = { targetStatus };
    return supabase.functions.invoke('enhanced-order-workflow', {
      body: { action: 'rollback_status', orderId, data }
    }).then(({ data: result, error }) => {
      if (error) throw error;
      toast({ title: "Status Rolled Back", description: `Order status rolled back to ${targetStatus}` });
      return result;
    });
  };

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