import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  order_id: string;
  notification_type: string;
  recipient_type: string;
  recipient_identifier: string;
  channel: string;
  status: string;
  message_content: string | null;
  created_at: string;
  read_at?: string | null;
  metadata?: any;
  order?: {
    customer_name: string;
    property_address: string;
    status: string;
  };
}

interface UseNotificationsOptions {
  userRole?: string;
  userId?: string;
  autoMarkAsRead?: boolean;
}

export function useNotifications({ userRole, userId, autoMarkAsRead = false }: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch notifications based on user role and ID
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('order_notifications')
        .select(`
          *,
          orders:order_id (
            customer_name,
            property_address,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter based on user role or ID
      if (userRole) {
        query = query.eq('recipient_type', userRole);
      }
      
      if (userId) {
        query = query.eq('recipient_identifier', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const notificationsWithOrder: Notification[] = data?.map(notification => ({
        id: notification.id,
        order_id: notification.order_id,
        notification_type: notification.notification_type,
        recipient_type: notification.recipient_type,
        recipient_identifier: notification.recipient_identifier,
        channel: notification.channel,
        status: notification.status,
        message_content: notification.message_content,
        created_at: notification.created_at,
        read_at: notification.delivered_at,
        metadata: notification.metadata,
        order: Array.isArray(notification.orders) ? notification.orders[0] : notification.orders
      })) || [];

      setNotifications(notificationsWithOrder);
      
      // Count unread notifications
      const unread = notificationsWithOrder.filter(n => !n.read_at).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userRole, userId, toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ delivered_at: new Date().toISOString() }) // Use delivered_at as read indicator
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read_at)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('order_notifications')
        .update({ delivered_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      
      setUnreadCount(0);

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications]);

  // Show toast notification for new notifications
  const showToastNotification = useCallback((notification: Notification) => {
    const title = getNotificationTitle(notification.notification_type);
    const description = notification.message_content || '';
    
    toast({
      title,
      description,
    });
  }, [toast]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_notifications',
          filter: userRole ? `recipient_type=eq.${userRole}` : undefined
        },
        async (payload) => {
          console.log('New notification received:', payload);
          
          // Fetch full notification with order details
          const { data: fullNotification } = await supabase
            .from('order_notifications')
            .select(`
              *,
              orders:order_id (
                customer_name,
                property_address,
                status
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (fullNotification) {
            const notificationWithOrder: Notification = {
              id: fullNotification.id,
              order_id: fullNotification.order_id,
              notification_type: fullNotification.notification_type,
              recipient_type: fullNotification.recipient_type,
              recipient_identifier: fullNotification.recipient_identifier,
              channel: fullNotification.channel,
              status: fullNotification.status,
              message_content: fullNotification.message_content,
              created_at: fullNotification.created_at,
              read_at: fullNotification.delivered_at,
              metadata: fullNotification.metadata,
              order: Array.isArray(fullNotification.orders) 
                ? fullNotification.orders[0] 
                : fullNotification.orders
            };

            setNotifications(prev => [notificationWithOrder, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast if not auto-marking as read
            if (!autoMarkAsRead) {
              showToastNotification(notificationWithOrder);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, userId, autoMarkAsRead, showToastNotification]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}

// Helper function to get notification title
function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    'order_confirmed': 'Order Confirmed',
    'order_assigned': 'New Assignment',
    'shopping_started': 'Shopping Started',
    'shopping_complete': 'Shopping Complete',
    'out_for_delivery': 'Out for Delivery',
    'delivery_complete': 'Delivery Complete',
    'stocking_started': 'Stocking Started',
    'stocking_complete': 'Order Complete',
    'delay_notification': 'Delay Update',
    'substitution_request': 'Substitution Request',
    'escalation': 'Attention Required'
  };
  
  return titles[type] || 'Notification';
}