import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, startOfWeek } from 'date-fns';

interface ShopperStats {
  dailyEarnings: number;
  weeklyEarnings: number;
  ordersCompleted: number;
  customerRating: number;
  efficiencyScore: number;
  findRate: number;
}

export function useShopperStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ShopperStats>({
    dailyEarnings: 0,
    weeklyEarnings: 0,
    ordersCompleted: 0,
    customerRating: 0,
    efficiencyScore: 0,
    findRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      try {
        const today = startOfDay(new Date()).toISOString();
        const weekStart = startOfWeek(new Date()).toISOString();

        // Get completed assignments for this shopper
        const { data: completedAssignments } = await supabase
          .from('stakeholder_assignments')
          .select(`
            *,
            orders (
              id,
              total_amount,
              shopping_completed_at,
              order_items (
                id,
                quantity,
                found_quantity,
                shopping_status
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (!completedAssignments) {
          setStats({
            dailyEarnings: 0,
            weeklyEarnings: 0,
            ordersCompleted: 0,
            customerRating: 0,
            efficiencyScore: 0,
            findRate: 0,
          });
          return;
        }

        // Calculate earnings
        const dailyEarnings = completedAssignments
          .filter(a => a.orders?.shopping_completed_at && a.orders.shopping_completed_at >= today)
          .reduce((sum, a) => sum + (a.orders?.total_amount || 0), 0);

        const weeklyEarnings = completedAssignments
          .filter(a => a.orders?.shopping_completed_at && a.orders.shopping_completed_at >= weekStart)
          .reduce((sum, a) => sum + (a.orders?.total_amount || 0), 0);

        // Calculate find rate
        const allItems = completedAssignments.flatMap(a => a.orders?.order_items || []);
        const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);
        const foundItems = allItems.reduce((sum, item) => sum + (item.found_quantity || 0), 0);
        const findRate = totalItems > 0 ? (foundItems / totalItems) * 100 : 0;

        setStats({
          dailyEarnings,
          weeklyEarnings,
          ordersCompleted: completedAssignments.length,
          customerRating: 0, // TODO: Implement when feedback system is added
          efficiencyScore: 0, // TODO: Calculate based on completion times
          findRate,
        });
      } catch (error) {
        console.error('Error fetching shopper stats:', error);
        setStats({
          dailyEarnings: 0,
          weeklyEarnings: 0,
          ordersCompleted: 0,
          customerRating: 0,
          efficiencyScore: 0,
          findRate: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return { stats, loading };
}