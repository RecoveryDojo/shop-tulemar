import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
  orderId?: string;
}

export function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchTeamMembers = async () => {
      try {
        // Get all orders where the current user is assigned as a stakeholder
        const { data: userAssignments, error: assignmentsError } = await supabase
          .from('stakeholder_assignments')
          .select('order_id, role')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (assignmentsError) {
          console.error('Error fetching user assignments:', assignmentsError);
          return;
        }

        if (!userAssignments || userAssignments.length === 0) {
          setTeamMembers([]);
          return;
        }

        const orderIds = userAssignments.map(assignment => assignment.order_id);

        // Get all stakeholders for those orders
        const { data: teamAssignments, error: teamError } = await supabase
          .from('stakeholder_assignments')
          .select(`
            user_id,
            role,
            order_id
          `)
          .in('order_id', orderIds)
          .eq('status', 'accepted')
          .neq('user_id', user.id); // Exclude current user

        if (teamError) {
          console.error('Error fetching team assignments:', teamError);
          return;
        }

        // Get profile data separately for each user
        const userIds = [...new Set(teamAssignments?.map(a => a.user_id) || [])];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, status')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // Create a profile map for easy lookup
        const profileMap = new Map();
        profiles?.forEach(profile => {
          profileMap.set(profile.id, profile);
        });

        // Transform data and remove duplicates
        const uniqueMembers = new Map();
        
        teamAssignments?.forEach((assignment: any) => {
          const profile = profileMap.get(assignment.user_id);
          if (profile && !uniqueMembers.has(assignment.user_id)) {
            uniqueMembers.set(assignment.user_id, {
              id: assignment.user_id,
              name: profile.display_name || 'Team Member',
              role: assignment.role,
              avatar: profile.avatar_url,
              status: profile.status || 'offline',
              lastSeen: profile.status === 'offline' ? '5 min ago' : undefined,
              orderId: assignment.order_id
            });
          }
        });

        setTeamMembers(Array.from(uniqueMembers.values()));
      } catch (error) {
        console.error('Error in fetchTeamMembers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();

    // Set up real-time subscription for stakeholder assignments
    const subscription = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stakeholder_assignments'
        },
        () => {
          fetchTeamMembers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { teamMembers, loading };
}