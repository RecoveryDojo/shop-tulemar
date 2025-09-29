import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  order_id?: string;
  event_type?: string;
  actor_role?: string;
  data?: any;
  customer_email?: string;
  customer_name?: string;
  // Legacy message notification fields
  recipientId?: string;
  type?: 'new_message' | 'message_reaction' | 'message_mention' | 'system_alert';
  messageId?: string;
  messageType?: string;
  senderId?: string;
  customData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      order_id, event_type, actor_role, data, customer_email, customer_name,
      recipientId, type, messageId, messageType, senderId, customData 
    }: NotificationRequest = await req.json();

    console.log("Creating notification:", { order_id, event_type, type, recipientId });

    let notificationContent = '';
    let notificationChannel = 'email';
    let notificationType = type || 'order_update';
    let recipientIdentifier = recipientId || customer_email;

    // Handle order events
    if (order_id && event_type) {
      switch (event_type) {
        case 'STATUS_CHANGED':
          if (data?.to === 'READY') {
            notificationContent = `Hi ${customer_name}, your order is now ready for pickup!`;
          } else if (data?.to === 'DELIVERED') {
            notificationContent = `Hi ${customer_name}, your order has been delivered to your unit.`;
          } else if (data?.to === 'SHOPPING') {
            notificationContent = `Hi ${customer_name}, your personal shopper has started shopping.`;
          } else {
            notificationContent = `Hi ${customer_name}, your order status has been updated.`;
          }
          break;
        case 'ASSIGNED':
          notificationContent = `Hi ${customer_name}, a personal shopper has been assigned to your order.`;
          break;
        case 'STOCKING_STARTED':
          notificationContent = `Hi ${customer_name}, your groceries are being stocked in your unit.`;
          break;
        case 'STOCKED_IN_UNIT':
          notificationContent = `Hi ${customer_name}, your groceries have been delivered and stocked!`;
          break;
        case 'ITEM_UPDATED':
          if (data?.qty_picked > 0) {
            notificationContent = `Hi ${customer_name}, ${data.name} has been picked (${data.qty_picked}/${data.qty}).`;
          } else {
            notificationContent = `Hi ${customer_name}, an item in your order has been updated.`;
          }
          break;
        default:
          notificationContent = `Hi ${customer_name}, there's an update on your order.`;
      }
      notificationType = 'order_update';
    } else {
      // Handle legacy message notifications
      const { data: prefs } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', recipientId)
        .single();

      let senderInfo = null;
      if (senderId) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', senderId)
          .single();
        senderInfo = data;
      }

      notificationChannel = 'in_app';
      switch (type) {
        case 'new_message':
          notificationContent = `New message from ${senderInfo?.display_name || 'Team Member'}`;
          if (messageType === 'emergency') {
            notificationContent = `🚨 URGENT: ${notificationContent}`;
            notificationChannel = 'push';
          }
          break;
        case 'message_reaction':
          notificationContent = `${senderInfo?.display_name || 'Someone'} reacted to your message`;
          break;
        case 'message_mention':
          notificationContent = `${senderInfo?.display_name || 'Someone'} mentioned you in a message`;
          notificationChannel = 'push';
          break;
        case 'system_alert':
          notificationContent = customData?.message || 'System notification';
          notificationChannel = 'push';
          break;
        default:
          notificationContent = 'New notification';
      }
    }

    // Insert notification into database
    const { data: notification, error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: order_id || null,
        notification_type: notificationType,
        recipient_type: 'customer',
        recipient_identifier: recipientIdentifier,
        channel: notificationChannel,
        message_content: notificationContent,
        metadata: {
          event_type,
          actor_role,
          event_data: data,
          message_id: messageId,
          message_type: messageType,
          sender_id: senderId,
          custom_data: customData,
          created_via: order_id ? 'order_system' : 'messaging_system'
        }
      })
      .select()
      .single();

    // Also insert into order events if this is an order-related notification
    if (order_id && event_type) {
      await supabase
        .from('new_order_events')
        .insert({
          order_id,
          event_type,
          actor_role: actor_role || 'system',
          data: data || {}
        });
    }

    if (notificationError) {
      console.error("Failed to create notification:", notificationError);
      throw notificationError;
    }

    // Send email notification for order updates
    if (notificationChannel === 'email' && customer_email) {
      try {
        // Here you would integrate with an email service (Resend, etc.)
        console.log("Would send email notification:", {
          recipient: customer_email,
          subject: `Order Update - ${event_type?.replace(/_/g, ' ')}`,
          content: notificationContent,
          data: { order_id, event_type }
        });
      } catch (emailError) {
        console.warn("Email notification failed:", emailError);
      }
    }

    // Real-time notification via Supabase realtime
    try {
      await supabase
        .channel('notifications')
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: {
            recipient_id: recipientId,
            notification,
            immediate: messageType === 'emergency' || type === 'system_alert'
          }
        });
    } catch (realtimeError) {
      console.warn("Realtime notification failed:", realtimeError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      notificationId: notification.id,
      sent_channels: [notificationChannel]
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in create-notification function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to create notification"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);