import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { orderEventBus } from '@/lib/orderEventBus';

export interface WorkflowError {
  code: string;
  message: string;
  retryable: boolean;
}

export type OrderStatus = 'placed' | 'claimed' | 'shopping' | 'ready' | 'delivered' | 'closed' | 'canceled';

type Guard = { orderId: string; expectedStatus: OrderStatus };
type ItemPickArgs = Guard & { itemId: string; qtyPicked: number };
type SubSuggestArgs = Guard & { itemId: string; suggestedSku: string };
type SubDecisionArgs = Guard & { itemId: string; decision: 'accept' | 'reject' };
type StatusAdvanceArgs = Guard & { to: OrderStatus };

// Centralized transitions map - single source of truth (lowercase)
const ALLOWED_TRANSITIONS = {
  "placed": ["claimed", "canceled"],
  "claimed": ["shopping", "canceled"], 
  "shopping": ["ready", "canceled"],
  "ready": ["delivered", "canceled"],
  "delivered": ["closed"],
  "closed": [],
  "canceled": []
};

export const useEnhancedOrderWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<WorkflowError | null>(null);
  const { toast } = useToast();

  // Helper functions
  const assertExpected = (expectedStatus?: OrderStatus): expectedStatus is OrderStatus => {
    if (!expectedStatus) throw new Error("expectedStatus is required");
    return true;
  };

  const mapError = (error: any): string => {
    const code = error?.message?.split(':')[0] || error?.code;
    if (code === "STALE_WRITE") return "Order changed in the background. Refreshing…";
    if (code === "ILLEGAL_TRANSITION") return "That step isn't allowed from the current status.";
    return "Something went wrong. Please try again.";
  };

  const executeGuardedMutation = async (
    fn: () => Promise<any>,
    successEvent: any,
    successMessage: string
  ) => {
    setLoading(true);
    setLastError(null);
    try {
      const result = await fn();
      
      toast({ title: `OK: ${successMessage}` });
      orderEventBus.publish(successEvent);
      
      return result;
    } catch (error: any) {
      const mappedMessage = mapError(error);
      toast({ 
        title: `ERROR: ${successMessage}`, 
        description: mappedMessage, 
        variant: "destructive" 
      });
      setLastError({
        code: error?.code || 'UNKNOWN',
        message: mappedMessage,
        retryable: error?.code === 'STALE_WRITE'
      });
      throw new Error(mappedMessage);
    } finally {
      setLoading(false);
    }
  };

  const pickItem = async ({ orderId, itemId, qtyPicked, expectedStatus }: ItemPickArgs): Promise<void> => {
    assertExpected(expectedStatus);
    
    await executeGuardedMutation(
      async () => {
        const { data, error } = await supabase.rpc('rpc_pick_item', {
          p_order_id: orderId,
          p_item_id: itemId,
          p_qty_picked: qtyPicked,
          p_expected_status: expectedStatus,
          p_actor_role: 'shopper'
        });
        if (error) throw error;
      },
      {
        order_id: orderId,
        event_type: 'ITEM_PICKED',
        actor_role: 'shopper',
        data: { item_id: itemId, qty_picked: qtyPicked }
      },
      "pickItem"
    );
  };

  const suggestSub = async ({ orderId, itemId, suggestedSku, expectedStatus }: SubSuggestArgs): Promise<void> => {
    assertExpected(expectedStatus);
    
    await executeGuardedMutation(
      async () => {
        const { data, error } = await supabase.rpc('rpc_suggest_sub', {
          p_order_id: orderId,
          p_item_id: itemId,
          p_suggested_sku: suggestedSku,
          p_expected_status: expectedStatus,
          p_actor_role: 'shopper'
        });
        if (error) throw error;
      },
      {
        order_id: orderId,
        event_type: 'SUBSTITUTION_SUGGESTED',
        actor_role: 'shopper',
        data: { item_id: itemId, suggested_sku: suggestedSku }
      },
      "suggestSub"
    );
  };

  const decideSub = async ({ orderId, itemId, decision, expectedStatus }: SubDecisionArgs): Promise<void> => {
    assertExpected(expectedStatus);
    
    await executeGuardedMutation(
      async () => {
        const { data, error } = await supabase.rpc('rpc_decide_sub', {
          p_order_id: orderId,
          p_item_id: itemId,
          p_decision: decision,
          p_expected_status: expectedStatus,
          p_actor_role: 'customer'
        });
        if (error) throw error;
      },
      {
        order_id: orderId,
        event_type: 'SUBSTITUTION_DECISION',
        actor_role: 'customer',
        data: { item_id: itemId, decision }
      },
      "decideSub"
    );
  };

  const advanceStatus = async ({ orderId, to, expectedStatus }: StatusAdvanceArgs): Promise<void> => {
    assertExpected(expectedStatus);
    
    // Validate transition
    if (!ALLOWED_TRANSITIONS[expectedStatus]?.includes(to)) {
      throw new Error("ILLEGAL_TRANSITION");
    }
    
    await executeGuardedMutation(
      async () => {
        const { data, error } = await supabase.rpc('rpc_advance_status', {
          p_order_id: orderId,
          p_to: to,
          p_expected_status: expectedStatus,
          p_actor_role: 'shopper'
        });
        if (error) throw error;
      },
      {
        order_id: orderId,
        event_type: 'STATUS_CHANGED',
        actor_role: 'shopper',
        data: { from: expectedStatus, to }
      },
      "advanceStatus"
    );
  };

  const acceptOrder = async (orderId: string, expectedStatus: OrderStatus): Promise<void> => {
    assertExpected(expectedStatus);
    
    await executeGuardedMutation(
      async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase.rpc('rpc_assign_shopper', {
          p_order_id: orderId,
          p_shopper_id: user.id,
          p_expected_status: expectedStatus,
          p_actor_role: 'shopper'
        });
        if (error) throw error;
      },
      {
        order_id: orderId,
        event_type: 'STATUS_CHANGED',
        actor_role: 'shopper',
        data: { from: expectedStatus, to: 'claimed' }
      },
      "acceptOrder"
    );
  };

  const startShopping = async (orderId: string, expectedStatus: OrderStatus): Promise<void> => {
    assertExpected(expectedStatus);
    
    await executeGuardedMutation(
      async () => {
        const { data, error } = await supabase.rpc('rpc_advance_status', {
          p_order_id: orderId,
          p_to: 'shopping',
          p_expected_status: expectedStatus,
          p_actor_role: 'shopper'
        });
        if (error) throw error;
      },
      {
        order_id: orderId,
        event_type: 'STATUS_CHANGED',
        actor_role: 'shopper',
        data: { from: expectedStatus, to: 'shopping' }
      },
      "startShopping"
    );
  };

  return {
    loading,
    lastError,
    pickItem,
    suggestSub,
    decideSub,
    advanceStatus,
    acceptOrder,
    startShopping
  };
};