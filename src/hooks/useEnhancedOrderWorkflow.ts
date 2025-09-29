import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { orderEventBus } from '@/lib/orderEventBus';

export interface WorkflowError {
  code: string;
  message: string;
  retryable: boolean;
}

export type OrderStatus = 'PLACED' | 'CLAIMED' | 'SHOPPING' | 'READY' | 'DELIVERED' | 'CLOSED' | 'CANCELED';

type Guard = { orderId: string; expectedStatus: OrderStatus };
type ItemPickArgs = Guard & { itemId: string; qtyPicked: number };
type SubSuggestArgs = Guard & { itemId: string; suggestedSku: string };
type SubDecisionArgs = Guard & { itemId: string; decision: 'accept' | 'reject' };
type StatusAdvanceArgs = Guard & { to: OrderStatus };

// Centralized transitions map - single source of truth
const ALLOWED_TRANSITIONS = {
  "PLACED": ["CLAIMED", "CANCELED"],
  "CLAIMED": ["SHOPPING", "CANCELED"], 
  "SHOPPING": ["READY", "CANCELED"],
  "READY": ["DELIVERED", "CANCELED"],
  "DELIVERED": ["CLOSED"],
  "CLOSED": [],
  "CANCELED": []
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
        const { error } = await supabase
          .from('order_items')
          .update({ qty_picked: qtyPicked, shopping_status: 'found' })
          .eq('id', itemId)
          .eq('order_id', orderId);
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
        const { error } = await supabase
          .from('order_items')
          .update({ 
            substitution_data: { suggested_sku: suggestedSku, status: 'pending' },
            shopping_status: 'substitution_needed'
          })
          .eq('id', itemId)
          .eq('order_id', orderId);
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
        const { error } = await supabase
          .from('order_items')
          .update({ 
            substitution_data: { decision, status: decision === 'accept' ? 'accepted' : 'rejected' },
            shopping_status: decision === 'accept' ? 'substituted' : 'not_available'
          })
          .eq('id', itemId)
          .eq('order_id', orderId);
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
        // Use uppercase canonical statuses - no lowercase conversion
        const { error } = await supabase
          .from('orders')
          .update({ status: to })
          .eq('id', orderId)
          // Allow both uppercase (canonical) and lowercase (legacy) for expectedStatus check
          .or(`status.eq.${expectedStatus},status.eq.${expectedStatus.toLowerCase()}`);
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
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'CLAIMED', // Use canonical uppercase status
            assigned_shopper_id: (global as any).currentUserId || 'current-user'
          })
          .eq('id', orderId)
          .or(`status.eq.${expectedStatus},status.eq.${expectedStatus.toLowerCase()}`);
        if (error) throw error;
      },
      {
        order_id: orderId,
        event_type: 'STATUS_CHANGED',
        actor_role: 'shopper',
        data: { from: expectedStatus, to: 'CLAIMED' }
      },
      "acceptOrder"
    );
  };

  const startShopping = async (orderId: string, expectedStatus: OrderStatus): Promise<void> => {
    assertExpected(expectedStatus);
    
    await executeGuardedMutation(
      async () => {
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'SHOPPING', // Use canonical uppercase status
            shopping_started_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .or(`status.eq.${expectedStatus},status.eq.${expectedStatus.toLowerCase()}`);
        if (error) throw error;
      },
      {
        order_id: orderId,
        event_type: 'STATUS_CHANGED',
        actor_role: 'shopper',
        data: { from: expectedStatus, to: 'SHOPPING' }
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