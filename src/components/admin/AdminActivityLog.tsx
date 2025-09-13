import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface AdminActivity {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  action: string;
  details: any;
  timestamp: string;
  admin_email?: string;
  target_email?: string;
}

export const AdminActivityLog: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    
    fetchActivities();
  }, [isAdmin]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user emails separately
      const userIds = Array.from(new Set([
        ...data?.map(a => a.admin_user_id) || [],
        ...data?.map(a => a.target_user_id) || []
      ])).filter(Boolean);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const profilesMap = Object.fromEntries(
        profiles?.map(p => [p.id, p.email]) || []
      );

      const formattedActivities = data?.map(activity => ({
        ...activity,
        admin_email: profilesMap[activity.admin_user_id],
        target_email: profilesMap[activity.target_user_id]
      })) || [];

      setActivities(formattedActivities);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch admin activity log",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'role_assigned':
        return 'default';
      case 'role_removed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading activity log...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No admin activities recorded</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(activity.action)}>
                      {activity.action.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {activity.admin_email || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {activity.target_email || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {activity.details?.role && (
                      <span className="text-sm">Role: {activity.details.role}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};