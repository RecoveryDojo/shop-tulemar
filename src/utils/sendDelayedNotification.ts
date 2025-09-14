import { supabase } from '@/integrations/supabase/client';

export const sendDelayedNotification = async (orderId: string, notificationType: string, phase: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('notification-orchestrator', {
      body: {
        orderId,
        notificationType,
        phase
      }
    });

    if (error) {
      console.error('Failed to send delayed notification:', error);
      return { success: false, error };
    }

    console.log('Delayed notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending delayed notification:', error);
    return { success: false, error };
  }
};