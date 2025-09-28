import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, eventType, data } = await req.json();

    if (!orderId || !eventType) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId or eventType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Broadcasting ${eventType} for order ${orderId}:`, data);

    // Log the event to order_workflow_log for persistence
    const { error: logError } = await supabaseClient
      .from('order_workflow_log')
      .insert({
        order_id: orderId,
        action: eventType,
        phase: data.phase || 'unknown',
        notes: data.notes || `${eventType} event`,
        metadata: data
      });

    if (logError) {
      console.error('Failed to log event:', logError);
    }

    // Broadcast the event to the order-specific channel
    const channelName = `order-${orderId}`;
    
    // Send real-time notification to all subscribers of this order
    await supabaseClient
      .channel(channelName)
      .send({
        type: 'broadcast',
        event: eventType,
        payload: {
          orderId,
          eventType,
          timestamp: new Date().toISOString(),
          data
        }
      });

    console.log(`Successfully broadcasted ${eventType} to ${channelName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        channelName,
        eventType,
        orderId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error broadcasting order event:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});