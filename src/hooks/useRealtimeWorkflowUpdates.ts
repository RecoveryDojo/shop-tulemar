import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { realtimeManager } from '@/utils/realtimeConnectionManager';

export interface WorkflowNotification {
  id: string;
  orderId: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface StatusUpdate {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  actorId?: string;
}

export const useRealtimeWorkflowUpdates = () => {
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleOrderStatusChange = useCallback((payload: any) => {
    console.log('Order status change received:', payload);
    
    const { new: newRecord, old: oldRecord } = payload;
    
    if (newRecord && oldRecord && newRecord.status !== oldRecord.status) {
      const statusUpdate: StatusUpdate = {
        orderId: newRecord.id,
        previousStatus: oldRecord.status,
        newStatus: newRecord.status,
        timestamp: new Date().toISOString(),
        actorId: newRecord.assigned_shopper_id
      };
      
      setStatusUpdates(prev => [statusUpdate, ...prev.slice(0, 49)]); // Keep last 50 updates
      
      // Show toast notification for important status changes
      const importantStatuses = ['assigned', 'shopping', 'packed', 'in_transit', 'delivered'];
      if (importantStatuses.includes(newRecord.status)) {
        toast({
          title: "Order Update",
          description: `Order status changed to: ${newRecord.status}`,
        });
      }
    }
  }, [toast]);

  const handleOrderItemChange = useCallback((payload: any) => {
    console.log('Order item change received:', payload);
    
    const { new: newRecord, old: oldRecord } = payload;
    
    if (newRecord && oldRecord && newRecord.shopping_status !== oldRecord.shopping_status) {
      // Trigger refresh of order data
      console.log('Item status changed, triggering refresh');
    }
  }, []);

  const handleNotificationReceived = useCallback((payload: any) => {
    console.log('Notification received:', payload);
    
    const { new: newRecord } = payload;
    
    if (newRecord && user && (
      newRecord.recipient_identifier === user.email || 
      newRecord.recipient_identifier === user.id
    )) {
      const notification: WorkflowNotification = {
        id: newRecord.id,
        orderId: newRecord.order_id,
        type: newRecord.notification_type,
        message: newRecord.message_content,
        timestamp: newRecord.created_at,
        read: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast for new notifications
      toast({
        title: "New Notification",
        description: notification.message,
      });
    }
  }, [user, toast]);

  const handleWorkflowLogChange = useCallback((payload: any) => {
    console.log('Workflow log change received:', payload);
    
    const { new: newRecord } = payload;
    
    if (newRecord) {
      // Update status tracking
      const statusUpdate: StatusUpdate = {
        orderId: newRecord.order_id,
        previousStatus: newRecord.previous_status,
        newStatus: newRecord.new_status,
        timestamp: newRecord.timestamp,
        actorId: newRecord.actor_id
      };
      
      setStatusUpdates(prev => [statusUpdate, ...prev.slice(0, 49)]);
    }
  }, []);

  const setupRealtimeSubscriptions = useCallback(async () => {
    if (!user) {
      setConnectionStatus('disconnected');
      return;
    }

    try {
      setConnectionStatus('reconnecting');
      // Subscribe to order status changes
      await realtimeManager.subscribe({
        channelName: 'workflow-orders',
        table: 'orders',
        event: 'UPDATE',
        onMessage: handleOrderStatusChange,
        onError: (error) => {
          console.warn('Orders subscription error (non-critical):', error);
          // Don't set disconnected for subscription errors - keep trying
        },
        onReconnect: () => {
          console.log('Orders subscription reconnected');
          setConnectionStatus('connected');
        }
      });

      // Subscribe to order items changes
      await realtimeManager.subscribe({
        channelName: 'workflow-order-items',
        table: 'order_items',
        event: 'UPDATE',
        onMessage: handleOrderItemChange,
        onError: (error) => {
          console.warn('Order items subscription error (non-critical):', error);
        },
        onReconnect: () => {
          console.log('Order items subscription reconnected');
        }
      });

      // Subscribe to notifications
      await realtimeManager.subscribe({
        channelName: 'workflow-notifications',
        table: 'order_notifications',
        event: 'INSERT',
        onMessage: handleNotificationReceived,
        onError: (error) => {
          console.warn('Notifications subscription error (non-critical):', error);
        },
        onReconnect: () => {
          console.log('Notifications subscription reconnected');
        }
      });

      // Subscribe to workflow log changes
      await realtimeManager.subscribe({
        channelName: 'workflow-logs',
        table: 'order_workflow_log',
        event: 'INSERT',
        onMessage: handleWorkflowLogChange,
        onError: (error) => {
          console.warn('Workflow logs subscription error (non-critical):', error);
        },
        onReconnect: () => {
          console.log('Workflow logs subscription reconnected');
        }
      });

      setConnectionStatus('connected');
      console.log('All workflow subscriptions established');

    } catch (error) {
      console.warn('Failed to setup realtime subscriptions (non-critical):', error);
      setConnectionStatus('disconnected');
      // Continue without realtime - the app still works with manual refresh
    }
  }, [user, handleOrderStatusChange, handleOrderItemChange, handleNotificationReceived, handleWorkflowLogChange]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('order_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearStatusUpdates = useCallback(() => {
    setStatusUpdates([]);
  }, []);

  useEffect(() => {
    setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions on unmount
      realtimeManager.unsubscribe('workflow-orders');
      realtimeManager.unsubscribe('workflow-order-items');
      realtimeManager.unsubscribe('workflow-notifications');
      realtimeManager.unsubscribe('workflow-logs');
    };
  }, [setupRealtimeSubscriptions]);

  return {
    notifications,
    statusUpdates,
    connectionStatus,
    markNotificationAsRead,
    clearAllNotifications,
    clearStatusUpdates,
    setupRealtimeSubscriptions
  };
};