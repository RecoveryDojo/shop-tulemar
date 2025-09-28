import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, orderId, itemId, data } = await req.json();
    console.log(`Order workflow action: ${action} for order ${orderId}`);

    const authHeader = req.headers.get('authorization');
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '');
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    switch (action) {
      case 'accept_order':
        return await acceptOrder(supabase, orderId, userId);
      
      case 'start_shopping':
        return await startShopping(supabase, orderId, userId);
      
      case 'mark_item_found':
        return await markItemFound(supabase, itemId, data, userId);
      
      case 'request_substitution':
        return await requestSubstitution(supabase, itemId, data, userId);
      
      case 'complete_shopping':
        return await completeShopping(supabase, orderId, userId);
      
      case 'start_delivery':
        return await startDelivery(supabase, orderId, userId);
      
      case 'complete_delivery':
        return await completeDelivery(supabase, orderId, userId);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in order-workflow:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function acceptOrder(supabase: any, orderId: string, userId: string) {
  // Create stakeholder assignment
  const { error: assignmentError } = await supabase
    .from('stakeholder_assignments')
    .insert({
      order_id: orderId,
      user_id: userId,
      role: 'shopper',
      status: 'accepted',
      accepted_at: new Date().toISOString()
    });

  if (assignmentError) {
    console.error('Assignment error:', assignmentError);
    throw new Error('Failed to accept order assignment');
  }

  // Update order with assigned shopper
  const { error: orderError } = await supabase
    .from('orders')
    .update({ assigned_shopper_id: userId })
    .eq('id', orderId);

  if (orderError) {
    console.error('Order update error:', orderError);
    throw new Error('Failed to update order');
  }

  // Log workflow action
  await logWorkflowAction(supabase, orderId, userId, 'accept_order', 'order_assignment', 'pending', 'assigned');

  // Send notification
  await sendNotification(supabase, orderId, 'order_accepted', `Order has been accepted by shopper`);

  return new Response(
    JSON.stringify({ success: true, message: 'Order accepted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function startShopping(supabase: any, orderId: string, userId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'shopping',
      shopping_started_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('assigned_shopper_id', userId);

  if (error) {
    console.error('Start shopping error:', error);
    throw new Error('Failed to start shopping');
  }

  await logWorkflowAction(supabase, orderId, userId, 'start_shopping', 'shopping', 'assigned', 'shopping');
  await sendNotification(supabase, orderId, 'shopping_started', 'Shopper has started shopping for your order');

  return new Response(
    JSON.stringify({ success: true, message: 'Shopping started' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function markItemFound(supabase: any, itemId: string, data: any, userId: string) {
  const { foundQuantity, notes, photoUrl } = data;

  const { error } = await supabase
    .from('order_items')
    .update({
      shopping_status: 'found',
      found_quantity: foundQuantity,
      shopper_notes: notes,
      photo_url: photoUrl
    })
    .eq('id', itemId);

  if (error) {
    console.error('Mark item found error:', error);
    throw new Error('Failed to mark item as found');
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Item marked as found' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function requestSubstitution(supabase: any, itemId: string, data: any, userId: string) {
  const { reason, suggestedProduct, notes } = data;

  const { error } = await supabase
    .from('order_items')
    .update({
      shopping_status: 'substitution_needed',
      substitution_data: {
        reason,
        suggested_product: suggestedProduct,
        notes
      },
      shopper_notes: notes
    })
    .eq('id', itemId);

  if (error) {
    console.error('Request substitution error:', error);
    throw new Error('Failed to request substitution');
  }

  // Get order ID for notification
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', itemId)
    .single();

  if (orderItem) {
    await sendNotification(supabase, orderItem.order_id, 'substitution_requested', 'Substitution requested for an item');
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Substitution requested' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function completeShopping(supabase: any, orderId: string, userId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'packed',
      shopping_completed_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('assigned_shopper_id', userId);

  if (error) {
    console.error('Complete shopping error:', error);
    throw new Error('Failed to complete shopping');
  }

  await logWorkflowAction(supabase, orderId, userId, 'complete_shopping', 'shopping', 'shopping', 'packed');
  await sendNotification(supabase, orderId, 'shopping_completed', 'Your order has been packed and is ready for delivery');

  return new Response(
    JSON.stringify({ success: true, message: 'Shopping completed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function startDelivery(supabase: any, orderId: string, userId: string) {
  // First check current status
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (!currentOrder || currentOrder.status !== 'packed') {
    console.error(`Start delivery error: Order ${orderId} is not in packed status. Current status: ${currentOrder?.status}`);
    throw new Error('Order must be in packed status to start delivery');
  }

  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'in_transit',
      delivery_started_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('assigned_shopper_id', userId)
    .eq('status', 'packed'); // Only update if still packed

  if (error) {
    console.error('Start delivery error:', error);
    throw new Error('Failed to start delivery');
  }

  await logWorkflowAction(supabase, orderId, userId, 'start_delivery', 'delivery', 'packed', 'in_transit');
  await sendNotification(supabase, orderId, 'delivery_started', 'Your order is on the way!');

  return new Response(
    JSON.stringify({ success: true, message: 'Delivery started' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function completeDelivery(supabase: any, orderId: string, userId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'delivered',
      delivery_completed_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('assigned_shopper_id', userId);

  if (error) {
    console.error('Complete delivery error:', error);
    throw new Error('Failed to complete delivery');
  }

  await logWorkflowAction(supabase, orderId, userId, 'complete_delivery', 'delivery', 'in_transit', 'delivered');
  await sendNotification(supabase, orderId, 'delivery_completed', 'Your order has been delivered!');

  return new Response(
    JSON.stringify({ success: true, message: 'Delivery completed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function logWorkflowAction(
  supabase: any, 
  orderId: string, 
  actorId: string, 
  action: string, 
  phase: string, 
  previousStatus: string, 
  newStatus: string
) {
  await supabase
    .from('order_workflow_log')
    .insert({
      order_id: orderId,
      actor_id: actorId,
      action,
      phase,
      previous_status: previousStatus,
      new_status: newStatus,
      actor_role: 'shopper'
    });
}

async function sendNotification(supabase: any, orderId: string, type: string, message: string) {
  // Get order details for notification
  const { data: order } = await supabase
    .from('orders')
    .select('customer_email')
    .eq('id', orderId)
    .single();

  if (order) {
    await supabase
      .from('order_notifications')
      .insert({
        order_id: orderId,
        notification_type: type,
        recipient_type: 'customer',
        recipient_identifier: order.customer_email,
        channel: 'app',
        message_content: message
      });
  }
}