import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CallRequest {
  orderId?: string;
  recipientId: string;
  callType: 'voice' | 'video';
  message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { orderId, recipientId, callType, message }: CallRequest = await req.json();

    console.log(`Initiating ${callType} call from ${user.id} to ${recipientId}`);

    // Get recipient profile
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('display_name, email, phone')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      throw new Error('Recipient not found');
    }

    // Get caller profile
    const { data: caller, error: callerError } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single();

    if (callerError || !caller) {
      throw new Error('Caller profile not found');
    }

    // For MVP, we'll simulate call functionality with notifications
    // In production, integrate with Twilio, Zoom API, etc.

    // Create call log entry
    const { data: callLog, error: logError } = await supabase
      .from('order_workflow_log')
      .insert({
        order_id: orderId,
        actor_id: user.id,
        phase: 'communication',
        action: `${callType}_call_initiated`,
        notes: `${callType} call from ${caller.display_name} to ${recipient.display_name}`,
        metadata: {
          call_type: callType,
          recipient_id: recipientId,
          caller_id: user.id,
          message: message
        }
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to log call: ${logError.message}`);
    }

    // Send notification to recipient about incoming call
    const { error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: orderId,
        notification_type: 'call_notification',
        recipient_type: 'stakeholder',
        recipient_identifier: recipient.email,
        channel: 'in_app',
        message_content: `${caller.display_name} is requesting a ${callType} call${message ? `: ${message}` : ''}`,
        metadata: {
          call_type: callType,
          caller_id: user.id,
          caller_name: caller.display_name,
          call_log_id: callLog.id
        }
      });

    if (notificationError) {
      console.warn('Failed to create call notification:', notificationError.message);
    }

    // For demo purposes, simulate different call outcomes
    const outcomes = ['answered', 'busy', 'no_answer', 'voicemail'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    // Update call log with outcome
    await supabase
      .from('order_workflow_log')
      .update({
        notes: `${callType} call ${outcome} - Duration: ${Math.floor(Math.random() * 300 + 30)}s`,
        metadata: {
          ...callLog.metadata,
          outcome: outcome,
          duration_seconds: Math.floor(Math.random() * 300 + 30)
        }
      })
      .eq('id', callLog.id);

    let responseMessage = '';
    switch (outcome) {
      case 'answered':
        responseMessage = `Call connected successfully with ${recipient.display_name}`;
        break;
      case 'busy':
        responseMessage = `${recipient.display_name} is currently busy. Try again later.`;
        break;
      case 'no_answer':
        responseMessage = `No answer from ${recipient.display_name}. Voicemail notification sent.`;
        break;
      case 'voicemail':
        responseMessage = `Left voicemail for ${recipient.display_name}`;
        break;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        call_id: callLog.id,
        outcome: outcome,
        message: responseMessage,
        recipient: recipient.display_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in voice call service:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});