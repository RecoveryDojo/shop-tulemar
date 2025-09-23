import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { orderEventBus } from '@/lib/orderEventBus';

export interface WorkflowError {
  code: string;
  message: string;
  retryable: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'assigned' | 'shopping' | 'packed' | 'in_transit' | 'delivered' | 'cancelled';

type Guard = { orderId: string; expectedStatus: OrderStatus };
type ItemPickArgs = Guard & { itemId: string; qtyPicked: number; notes?: string; photoUrl?: string };
type SubSuggestArgs = Guard & { itemId: string; reason: string; suggestedProduct?: string; notes?: string };
type SubDecisionArgs = Guard & { itemId: string; decision: "accept" | "reject" };
type StatusAdvanceArgs = Guard & { to: OrderStatus };

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

      // Publish event after successful mutation
      await orderEventBus.publish(orderId, `status_changed_to_${targetStatus}`, {
        from: expectedCurrentStatus,
        to: targetStatus,
        result
      }, actor);

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

  const acceptOrder = (orderId: string, expectedStatus: OrderStatus) => {
    assertExpected(expectedStatus);
    return executeWorkflowAction(orderId, 'assigned', expectedStatus);
  };

  const startShopping = (orderId: string, expectedStatus: OrderStatus) => {
    assertExpected(expectedStatus);
    return executeWorkflowAction(orderId, 'shopping', expectedStatus);
  };

  // Helper functions
  const assertExpected = (s?: OrderStatus): s is OrderStatus => {
    if (!s) throw new Error("expectedStatus is required for guarded workflow");
    return true;
  };

  const mapError = (e: any): Error => {
    const code = e?.code || e?.message?.split(':')[0];
    if (code === "STALE_WRITE") return new Error("Order changed in the background. Refreshing…");
    if (code === "ILLEGAL_TRANSITION") return new Error("That step isn't allowed from the current status.");
    return new Error("Something went wrong. Please try again.");
  };

  const pickItem = async ({ orderId, itemId, qtyPicked, expectedStatus, notes, photoUrl }: ItemPickArgs) => {
    assertExpected(expectedStatus);
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('enhanced-order-workflow', {
        body: { action: 'mark_item_found', itemId, data: { foundQuantity: qtyPicked, notes, photoUrl }, expectedStatus }
      });
      if (error) throw mapError(error);
      
      toast({ title: "OK: pickItem", description: "Item marked as found successfully" });
      
      // Publish event after successful mutation
      await orderEventBus.publish(orderId, 'ITEM_PICKED', {
        item_id: itemId,
        found_quantity: qtyPicked,
        notes,
        photo_url: photoUrl
      }, { role: 'shopper' });
      
      return result;
    } catch (error: any) {
      toast({ title: "ERROR: pickItem", description: mapError(error).message, variant: "destructive" });
      throw mapError(error);
    } finally {
      setLoading(false);
    }
  };

  const suggestSub = async ({ orderId, itemId, reason, suggestedProduct, notes, expectedStatus }: SubSuggestArgs) => {
    assertExpected(expectedStatus);
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('enhanced-order-workflow', {
        body: { action: 'request_substitution', itemId, data: { reason, suggestedProduct, notes }, expectedStatus }
      });
      if (error) throw mapError(error);
      
      toast({ title: "OK: suggestSub", description: "Substitution request sent successfully" });
      
      // Publish event after successful mutation
      await orderEventBus.publish(orderId, 'SUBSTITUTION_SUGGESTED', {
        item_id: itemId,
        reason,
        suggested_product: suggestedProduct,
        notes
      }, { role: 'shopper' });
      
      return result;
    } catch (error: any) {
      toast({ title: "ERROR: suggestSub", description: mapError(error).message, variant: "destructive" });
      throw mapError(error);
    } finally {
      setLoading(false);
    }
  };

  const decideSub = async ({ orderId, itemId, decision, expectedStatus }: SubDecisionArgs) => {
    assertExpected(expectedStatus);
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('enhanced-order-workflow', {
        body: { action: 'decide_substitution', itemId, data: { decision }, expectedStatus }
      });
      if (error) throw mapError(error);
      
      toast({ title: "OK: decideSub", description: `Substitution ${decision}ed successfully` });
      
      // Publish event after successful mutation
      await orderEventBus.publish(orderId, 'SUBSTITUTION_DECISION', {
        item_id: itemId,
        decision
      }, { role: 'customer' });
      
      return result;
    } catch (error: any) {
      toast({ title: "ERROR: decideSub", description: mapError(error).message, variant: "destructive" });
      throw mapError(error);
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async ({ orderId, to, expectedStatus }: StatusAdvanceArgs) => {
    assertExpected(expectedStatus);
    return executeWorkflowAction(orderId, to, expectedStatus);
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
    pickItem,
    suggestSub,
    decideSub,
    advanceStatus,
    completeShopping,
    startDelivery,
    completeDelivery,
    rollbackStatus,
    clearError
  };
};