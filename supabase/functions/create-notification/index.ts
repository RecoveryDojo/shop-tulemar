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
  recipientId: string;
  type: 'new_message' | 'message_reaction' | 'message_mention' | 'system_alert';
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
    const { recipientId, type, messageId, messageType, senderId, customData }: NotificationRequest = await req.json();

    console.log("Creating notification:", { recipientId, type, messageId });

    // Get recipient's notification preferences
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', recipientId)
      .single();

    // Get sender info if provided
    let senderInfo = null;
    if (senderId) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', senderId)
        .single();
      senderInfo = data;
    }

    // Create notification content based on type
    let notificationContent = '';
    let notificationChannel = 'in_app';

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

    // Insert notification into database
    const { data: notification, error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        notification_type: type,
        recipient_type: 'user',
        recipient_identifier: recipientId,
        channel: notificationChannel,
        message_content: notificationContent,
        metadata: {
          message_id: messageId,
          message_type: messageType,
          sender_id: senderId,
          custom_data: customData,
          created_via: 'messaging_system'
        }
      })
      .select()
      .single();

    if (notificationError) {
      console.error("Failed to create notification:", notificationError);
      throw notificationError;
    }

    // Send push notification for urgent messages or mentions
    if (notificationChannel === 'push' && prefs?.message_notifications) {
      try {
        // Here you would integrate with a push notification service
        // For now, we'll log that we would send a push notification
        console.log("Would send push notification:", {
          recipient: recipientId,
          content: notificationContent,
          data: { messageId, type }
        });
      } catch (pushError) {
        console.warn("Push notification failed:", pushError);
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