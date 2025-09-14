// Utility to manually trigger notifications for retroactive assignments
import { supabase } from '@/integrations/supabase/client';

export const triggerRetroactiveNotifications = async (orderId: string, shopperId: string, customerId: string) => {
  try {
    // 1. Create shopper assignment notification
    const { error: shopperNotificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: orderId,
        notification_type: 'shopper_assignment',
        recipient_type: 'shopper',
        recipient_identifier: shopperId,
        channel: 'app',
        status: 'pending',
        message_content: `Hi Scott! You have been assigned as the personal shopper for Jessica Wallsinger. Order details and shopping list are ready for you to review.`,
        metadata: {
          shopper_name: "Shopper Scott",
          customer_name: "Jessica Wallsinger", 
          assignment_time: new Date().toISOString()
        }
      });

    if (shopperNotificationError) {
      console.error('Error creating shopper notification:', shopperNotificationError);
    }

    // 2. Create customer notification
    const { error: customerNotificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: orderId,
        notification_type: 'shopper_assignment_customer',
        recipient_type: 'customer',
        recipient_identifier: customerId,
        channel: 'app',
        status: 'pending',
        message_content: `Good news Jessica! Your personal shopper Scott has been assigned to your order. He will start shopping for your groceries shortly and will keep you updated throughout the process.`,
        metadata: {
          shopper_name: "Shopper Scott",
          customer_name: "Jessica Wallsinger",
          assignment_time: new Date().toISOString()
        }
      });

    if (customerNotificationError) {
      console.error('Error creating customer notification:', customerNotificationError);
    }

    // 3. Create initial message from shopper to customer
    const { error: messageError } = await supabase
      .from('user_messages')
      .insert({
        sender_id: shopperId,
        recipient_id: customerId,
        subject: 'Your Personal Shopper - Ready to Shop!',
        content: `Hi Jessica! I'm Scott, your assigned personal shopper for today. I've reviewed your order and I'm ready to start shopping for you. I'll make sure to select the freshest items and will reach out if I need any substitutions. Expected shopping time: 45-60 minutes.`,
        message_type: 'assignment_introduction',
        priority: 'normal',
        metadata: {
          order_id: orderId,
          assignment_type: 'shopper',
          estimated_shopping_time: '45-60 minutes'
        }
      });

    if (messageError) {
      console.error('Error creating message:', messageError);
    }

    // 4. Call notification orchestrator to send actual notifications
    const { error: orchestratorError } = await supabase.functions.invoke('notification-orchestrator', {
      body: {
        orderId: orderId,
        notificationType: 'shopper_assignment',
        phase: 'assignment',
        recipientType: 'both',
        channel: 'email'
      }
    });

    if (orchestratorError) {
      console.error('Error calling notification orchestrator:', orchestratorError);
    }

    return {
      success: true,
      message: 'Retroactive notifications triggered successfully'
    };

  } catch (error) {
    console.error('Error in triggerRetroactiveNotifications:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Example usage:
// triggerRetroactiveNotifications(
//   '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7', 
//   'c0656059-7095-440e-a6f2-9889128866c2', 
//   'fc09480b-370d-4748-9a23-148b9ed2227a'
// );