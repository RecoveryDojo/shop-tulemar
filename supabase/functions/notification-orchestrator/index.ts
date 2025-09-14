import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  orderId: string;
  notificationType: string;
  phase: string;
  recipientType?: string;
  recipientIdentifier?: string;
  channel?: string;
  metadata?: Record<string, any>;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, notificationType, phase, recipientType, recipientIdentifier, channel, metadata }: NotificationRequest = await req.json();
    
    console.log(`Processing notification for order ${orderId}, type: ${notificationType}, phase: ${phase}`);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Get stakeholder assignments for this order
    const { data: assignments } = await supabase
      .from('stakeholder_assignments')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'assigned');

    // Define notification templates and recipients based on phase
    const notificationTemplates = {
      'order_confirmed': {
        customer: `Hi ${order.customer_name}, your order #${order.id.slice(0, 8)} has been confirmed and assigned to our team. Expected delivery: ${order.arrival_date}`,
        admin: `New order #${order.id.slice(0, 8)} confirmed for ${order.customer_name}. Total: $${order.total_amount}`,
        shopper: `New shopping assignment: Order #${order.id.slice(0, 8)} for ${order.guest_count} guests. Ready to start shopping?`
      },
      'shopping_started': {
        customer: `Great news! Our shopper has started collecting your groceries for order #${order.id.slice(0, 8)}. We'll keep you updated on any substitutions.`,
        admin: `Shopping started for order #${order.id.slice(0, 8)}`,
        driver: `Order #${order.id.slice(0, 8)} will be ready for pickup soon. Delivery address: ${order.property_address}`
      },
      'items_packed': {
        customer: `Your groceries are packed and ready for delivery! Order #${order.id.slice(0, 8)} is on its way to ${order.property_address}`,
        driver: `Order #${order.id.slice(0, 8)} is ready for pickup and delivery`,
        concierge: `Incoming delivery for ${order.property_address}. Order #${order.id.slice(0, 8)} arriving soon.`
      },
      'out_for_delivery': {
        customer: `Your groceries are out for delivery! Expected arrival at ${order.property_address} within the next hour.`,
        concierge: `Order #${order.id.slice(0, 8)} is out for delivery to ${order.property_address}. Please prepare for arrival.`
      },
      'delivered': {
        customer: `Your groceries have been delivered to ${order.property_address}. Our concierge will stock your kitchen shortly.`,
        concierge: `Order #${order.id.slice(0, 8)} delivered to ${order.property_address}. Please begin kitchen stocking protocol.`
      },
      'stocking_complete': {
        customer: `Perfect! Your kitchen at ${order.property_address} is now fully stocked and ready for your arrival. Welcome!`,
        admin: `Order #${order.id.slice(0, 8)} completed successfully. Kitchen stocked at ${order.property_address}`,
        manager: `Guest kitchen ready: ${order.property_address} - Order #${order.id.slice(0, 8)} stocking complete`
      },
      'substitution_needed': {
        customer: `We need your approval for a substitution in order #${order.id.slice(0, 8)}. Please check your app to approve or decline.`,
        admin: `Substitution pending approval for order #${order.id.slice(0, 8)}`
      },
      'delay_notification': {
        customer: `We're experiencing a slight delay with your order #${order.id.slice(0, 8)}. New estimated time: ${metadata?.newEta || 'TBD'}`,
        admin: `Delay reported for order #${order.id.slice(0, 8)}. Reason: ${metadata?.reason || 'Unknown'}`
      },
      'shopper_message': {
        customer: metadata?.message || 'Update from your personal shopper'
      },
      'status_update': {
        customer: `Order #${order.id.slice(0, 8)} status updated to: ${order.status}`,
        admin: `Order status change: #${order.id.slice(0, 8)} -> ${order.status}`
      }
    };

    const templates = notificationTemplates[notificationType] || {};
    const notifications = [];

    // Handle specific recipient scenarios
    if (recipientType && recipientIdentifier) {
      // Map to valid recipient types
      const validRecipientType = mapToValidRecipientType(recipientType);
      notifications.push({
        order_id: orderId,
        notification_type: notificationType,
        recipient_type: validRecipientType,
        recipient_identifier: recipientIdentifier,
        channel: channel || determinePreferredChannel(recipientType, notificationType),
        message_content: metadata?.message || templates.customer || `Order update for #${orderId.slice(-8)}`,
        metadata: { ...metadata, specific_recipient: true }
      });
    } else {
      // Send to customer (always) if no specific recipient
      if (templates.customer) {
        notifications.push({
          order_id: orderId,
          notification_type: notificationType,
          recipient_type: 'client',
          recipient_identifier: order.customer_email,
          channel: determinePreferredChannel('customer', notificationType),
          message_content: templates.customer,
          metadata: { ...metadata, phone: order.customer_phone }
        });
      }
    }

    // Send to assigned stakeholders
    if (assignments) {
      for (const assignment of assignments) {
        const roleTemplate = templates[assignment.role];
        if (roleTemplate) {
          notifications.push({
            order_id: orderId,
            notification_type: notificationType,
            recipient_type: assignment.role, // Use the actual role as recipient_type
            recipient_identifier: assignment.user_id,
            channel: determinePreferredChannel(assignment.role, notificationType),
            message_content: roleTemplate,
            metadata: { ...metadata, role: assignment.role }
          });
        }
      }
    }

    // Send to admin/system roles for certain notifications
    const systemNotificationTypes = ['order_confirmed', 'delay_notification', 'stocking_complete'];
    if (systemNotificationTypes.includes(notificationType) && templates.admin) {
      notifications.push({
        order_id: orderId,
        notification_type: notificationType,
        recipient_type: 'admin',
        recipient_identifier: 'admin@system',
        channel: 'email',
        message_content: templates.admin,
        metadata
      });
    }

    // Insert all notifications
    const { error: insertError } = await supabase
      .from('order_notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }

    // Log workflow action
    await supabase
      .from('order_workflow_log')
      .insert({
        order_id: orderId,
        phase,
        action: `notifications_sent_${notificationType}`,
        notes: `Sent ${notifications.length} notifications`,
        metadata: { notificationType, recipientCount: notifications.length }
      });

    // Process each notification (simulate sending)
    for (const notification of notifications) {
      await processNotification(notification);
    }

    console.log(`Successfully processed ${notifications.length} notifications for order ${orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length,
        orderId,
        phase
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in notification orchestrator:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
};

function determinePreferredChannel(role: string, notificationType: string): string {
  // High priority notifications go via SMS
  const urgentNotifications = ['substitution_needed', 'delay_notification', 'out_for_delivery'];
  const smsRoles = ['customer', 'driver', 'concierge'];
  
  if (urgentNotifications.includes(notificationType) && smsRoles.includes(role)) {
    return 'sms';
  }
  
  // Role-based preferences
  const roleChannelPrefs = {
    'customer': 'push',
    'shopper': 'push',
    'driver': 'sms',
    'concierge': 'sms',
    'admin': 'email',
    'manager': 'email'
  };
  
  return roleChannelPrefs[role] || 'email';
}

async function processNotification(notification: any): Promise<void> {
  try {
    const { channel, message_content, recipient_identifier, metadata } = notification;
    
    console.log(`Processing ${channel} notification to ${recipient_identifier}`);
    
    switch (channel) {
      case 'sms':
        // Simulate SMS sending - would integrate with Twilio/similar
        console.log(`SMS to ${metadata?.phone || recipient_identifier}: ${message_content}`);
        await simulateDelay(500);
        break;
        
      case 'email':
        // Simulate email sending - would integrate with Resend/similar
        console.log(`Email to ${recipient_identifier}: ${message_content}`);
        await simulateDelay(300);
        break;
        
      case 'push':
        // Simulate push notification - would integrate with FCM/similar
        console.log(`Push to ${recipient_identifier}: ${message_content}`);
        await simulateDelay(200);
        break;
    }
    
    // Update notification status
    await supabase
      .from('order_notifications')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('order_id', notification.order_id)
      .eq('recipient_identifier', recipient_identifier)
      .eq('notification_type', notification.notification_type);
      
  } catch (error) {
    console.error('Error processing notification:', error);
    
    // Update notification with error
    await supabase
      .from('order_notifications')
      .update({ 
        status: 'failed', 
        error_message: error.message 
      })
      .eq('order_id', notification.order_id)
      .eq('recipient_identifier', notification.recipient_identifier);
  }
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mapToValidRecipientType(inputType: string): string {
  const typeMapping = {
    'customer': 'client',
    'stakeholder': 'shopper',
    'system': 'admin',
    'client': 'client',
    'shopper': 'shopper',
    'driver': 'driver',
    'concierge': 'concierge',
    'admin': 'admin'
  };
  
  return typeMapping[inputType] || 'client';
}

serve(handler);