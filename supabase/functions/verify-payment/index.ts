import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    // Update order based on payment status
    let orderStatus = "pending";
    let paymentStatus = "pending";

    if (session.payment_status === "paid") {
      orderStatus = "confirmed";
      paymentStatus = "completed";
      console.log("Payment successful for order:", orderId);
    } else if (session.payment_status === "unpaid") {
      orderStatus = "cancelled";
      paymentStatus = "failed";
      console.log("Payment failed for order:", orderId);
    }

    // Update the order in the database
    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: orderStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Order update error:", updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // Log the workflow action
    await supabaseClient
      .from("order_workflow_log")
      .insert({
        order_id: orderId,
        phase: "payment",
        action: session.payment_status === "paid" ? "payment_completed" : "payment_failed",
        new_status: orderStatus,
        previous_status: "pending",
        notes: `Stripe session: ${sessionId}`,
        metadata: {
          session_id: sessionId,
          payment_intent: session.payment_intent,
          amount_total: session.amount_total
        }
      });

    console.log("Order updated successfully:", updatedOrder.id);

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