import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Payment verification request received");

    const { sessionId, orderId } = await req.json();
    
    if (!sessionId || !orderId) {
      throw new Error("Missing session ID or order ID");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Session status:", session.payment_status);

    // Fetch current order to check its state
    const { data: currentOrder, error: fetchError } = await supabaseClient
      .from("orders")
      .select("id, status, payment_status")
      .eq("id", orderId)
      .single();

    if (fetchError || !currentOrder) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Determine new status based on payment and current state
    let newStatus = currentOrder.status;
    let paymentStatus = currentOrder.payment_status;

    if (session.payment_status === "paid") {
      // Only normalize legacy statuses to "placed"
      if (currentOrder.status === "confirmed" || 
          currentOrder.status === "pending" || 
          !currentOrder.status) {
        newStatus = "placed";  // Canonical: order is placed and awaiting shopper
      }
      // If already in a valid workflow state (claimed/shopping/ready/etc), don't change it
      paymentStatus = "paid";
      console.log(`[verify-payment] Payment successful for order: ${orderId}`);
      
    } else if (session.payment_status === "unpaid") {
      newStatus = "canceled";  // Canonical spelling
      paymentStatus = "failed";
      console.log(`[verify-payment] Payment failed for order: ${orderId}`);
    }

    // Update order with normalized status and payment info
    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: newStatus,
        payment_status: paymentStatus,
        payment_intent_id: String(session.payment_intent || ""),
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("[verify-payment] Order update error:", updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log(`[verify-payment] Order payment recorded`, {
      orderId,
      from: currentOrder.status,
      to: newStatus,
      session: sessionId
    });

    // Log the workflow action with accurate state transition
    await supabaseClient
      .from("new_order_events")
      .insert({
        order_id: orderId,
        event_type: session.payment_status === "paid" ? "PAYMENT_CONFIRMED" : "PAYMENT_FAILED",
        actor_role: "system",
        data: {
          stripe_session_id: sessionId,
          payment_intent: session.payment_intent,
          amount_total: session.amount_total,
          payment_status: session.payment_status,
          previous_status: currentOrder.status,
          new_status: newStatus
        }
      });

    console.log("Order updated successfully:", updatedOrder.id);

    // Send notifications on successful payment
    if (session.payment_status === "paid") {
      try {
        await supabaseClient.functions.invoke('notification-orchestrator', {
          body: {
            orderId: orderId,
            notificationType: 'order_confirmed',
            phase: 'payment'
          }
        });
        console.log("Order confirmation notifications sent");
      } catch (notificationError) {
        console.error("Failed to send notifications:", notificationError);
        // Don't fail the payment verification due to notification issues
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        order: updatedOrder,
        paymentStatus: session.payment_status
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Payment verification failed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});