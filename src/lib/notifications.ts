import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OrderEvent {
  id: string;
  order_id: string;
  event_type: string;
  actor_role: string;
  data: any;
  created_at: string;
}

interface NotifyContext {
  order?: any;
  profile?: any;
}

// Customer-visible events that trigger email notifications
const CUSTOMER_VISIBLE_EVENTS = [
  'STATUS_CHANGED',
  'ASSIGNED',
  'STOCKING_STARTED',
  'STOCKED_IN_UNIT',
  'ITEM_UPDATED'
];

// Event type to message mapping
const EVENT_MESSAGES = {
  STATUS_CHANGED: (data: any) => {
    const { from, to } = data;
    if (to === 'READY') return 'Your order is now ready for pickup!';
    if (to === 'DELIVERED') return 'Your order has been delivered to your unit.';
    if (to === 'SHOPPING') return 'Your personal shopper has started shopping.';
    if (to === 'CLAIMED') return 'A shopper has been assigned to your order.';
    return `Order moved from ${from} to ${to}`;
  },
  ASSIGNED: () => 'A personal shopper has been assigned to your order.',
  STOCKING_STARTED: () => 'Your groceries are being stocked in your unit.',
  STOCKED_IN_UNIT: () => 'Your groceries have been delivered and stocked!',
  ITEM_UPDATED: (data: any) => {
    const { name, qty_picked, qty } = data;
    if (qty_picked > 0) {
      return `${name} updated (picked ${qty_picked}/${qty})`;
    }
    return `${name} was updated`;
  },
  ITEM_ADDED: (data: any) => `${data.name} added to order`,
  ITEM_REMOVED: (data: any) => `${data.name} removed from order`,
  SUBSTITUTION_SUGGESTED: (data: any) => `Substitution suggested for ${data.name}`,
  SUBSTITUTION_DECISION: (data: any) => 
    `Substitution ${data.decision === 'accept' ? 'accepted' : 'rejected'} for ${data.name}`
};

export const getEventMessage = (eventType: string, data: any): string => {
  const messageBuilder = EVENT_MESSAGES[eventType as keyof typeof EVENT_MESSAGES];
  if (messageBuilder) {
    if (typeof messageBuilder === 'function') {
      return messageBuilder(data);
    }
    return messageBuilder;
  }
  return eventType.replace(/_/g, ' ').toLowerCase();
};

export const getEventIcon = (eventType: string): string => {
  switch (eventType) {
    case 'STATUS_CHANGED':
      return '🔄';
    case 'ASSIGNED':
      return '👤';
    case 'STOCKING_STARTED':
      return '📦';
    case 'STOCKED_IN_UNIT':
      return '✅';
    case 'ITEM_UPDATED':
    case 'ITEM_ADDED':
    case 'ITEM_REMOVED':
      return '🛒';
    case 'SUBSTITUTION_SUGGESTED':
    case 'SUBSTITUTION_DECISION':
      return '🔄';
    default:
      return '📝';
  }
};

export const isCustomerVisible = (eventType: string, data?: any): boolean => {
  if (!CUSTOMER_VISIBLE_EVENTS.includes(eventType)) {
    return false;
  }
  
  // For ITEM_UPDATED, only show if qty_picked changed
  if (eventType === 'ITEM_UPDATED' && data?.qty_picked === undefined) {
    return false;
  }
  
  return true;
};

export const notify = async (event: OrderEvent, context: NotifyContext = {}): Promise<void> => {
  const { order } = context;
  const isStaffUser = window.location.pathname.includes('/admin') || 
                      window.location.pathname.includes('/dashboard');
  
  try {
    // Always show in-app toast for staff users
    if (isStaffUser) {
      const message = getEventMessage(event.event_type, event.data);
      const icon = getEventIcon(event.event_type);
      
      toast({
        title: `${icon} ${event.event_type.replace(/_/g, ' ')}`,
        description: message,
        duration: 5000,
      });
    }
    
    // Send customer notification if applicable
    if (isCustomerVisible(event.event_type, event.data) && order) {
      await supabase.functions.invoke('create-notification', {
        body: {
          order_id: event.order_id,
          event_type: event.event_type,
          actor_role: event.actor_role,
          data: event.data,
          customer_email: order.customer_email,
          customer_name: order.customer_name
        }
      });
    }
    
    console.log('[Notifications] Processed event:', event.event_type);
  } catch (error) {
    console.error('[Notifications] Failed to process event:', error);
    
    // Fallback toast for critical errors
    if (isStaffUser) {
      toast({
        title: 'Notification Error',
        description: 'Failed to send notification',
        variant: 'destructive',
        duration: 3000,
      });
    }
  }
};