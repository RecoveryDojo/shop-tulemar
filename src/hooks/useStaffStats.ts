import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaffMember {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  ordersCompleted: number;
  rating: number;
  responseTime: string;
  roles: string[];
}

export function useStaffStats() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaffStats() {
      try {
        // Get all profiles
        const { data: staffProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url');

        if (!staffProfiles) {
          setStaffMembers([]);
          return;
        }

        // Get user roles separately
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['shopper', 'driver', 'store_manager']);

        // Filter to only include staff with relevant roles
        const staffWithRoles = staffProfiles.filter(profile => 
          userRoles?.some(ur => ur.user_id === profile.id)
        );

        // Get assignment stats for each staff member
        const staffWithStats = await Promise.all(
          staffWithRoles.map(async (staff) => {
            const { data: assignments } = await supabase
              .from('stakeholder_assignments')
              .select(`
                *,
                orders (id, created_at)
              `)
              .eq('user_id', staff.id)
              .eq('status', 'completed');

            // Calculate average response time
            const acceptedAssignments = await supabase
              .from('stakeholder_assignments')
              .select('assigned_at, accepted_at')
              .eq('user_id', staff.id)
              .not('accepted_at', 'is', null);

            let avgResponseTime = 'N/A';
            if (acceptedAssignments.data && acceptedAssignments.data.length > 0) {
              const totalMinutes = acceptedAssignments.data.reduce((sum, a) => {
                const assigned = new Date(a.assigned_at);
                const accepted = new Date(a.accepted_at);
                return sum + (accepted.getTime() - assigned.getTime()) / (1000 * 60);
              }, 0);
              const averageMinutes = Math.round(totalMinutes / acceptedAssignments.data.length);
              avgResponseTime = `${averageMinutes}m`;
            }

            const staffRoles = userRoles?.filter(ur => ur.user_id === staff.id).map(ur => ur.role) || [];

            return {
              id: staff.id,
              display_name: staff.display_name || 'Unknown',
              email: staff.email || '',
              avatar_url: staff.avatar_url,
              ordersCompleted: assignments?.length || 0,
              rating: 0, // TODO: Implement when feedback system is added
              responseTime: avgResponseTime,
              roles: staffRoles,
            };
          })
        );

        setStaffMembers(staffWithStats);
      } catch (error) {
        console.error('Error fetching staff stats:', error);
        setStaffMembers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStaffStats();
  }, []);

  return { staffMembers, loading };
}