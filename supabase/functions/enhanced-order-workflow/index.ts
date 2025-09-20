import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Status transition rules
const STATUS_TRANSITIONS = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['assigned', 'cancelled'],
  'assigned': ['shopping', 'cancelled'],
  'shopping': ['packed', 'cancelled'],
  'packed': ['in_transit', 'cancelled'],
  'in_transit': ['delivered', 'cancelled'],
  'delivered': [], // Terminal state
  'cancelled': [] // Terminal state
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, orderId, itemId, data, expectedCurrentStatus } = await req.json();
    console.log(`Enhanced workflow action: ${action} for order ${orderId}`);

    const authHeader = req.headers.get('authorization');
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '');
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    // Validate current order status before any transition
    if (orderId && expectedCurrentStatus) {
      const isValidTransition = await validateStatusTransition(supabase, orderId, expectedCurrentStatus, action);
      if (!isValidTransition) {
        throw new Error('Invalid status transition - order status has changed');
      }
    }

    switch (action) {
      case 'confirm_order':
        return await confirmOrder(supabase, orderId, userId);
      
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
      
      case 'rollback_status':
        return await rollbackStatus(supabase, orderId, data.targetStatus, userId);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in enhanced-order-workflow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function validateStatusTransition(supabase: any, orderId: string, expectedStatus: string, action: string): Promise<boolean> {
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  // Check if current status matches expected status
  if (order.status !== expectedStatus) {
    console.warn(`Status mismatch: expected ${expectedStatus}, got ${order.status}`);
    return false;
  }

  // Get target status for this action
  const targetStatus = getTargetStatusForAction(action);
  if (!targetStatus) {
    return true; // Non-status changing actions
  }

  // Check if transition is allowed
  const allowedTransitions = STATUS_TRANSITIONS[order.status] || [];
  if (!allowedTransitions.includes(targetStatus)) {
    console.warn(`Invalid transition from ${order.status} to ${targetStatus}`);
    return false;
  }

  return true;
}

function getTargetStatusForAction(action: string): string | null {
  const actionStatusMap: { [key: string]: string } = {
    'confirm_order': 'confirmed',
    'accept_order': 'assigned',
    'start_shopping': 'shopping',
    'complete_shopping': 'packed',
    'start_delivery': 'in_transit',
    'complete_delivery': 'delivered'
  };
  
  return actionStatusMap[action] || null;
}

async function confirmOrder(supabase: any, orderId: string, userId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('status', 'pending'); // Only allow if currently pending

  if (error) {
    console.error('Confirm order error:', error);
    throw new Error('Failed to confirm order');
  }

  await logWorkflowAction(supabase, orderId, userId, 'confirm_order', 'order_confirmation', 'pending', 'confirmed');
  await sendNotification(supabase, orderId, 'order_confirmed', 'Your order has been confirmed and is being assigned to a shopper');
  await broadcastStatusUpdate(supabase, orderId, 'confirmed');

  return new Response(
    JSON.stringify({ success: true, message: 'Order confirmed successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function acceptOrder(supabase: any, orderId: string, userId: string) {
  // Start transaction-like operations
  try {
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
      .update({ 
        assigned_shopper_id: userId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('status', 'confirmed'); // Only allow if currently confirmed

    if (orderError) {
      console.error('Order update error:', orderError);
      // Rollback stakeholder assignment
      await supabase
        .from('stakeholder_assignments')
        .delete()
        .eq('order_id', orderId)
        .eq('user_id', userId);
      
      throw new Error('Failed to update order - may have been accepted by another shopper');
    }

    await logWorkflowAction(supabase, orderId, userId, 'accept_order', 'order_assignment', 'confirmed', 'assigned');
    await sendNotification(supabase, orderId, 'order_accepted', `Order has been accepted by shopper`);
    await broadcastStatusUpdate(supabase, orderId, 'assigned');

    return new Response(
      JSON.stringify({ success: true, message: 'Order accepted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Accept order transaction failed:', error);
    throw error;
  }
}

async function startShopping(supabase: any, orderId: string, userId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'shopping',
      shopping_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('assigned_shopper_id', userId)
    .eq('status', 'assigned'); // Only allow if currently assigned

  if (error) {
    console.error('Start shopping error:', error);
    throw new Error('Failed to start shopping - order may have changed status');
  }

  await logWorkflowAction(supabase, orderId, userId, 'start_shopping', 'shopping', 'assigned', 'shopping');
  await sendNotification(supabase, orderId, 'shopping_started', 'Shopper has started shopping for your order');
  await broadcastStatusUpdate(supabase, orderId, 'shopping');

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
      photo_url: photoUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) {
    console.error('Mark item found error:', error);
    throw new Error('Failed to mark item as found');
  }

  // Get order ID and broadcast item update
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', itemId)
    .single();

  if (orderItem) {
    await broadcastItemUpdate(supabase, orderItem.order_id, itemId, 'found');
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
      shopper_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) {
    console.error('Request substitution error:', error);
    throw new Error('Failed to request substitution');
  }

  const { data: orderItem } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', itemId)
    .single();

  if (orderItem) {
    await sendNotification(supabase, orderItem.order_id, 'substitution_requested', 'Substitution requested for an item');
    await broadcastItemUpdate(supabase, orderItem.order_id, itemId, 'substitution_needed');
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
      shopping_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('assigned_shopper_id', userId)
    .eq('status', 'shopping'); // Only allow if currently shopping

  if (error) {
    console.error('Complete shopping error:', error);
    throw new Error('Failed to complete shopping - order may have changed status');
  }

  await logWorkflowAction(supabase, orderId, userId, 'complete_shopping', 'shopping', 'shopping', 'packed');
  await sendNotification(supabase, orderId, 'shopping_completed', 'Your order has been packed and is ready for delivery');
  await broadcastStatusUpdate(supabase, orderId, 'packed');

  return new Response(
    JSON.stringify({ success: true, message: 'Shopping completed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function startDelivery(supabase: any, orderId: string, userId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'in_transit',
      delivery_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('assigned_shopper_id', userId)
    .eq('status', 'packed'); // Only allow if currently packed

  if (error) {
    console.error('Start delivery error:', error);
    throw new Error('Failed to start delivery - order may have changed status');
  }

  await logWorkflowAction(supabase, orderId, userId, 'start_delivery', 'delivery', 'packed', 'in_transit');
  await sendNotification(supabase, orderId, 'delivery_started', 'Your order is on the way!');
  await broadcastStatusUpdate(supabase, orderId, 'in_transit');

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
      delivery_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('assigned_shopper_id', userId)
    .eq('status', 'in_transit'); // Only allow if currently in_transit

  if (error) {
    console.error('Complete delivery error:', error);
    throw new Error('Failed to complete delivery - order may have changed status');
  }

  await logWorkflowAction(supabase, orderId, userId, 'complete_delivery', 'delivery', 'in_transit', 'delivered');
  await sendNotification(supabase, orderId, 'delivery_completed', 'Your order has been delivered!');
  await broadcastStatusUpdate(supabase, orderId, 'delivered');

  return new Response(
    JSON.stringify({ success: true, message: 'Delivery completed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function rollbackStatus(supabase: any, orderId: string, targetStatus: string, userId: string) {
  // Get current order status
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  const currentStatus = order.status;

  // Validate rollback is allowed (can only rollback to previous statuses)
  const validRollbacks: { [key: string]: string[] } = {
    'assigned': ['confirmed'],
    'shopping': ['assigned'],
    'packed': ['shopping'],
    'in_transit': ['packed']
  };

  if (!validRollbacks[currentStatus]?.includes(targetStatus)) {
    throw new Error(`Cannot rollback from ${currentStatus} to ${targetStatus}`);
  }

  const { error } = await supabase
    .from('orders')
    .update({ 
      status: targetStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) {
    console.error('Rollback error:', error);
    throw new Error('Failed to rollback order status');
  }

  await logWorkflowAction(supabase, orderId, userId, 'rollback_status', 'rollback', currentStatus, targetStatus);
  await sendNotification(supabase, orderId, 'status_rollback', `Order status has been rolled back to ${targetStatus}`);
  await broadcastStatusUpdate(supabase, orderId, targetStatus);

  return new Response(
    JSON.stringify({ success: true, message: `Order rolled back to ${targetStatus}` }),
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
      actor_role: 'shopper',
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'enhanced_workflow'
      }
    });
}

async function sendNotification(supabase: any, orderId: string, type: string, message: string) {
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
        message_content: message,
        status: 'sent',
        sent_at: new Date().toISOString()
      });
  }
}

async function broadcastStatusUpdate(supabase: any, orderId: string, newStatus: string) {
  // This will trigger real-time updates via the orders table changes
  console.log(`Broadcasting status update for order ${orderId}: ${newStatus}`);
}

async function broadcastItemUpdate(supabase: any, orderId: string, itemId: string, newStatus: string) {
  // This will trigger real-time updates via the order_items table changes
  console.log(`Broadcasting item update for order ${orderId}, item ${itemId}: ${newStatus}`);
}