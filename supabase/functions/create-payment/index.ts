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
    console.log("Payment creation request received");

    // Parse request body
    const { orderData, items, siteOrigin } = await req.json();
    console.log("Order data:", { orderData, itemCount: items?.length });
    
    // Determine origin for redirect URLs
    const origin = siteOrigin || req.headers.get("origin") || Deno.env.get("PUBLIC_SITE_URL");
    console.log("[create-payment] Using origin:", origin);

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

    // Check if user exists, create if needed (Option C - Guest Account Creation)
    let userCreated = false;
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
    const userExists = existingUser.users.some(u => u.email === orderData.customerEmail);
    
    if (!userExists) {
      console.log("Creating new user account for guest checkout:", orderData.customerEmail);
      
      // Create user account
      const { data: newUser, error: userError } = await supabaseClient.auth.admin.createUser({
        email: orderData.customerEmail,
        password: Math.random().toString(36).slice(-8) + "A1!", // Random secure password
        email_confirm: true, // Skip email confirmation for guest accounts
        user_metadata: {
          display_name: orderData.customerName,
          created_via: 'guest_checkout'
        }
      });

      if (userError) {
        console.error("Failed to create user account:", userError);
        // Continue with order creation even if user creation fails
      } else {
        console.log("User account created:", newUser.user?.id);
        userCreated = true;

        // Create profile for the new user
        await supabaseClient
          .from("profiles")
          .insert({
            id: newUser.user!.id,
            display_name: orderData.customerName,
            email: orderData.customerEmail,
            phone: orderData.customerPhone,
            preferences: { created_via: 'guest_checkout' }
          });

        // Assign client role
        await supabaseClient
          .from("user_roles")
          .insert({
            user_id: newUser.user!.id,
            role: 'client'
          });

        console.log("Profile and role created for new user");
      }
    }

    // Create order in database first
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone || null,
        property_address: orderData.propertyAddress || null,
        arrival_date: orderData.arrivalDate || null,
        departure_date: orderData.departureDate || null,
        guest_count: orderData.guestCount,
        dietary_restrictions: orderData.dietaryRestrictions,
        special_instructions: orderData.specialInstructions || null,
        subtotal: orderData.subtotal,
        tax_amount: orderData.taxAmount,
        delivery_fee: orderData.deliveryFee,
        total_amount: orderData.totalAmount,
        status: "placed",
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
      sku: String(item.productId),
      name: item.name,
      qty: item.quantity,
      notes: null
    }));

    const { error: itemsError } = await supabaseClient
      .from("new_order_items")
      .insert(orderItems, { returning: 'minimal' });

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log('[create-payment] Order items inserted successfully:', { count: orderItems.length });

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
    const successUrl = `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`;
    const cancelUrl = `${origin}/cart?canceled=true`;
    console.log("[create-payment] Stripe URLs:", { successUrl, cancelUrl });
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
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

    // Log if we created a new user account
    if (userCreated) {
      console.log("New user account created during checkout for:", orderData.customerEmail);
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        orderId: order.id,
        accessToken: order.access_token,
        userCreated: userCreated
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("[create-payment] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Payment creation failed";
    const errorDetails = error instanceof Error && error.stack ? error.stack : String(error);
    console.error("[create-payment] Error details:", errorDetails);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});