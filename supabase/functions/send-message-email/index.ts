import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageEmailRequest {
  messageId: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  priority: string;
  messageType: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId, senderId, recipientId, subject, content, priority, messageType }: SendMessageEmailRequest = await req.json();

    console.log("Processing email for message:", messageId);

    // Get sender and recipient profiles
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', senderId)
      .single();

    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', recipientId)
      .single();

    if (senderError || recipientError || !recipientProfile?.email) {
      console.error("Error fetching profiles:", { senderError, recipientError });
      throw new Error("Could not fetch user profiles");
    }

    // Check recipient's email preferences
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('email_enabled, message_notifications, emergency_notifications')
      .eq('user_id', recipientId)
      .single();

    // Skip email if disabled or message notifications are off
    if (!emailPrefs?.email_enabled || !emailPrefs?.message_notifications) {
      // Still update the message as processed
      await supabase
        .from('user_messages')
        .update({ sent_via_email: false })
        .eq('id', messageId);

      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Skip email for non-emergency messages if emergency-only mode
    if (messageType !== 'emergency' && !emailPrefs.emergency_notifications && priority !== 'urgent') {
      await supabase
        .from('user_messages')
        .update({ sent_via_email: false })
        .eq('id', messageId);

      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create email subject with priority indicator
    const priorityPrefix = priority === 'urgent' || messageType === 'emergency' ? '[URGENT] ' : '';
    const emailSubject = `${priorityPrefix}Message from ${senderProfile?.display_name || 'Team Member'}: ${subject}`;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Grocery Delivery <messages@resend.dev>",
      to: [recipientProfile.email],
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">New Message</h2>
            <p style="color: #666; margin: 0;">From: <strong>${senderProfile?.display_name || 'Team Member'}</strong></p>
            ${priority === 'urgent' || messageType === 'emergency' ? 
              '<p style="color: #e74c3c; font-weight: bold; margin: 10px 0 0 0;">⚠️ This is an urgent message</p>' : ''
            }
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">${subject}</h3>
            <div style="color: #555; line-height: 1.6;">
              ${content.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
              Reply to this message by logging into your dashboard
            </p>
            <a href="${supabaseUrl.replace('supabase.co', 'vercel.app')}/profile" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Open Dashboard
            </a>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This message was sent through the Grocery Delivery platform. 
              To manage your email preferences, visit your profile settings.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update message to mark as sent via email
    await supabase
      .from('user_messages')
      .update({ 
        sent_via_email: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq('id', messageId);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-message-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send email notification"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);