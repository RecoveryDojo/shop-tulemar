import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ALLOWED_TRANSITIONS map - defines valid state transitions
const ALLOWED_TRANSITIONS = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['assigned', 'cancelled'],
  'assigned': ['shopping', 'cancelled'],
  'shopping': ['packed', 'cancelled'],
  'packed': ['in_transit', 'cancelled'],
  'in_transit': ['delivered', 'cancelled'],
  'delivered': ['closed'], // Allow closing delivered orders
  'cancelled': [], // Terminal state
  'closed': [] // Terminal state
} as const;

// Error constants for consistent error handling
const ERRORS = {
  STALE_WRITE: 'STALE_WRITE',
  ILLEGAL_TRANSITION: 'ILLEGAL_TRANSITION',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS'
} as const;

interface Actor {
  id: string;
  role: string;
}

interface ActionParams {
  orderId: string;
  to: string;
  expectedStatus: string;
  actor: Actor;
  data?: any;
  itemId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Enhanced workflow request:', body);

    const authHeader = req.headers.get('authorization');
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '');
    
    if (!user) {
      throw new Error(ERRORS.UNAUTHORIZED);
    }

    // Handle legacy action-based calls (for backwards compatibility)
    if (body.action) {
      return await handleLegacyAction(supabase, body, user.id);
    }

    // New guarded status transition API
    const { orderId, to, expectedStatus, actor, data, itemId } = body as ActionParams;

    if (!orderId || !to || !expectedStatus || !actor) {
      throw new Error(`${ERRORS.INVALID_PARAMETERS}: Missing required parameters: orderId, to, expectedStatus, actor`);
    }

    // Execute guarded status transition
    const result = await advanceOrderStatus(supabase, {
      orderId,
      to,
      expectedStatus,
      actor,
      data,
      itemId
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhanced-order-workflow:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let status = 400;
    
    if (errorMessage === ERRORS.UNAUTHORIZED) {
      status = 401;
    } else if (errorMessage === ERRORS.ORDER_NOT_FOUND) {
      status = 404;
    } else if (errorMessage.startsWith(ERRORS.STALE_WRITE)) {
      status = 409; // Conflict
    } else if (errorMessage.startsWith(ERRORS.ILLEGAL_TRANSITION)) {
      status = 422; // Unprocessable Entity
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        errorCode: errorMessage.split(':')[0] || 'UNKNOWN_ERROR'
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Guarded status transition function with database transaction
 */
async function advanceOrderStatus(supabase: any, params: ActionParams) {
  const { orderId, to, expectedStatus, actor } = params;

  console.log(`Advancing order ${orderId} from ${expectedStatus} to ${to} by ${actor.role}:${actor.id}`);

  // Start transaction-like operations (Supabase doesn't have true transactions, so we simulate)
  try {
    // Step (a): Fetch current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      console.error('Order fetch error:', fetchError);
      throw new Error(`${ERRORS.ORDER_NOT_FOUND}: Order ${orderId} not found`);
    }

    // Step (b): Check if current status matches expected status  
    if (currentOrder.status !== expectedStatus) {
      const message = `${ERRORS.STALE_WRITE}: Expected status '${expectedStatus}', but order is currently '${currentOrder.status}'`;
      console.error(message);
      throw new Error(message);
    }

    // Step (c): Validate transition is allowed
    const allowedTransitions = ALLOWED_TRANSITIONS[currentOrder.status as keyof typeof ALLOWED_TRANSITIONS] || [];
    if (!Array.from(allowedTransitions).includes(to as any)) {
      const message = `${ERRORS.ILLEGAL_TRANSITION}: Cannot transition from '${currentOrder.status}' to '${to}'. Allowed: [${allowedTransitions.join(', ')}]`;
      console.error(message);
      throw new Error(message);
    }

    // Additional business rule validations based on target status
    await validateBusinessRules(supabase, currentOrder, to, actor);

    // Step (d): Update order status
    const updateData: any = {
      status: to,
      updated_at: new Date().toISOString()
    };

    // Set specific timestamps based on status
    if (to === 'assigned') updateData.assigned_shopper_id = actor.id;
    if (to === 'shopping') updateData.shopping_started_at = new Date().toISOString();
    if (to === 'packed') updateData.shopping_completed_at = new Date().toISOString();
    if (to === 'in_transit') updateData.delivery_started_at = new Date().toISOString();
    if (to === 'delivered') updateData.delivery_completed_at = new Date().toISOString();

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('status', expectedStatus) // Ensure status hasn't changed since we checked
      .select('*, order_items(*)')
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      throw new Error(`${ERRORS.STALE_WRITE}: Order status changed during update`);
    }

    // Step (e): Append event log
    const { error: logError } = await supabase
      .from('order_workflow_log')
      .insert({
        order_id: orderId,
        actor_id: actor.id,
        action: `advance_status_to_${to}`,
        phase: getPhaseForStatus(to),
        previous_status: expectedStatus,
        new_status: to,
        actor_role: actor.role,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'guarded_workflow',
          transition_type: 'STATUS_CHANGED',
          payload: { from: expectedStatus, to }
        }
      });

    if (logError) {
      console.error('Failed to log workflow event:', logError);
      // Don't fail the whole operation for logging errors
    }

    // Step (f): Broadcast to order-{orderId} channel
    await broadcastOrderEvent(supabase, orderId, 'STATUS_CHANGED', {
      from: expectedStatus,
      to,
      actor: actor.id,
      timestamp: new Date().toISOString()
    });

    // Send notifications
    await sendStatusNotification(supabase, orderId, to);

    // Step (g): Return fresh order data
    return new Response(JSON.stringify({
      success: true,
      order: updatedOrder,
      message: `Order status advanced from ${expectedStatus} to ${to}`,
      transition: { from: expectedStatus, to }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

async function validateBusinessRules(supabase: any, order: any, targetStatus: string, actor: Actor) {
  // Validate user permissions
  if (targetStatus === 'assigned' && actor.role !== 'shopper' && actor.role !== 'admin' && actor.role !== 'sysadmin') {
    throw new Error(`${ERRORS.UNAUTHORIZED}: Only shoppers can accept orders`);
  }

  if (['shopping', 'packed', 'in_transit', 'delivered'].includes(targetStatus)) {
    if (order.assigned_shopper_id !== actor.id && actor.role !== 'admin' && actor.role !== 'sysadmin') {
      throw new Error(`${ERRORS.UNAUTHORIZED}: Only the assigned shopper can perform this action`);
    }
  }

  // Validate order assignment
  if (targetStatus === 'assigned' && order.assigned_shopper_id && order.assigned_shopper_id !== actor.id) {
    throw new Error(`${ERRORS.ILLEGAL_TRANSITION}: Order already assigned to another shopper`);
  }

  // Validate all items are processed before delivery
  if (targetStatus === 'in_transit') {
    const pendingItems = order.order_items?.filter((item: any) => item.shopping_status === 'pending') || [];
    if (pendingItems.length > 0) {
      throw new Error(`${ERRORS.ILLEGAL_TRANSITION}: Cannot start delivery with ${pendingItems.length} unprocessed items`);
    }
  }
}

function getPhaseForStatus(status: string): string {
  const phaseMap: { [key: string]: string } = {
    'confirmed': 'order_confirmation',
    'assigned': 'order_assignment', 
    'shopping': 'shopping',
    'packed': 'shopping',
    'in_transit': 'delivery',
    'delivered': 'delivery',
    'closed': 'completion',
    'cancelled': 'cancellation'
  };
  return phaseMap[status] || 'general';
}

async function broadcastOrderEvent(supabase: any, orderId: string, eventType: string, payload: any) {
  try {
    const channelName = `order-${orderId}`;
    console.log(`Broadcasting ${eventType} to ${channelName}:`, payload);
    
    // In a full implementation, this would use Supabase realtime channels
    // For now, we'll use the broadcast-order-event function
    await supabase.functions.invoke('broadcast-order-event', {
      body: {
        orderId,
        eventType,
        data: payload
      }
    });
  } catch (error) {
    console.error('Failed to broadcast order event:', error);
    // Don't fail the operation for broadcast errors
  }
}

async function sendStatusNotification(supabase: any, orderId: string, status: string) {
  const messageMap: { [key: string]: string } = {
    'confirmed': 'Your order has been confirmed and is being assigned to a shopper',
    'assigned': 'Your order has been assigned to a shopper',
    'shopping': 'Your shopper has started shopping for your order',
    'packed': 'Your order has been packed and is ready for delivery',
    'in_transit': 'Your order is on the way!',
    'delivered': 'Your order has been delivered!',
    'closed': 'Your order is complete',
    'cancelled': 'Your order has been cancelled'
  };

  const message = messageMap[status] || `Order status updated to ${status}`;

  try {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_email')
      .eq('id', orderId)
      .single();

    if (order?.customer_email) {
      await supabase
        .from('order_notifications')
        .insert({
          order_id: orderId,
          notification_type: `status_${status}`,
          recipient_type: 'customer',
          recipient_identifier: order.customer_email,
          channel: 'in_app',
          status: 'pending',
          message_content: message
        });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Legacy action handler for backwards compatibility
 */
async function handleLegacyAction(supabase: any, body: any, userId: string) {
  const { action, orderId, itemId, data, expectedCurrentStatus } = body;
  
  console.log(`Legacy action: ${action} for order ${orderId}`);

  // Map legacy actions to new status transitions
  const actionStatusMap: { [key: string]: string } = {
    'confirm_order': 'confirmed',
    'accept_order': 'assigned',
    'start_shopping': 'shopping',
    'complete_shopping': 'packed',
    'start_delivery': 'in_transit',
    'complete_delivery': 'delivered'
  };

  const targetStatus = actionStatusMap[action];
  
  if (targetStatus && orderId && expectedCurrentStatus) {
    // Use new guarded API for status changes
    return await advanceOrderStatus(supabase, {
      orderId,
      to: targetStatus,
      expectedStatus: expectedCurrentStatus,
      actor: { id: userId, role: 'shopper' },
      data,
      itemId
    });
  }

  // Handle non-status changing actions
  if (action === 'mark_item_found') {
    return await markItemFound(supabase, itemId, data);
  }

  if (action === 'request_substitution') {
    return await requestSubstitution(supabase, itemId, data);
  }

  if (action === 'rollback_status') {
    return await rollbackStatus(supabase, orderId, data.targetStatus, userId);
  }

  throw new Error(`${ERRORS.INVALID_PARAMETERS}: Unknown action: ${action}`);
}

async function markItemFound(supabase: any, itemId: string, data: any) {
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

  return new Response(JSON.stringify({
    success: true,
    message: 'Item marked as found'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function requestSubstitution(supabase: any, itemId: string, data: any) {
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

  return new Response(JSON.stringify({
    success: true,
    message: 'Substitution requested'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function rollbackStatus(supabase: any, orderId: string, targetStatus: string, userId: string) {
  // Use database function for rollback validation
  const { data: result, error } = await supabase
    .rpc('rollback_workflow_status', {
      p_order_id: orderId,
      p_target_status: targetStatus,
      p_reason: 'Manual rollback via API'
    });

  if (error) {
    console.error('Rollback error:', error);
    throw new Error(error.message || 'Failed to rollback order status');
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Order rolled back to ${targetStatus}`,
    result
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}