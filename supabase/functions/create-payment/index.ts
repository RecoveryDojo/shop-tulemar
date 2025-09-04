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
    console.log("Payment creation request received");

    // Parse request body
    const { orderData, items } = await req.json();
    console.log("Order data:", { orderData, itemCount: items?.length });

    if (!orderData || !items || items.length === 0) {
      throw new Error("Missing order data or items");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create Supabase client for order creation
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create order in database first
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        property_address: orderData.propertyAddress,
        arrival_date: orderData.arrivalDate,
        departure_date: orderData.departureDate,
        guest_count: orderData.guestCount,
        dietary_restrictions: orderData.dietaryRestrictions,
        special_instructions: orderData.specialInstructions,
        subtotal: orderData.subtotal,
        tax_amount: orderData.taxAmount,
        delivery_fee: orderData.deliveryFee,
        total_amount: orderData.totalAmount,
        status: "pending",
        payment_status: "pending"
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log("Order created:", order.id);

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice
    }));

    const { error: itemsError } = await supabaseClient
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Check if customer exists in Stripe
    let customerId;
    const customers = await stripe.customers.list({ 
      email: orderData.customerEmail, 
      limit: 1 
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Existing Stripe customer found:", customerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: orderData.customerEmail,
        name: orderData.customerName,
        phone: orderData.customerPhone,
        metadata: {
          order_id: order.id
        }
      });
      customerId = customer.id;
      console.log("New Stripe customer created:", customerId);
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description || undefined,
          images: item.imageUrl ? [item.imageUrl] : undefined,
        },
        unit_amount: Math.round(item.unitPrice * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add delivery fee if applicable
    if (orderData.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Delivery Fee",
            description: `Delivery to ${orderData.propertyAddress}`,
          },
          unit_amount: Math.round(orderData.deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/shop/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${req.headers.get("origin")}/shop/cart?canceled=true`,
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          customer_email: orderData.customerEmail
        }
      },
      metadata: {
        order_id: order.id
      }
    });

    // Update order with payment intent ID
    await supabaseClient
      .from("orders")
      .update({ 
        payment_intent_id: session.payment_intent,
        access_token: order.access_token // Keep the existing token
      })
      .eq("id", order.id);

    console.log("Stripe session created:", session.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        orderId: order.id,
        accessToken: order.access_token
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Payment creation failed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});