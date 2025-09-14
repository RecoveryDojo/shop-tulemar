import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTeamValidation() {
  const { user } = useAuth();

  const validateTeamMember = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get orders where current user is a stakeholder
      const { data: userOrders, error: userError } = await supabase
        .from('stakeholder_assignments')
        .select('order_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (userError || !userOrders) return false;

      const orderIds = userOrders.map(assignment => assignment.order_id);
      if (orderIds.length === 0) return false;

      // Check if target user is in any of the same orders
      const { data: targetUserOrders, error: targetError } = await supabase
        .from('stakeholder_assignments')
        .select('order_id')
        .eq('user_id', targetUserId)
        .eq('status', 'accepted')
        .in('order_id', orderIds);

      if (targetError) return false;

      return targetUserOrders && targetUserOrders.length > 0;
    } catch (error) {
      console.error('Error validating team member:', error);
      return false;
    }
  }, [user]);

  const getSharedOrders = useCallback(async (targetUserId: string): Promise<string[]> => {
    if (!user) return [];

    try {
      // Get orders where current user is a stakeholder
      const { data: userOrders, error: userError } = await supabase
        .from('stakeholder_assignments')
        .select('order_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (userError || !userOrders) return [];

      const orderIds = userOrders.map(assignment => assignment.order_id);
      if (orderIds.length === 0) return [];

      // Get shared orders with target user
      const { data: sharedOrders, error: sharedError } = await supabase
        .from('stakeholder_assignments')
        .select('order_id')
        .eq('user_id', targetUserId)
        .eq('status', 'accepted')
        .in('order_id', orderIds);

      if (sharedError) return [];

      return sharedOrders.map(assignment => assignment.order_id);
    } catch (error) {
      console.error('Error getting shared orders:', error);
      return [];
    }
  }, [user]);

  return {
    validateTeamMember,
    getSharedOrders
  };
}