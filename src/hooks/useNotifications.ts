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
      
      // For now, use sample data since the database might not have notifications yet
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          order_id: 'order-123',
          notification_type: 'order_assigned',
          recipient_type: 'shopper',
          recipient_identifier: 'shopper-1',
          channel: 'in-app',
          status: 'sent',
          message_content: 'New shopping order assigned to you - Grocery shopping for Jane Smith',
          created_at: new Date().toISOString(),
          read_at: null,
          metadata: {},
          order: {
            customer_name: 'Jane Smith',
            property_address: '123 Oak Street',
            status: 'assigned'
          }
        },
        {
          id: '2',
          order_id: 'order-124',
          notification_type: 'shopping_started',
          recipient_type: 'shopper',
          recipient_identifier: 'shopper-1',
          channel: 'in-app',
          status: 'sent',
          message_content: 'Shopping started for order #124 - Remember to check for substitutions',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read_at: new Date().toISOString(),
          metadata: {},
          order: {
            customer_name: 'Bob Johnson',
            property_address: '456 Pine Avenue',
            status: 'shopping'
          }
        },
        {
          id: '3',
          order_id: 'order-125',
          notification_type: 'substitution_request',
          recipient_type: 'shopper',
          recipient_identifier: 'shopper-1',
          channel: 'in-app',
          status: 'sent',
          message_content: 'Customer requested substitution approval for organic bananas',
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          read_at: null,
          metadata: {},
          order: {
            customer_name: 'Alice Brown',
            property_address: '789 Maple Drive',
            status: 'shopping'
          }
        }
      ];

      // Filter by user role if specified
      const filteredNotifications = userRole 
        ? sampleNotifications.filter(n => n.recipient_type === userRole)
        : sampleNotifications;

      setNotifications(filteredNotifications);
      
      // Count unread notifications
      const unread = filteredNotifications.filter(n => !n.read_at).length;
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