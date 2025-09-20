import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced error types for better error handling
interface WorkflowError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  current_status?: string;
  allowed_transitions?: string[];
}

interface AuditLog {
  action: string;
  orderId: string;
  userId: string;
  timestamp: string;
  success: boolean;
  error?: string;
  metadata: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      action, 
      orderId, 
      itemId, 
      data, 
      expectedCurrentStatus,
      skipValidation = false 
    } = await req.json();

    console.log(`[${requestId}] Validated workflow action: ${action} for order ${orderId}`);
    console.log(`[${requestId}] Request payload:`, { action, orderId, itemId, expectedCurrentStatus });

    // Authentication
    const authHeader = req.headers.get('authorization');
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '');
    
    if (!user) {
      const error: WorkflowError = {
        code: 'AUTHENTICATION_FAILED',
        message: 'User authentication required',
        retryable: false,
        severity: 'high'
      };
      return createErrorResponse(error, 401, requestId);
    }

    const userId = user.id;
    console.log(`[${requestId}] Authenticated user: ${userId}`);

    // Pre-validation for all actions that involve orders
    if (orderId && !skipValidation) {
      console.log(`[${requestId}] Running pre-validation for order ${orderId}`);
      
      const validation = await validateWorkflowTransition(
        supabase, 
        orderId, 
        expectedCurrentStatus || 'unknown', 
        getTargetStatusForAction(action), 
        userId, 
        action
      );

      if (!validation.valid) {
        const error: WorkflowError = {
          code: 'VALIDATION_FAILED',
          message: validation.error || 'Validation failed',
          details: {
            currentStatus: validation.current_status,
            allowedTransitions: validation.allowed_transitions
          },
          retryable: true,
          severity: 'medium'
        };
        console.error(`[${requestId}] Validation failed:`, error);
        await logAuditEvent(supabase, {
          action,
          orderId,
          userId,
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message,
          metadata: { requestId, validation }
        });
        return createErrorResponse(error, 400, requestId);
      }
      
      console.log(`[${requestId}] Pre-validation successful`);
    }

    // Execute the requested action with comprehensive error handling
    let result;
    try {
      switch (action) {
        case 'confirm_order':
          result = await executeWithRollback(() => confirmOrder(supabase, orderId, userId), supabase, orderId, 'confirm_order');
          break;
        case 'accept_order':
          result = await executeWithRollback(() => acceptOrder(supabase, orderId, userId), supabase, orderId, 'accept_order');
          break;
        case 'start_shopping':
          result = await executeWithRollback(() => startShopping(supabase, orderId, userId), supabase, orderId, 'start_shopping');
          break;
        case 'mark_item_found':
          result = await markItemFound(supabase, itemId, data, userId);
          break;
        case 'request_substitution':
          result = await requestSubstitution(supabase, itemId, data, userId);
          break;
        case 'complete_shopping':
          result = await executeWithRollback(() => completeShopping(supabase, orderId, userId), supabase, orderId, 'complete_shopping');
          break;
        case 'start_delivery':
          result = await executeWithRollback(() => startDelivery(supabase, orderId, userId), supabase, orderId, 'start_delivery');
          break;
        case 'complete_delivery':
          result = await executeWithRollback(() => completeDelivery(supabase, orderId, userId), supabase, orderId, 'complete_delivery');
          break;
        case 'rollback_status':
          result = await rollbackOrderStatus(supabase, orderId, data.targetStatus, data.reason, userId);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Log successful action
      await logAuditEvent(supabase, {
        action,
        orderId: orderId || 'N/A',
        userId,
        timestamp: new Date().toISOString(),
        success: true,
        metadata: { 
          requestId, 
          executionTime: Date.now() - startTime,
          result: result.message || 'Success' 
        }
      });

      console.log(`[${requestId}] Action completed successfully in ${Date.now() - startTime}ms`);
      
      return new Response(
        JSON.stringify({ 
          ...result, 
          requestId,
          executionTime: Date.now() - startTime 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (actionError: any) {
      console.error(`[${requestId}] Action execution failed:`, actionError);
      
      const error: WorkflowError = {
        code: 'ACTION_EXECUTION_FAILED',
        message: actionError.message || 'Action execution failed',
        details: { action, orderId, originalError: actionError.message },
        retryable: isRetryableError(actionError),
        severity: 'high'
      };

      await logAuditEvent(supabase, {
        action,
        orderId: orderId || 'N/A',
        userId,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
        metadata: { requestId, executionTime: Date.now() - startTime }
      });

      return createErrorResponse(error, 500, requestId);
    }

  } catch (error: any) {
    console.error(`[${requestId}] Unexpected error in validated-workflow:`, error);
    
    const workflowError: WorkflowError = {
      code: 'UNEXPECTED_ERROR',
      message: error.message || 'An unexpected error occurred',
      retryable: false,
      severity: 'critical'
    };

    return createErrorResponse(workflowError, 500, requestId);
  }
});

// Validation function using database-level validation
async function validateWorkflowTransition(
  supabase: any,
  orderId: string,
  currentStatus: string,
  newStatus: string | null,
  userId: string,
  action: string
): Promise<ValidationResult> {
  if (!newStatus) {
    return { valid: true }; // Skip validation for non-status changing actions
  }

  const { data, error } = await supabase.rpc('validate_workflow_transition', {
    p_order_id: orderId,
    p_current_status: currentStatus,
    p_new_status: newStatus,
    p_user_id: userId,
    p_action: action
  });

  if (error) {
    console.error('Validation RPC error:', error);
    return { valid: false, error: 'Validation system error' };
  }

  return data;
}

// Execute action with automatic rollback on failure
async function executeWithRollback<T>(
  action: () => Promise<T>,
  supabase: any,
  orderId: string,
  actionName: string
): Promise<T> {
  // Get initial state for potential rollback
  const { data: initialOrder } = await supabase
    .from('orders')
    .select('status, assigned_shopper_id')
    .eq('id', orderId)
    .single();

  try {
    const result = await action();
    console.log(`Action ${actionName} completed successfully for order ${orderId}`);
    return result;
  } catch (error) {
    console.error(`Action ${actionName} failed for order ${orderId}, attempting rollback:`, error);
    
    // Attempt to rollback to initial state
    if (initialOrder) {
      try {
        await supabase
          .from('orders')
          .update({
            status: initialOrder.status,
            assigned_shopper_id: initialOrder.assigned_shopper_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
        
        console.log(`Successfully rolled back order ${orderId} to status ${initialOrder.status}`);
      } catch (rollbackError) {
        console.error(`Rollback failed for order ${orderId}:`, rollbackError);
      }
    }
    
    throw error;
  }
}

// Action implementations with enhanced error handling
async function confirmOrder(supabase: any, orderId: string, userId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('status', 'pending');

  if (error) {
    console.error('Confirm order error:', error);
    throw new Error(`Failed to confirm order: ${error.message}`);
  }

  await logWorkflowAction(supabase, orderId, userId, 'confirm_order', 'order_confirmation', 'pending', 'confirmed');
  await sendNotification(supabase, orderId, 'order_confirmed', 'Your order has been confirmed and is being assigned to a shopper');

  return { success: true, message: 'Order confirmed successfully' };
}

async function acceptOrder(supabase: any, orderId: string, userId: string) {
  // Multi-step operation with transaction-like behavior
  const { error: assignmentError } = await supabase
    .from('stakeholder_assignments')
    .insert({
      order_id: orderId,
      user_id: userId,
      role: 'shopper',
      status: 'accepted',
      accepted_at: new Date().toISOString()
    });

  if (assignmentError && !assignmentError.message?.includes('duplicate')) {
    console.error('Assignment error:', assignmentError);
    throw new Error(`Failed to create assignment: ${assignmentError.message}`);
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update({ 
      assigned_shopper_id: userId,
      status: 'assigned',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .in('status', ['confirmed', 'pending']);

  if (orderError) {
    // Cleanup assignment on order update failure
    await supabase
      .from('stakeholder_assignments')
      .delete()
      .eq('order_id', orderId)
      .eq('user_id', userId);
    
    throw new Error(`Failed to update order: ${orderError.message}`);
  }

  await logWorkflowAction(supabase, orderId, userId, 'accept_order', 'order_assignment', 'confirmed', 'assigned');
  await sendNotification(supabase, orderId, 'order_accepted', 'Order has been accepted by shopper');

  return { success: true, message: 'Order accepted successfully' };
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
    .eq('status', 'assigned');

  if (error) {
    throw new Error(`Failed to start shopping: ${error.message}`);
  }

  await logWorkflowAction(supabase, orderId, userId, 'start_shopping', 'shopping', 'assigned', 'shopping');
  await sendNotification(supabase, orderId, 'shopping_started', 'Shopper has started shopping for your order');

  return { success: true, message: 'Shopping started successfully' };
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
    throw new Error(`Failed to mark item as found: ${error.message}`);
  }

  return { success: true, message: 'Item marked as found' };
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
        notes,
        requested_at: new Date().toISOString()
      },
      shopper_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) {
    throw new Error(`Failed to request substitution: ${error.message}`);
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

  return { success: true, message: 'Substitution requested successfully' };
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
    .eq('status', 'shopping');

  if (error) {
    throw new Error(`Failed to complete shopping: ${error.message}`);
  }

  await logWorkflowAction(supabase, orderId, userId, 'complete_shopping', 'shopping', 'shopping', 'packed');
  await sendNotification(supabase, orderId, 'shopping_completed', 'Your order has been packed and is ready for delivery');

  return { success: true, message: 'Shopping completed successfully' };
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
    .eq('status', 'packed');

  if (error) {
    throw new Error(`Failed to start delivery: ${error.message}`);
  }

  await logWorkflowAction(supabase, orderId, userId, 'start_delivery', 'delivery', 'packed', 'in_transit');
  await sendNotification(supabase, orderId, 'delivery_started', 'Your order is on the way!');

  return { success: true, message: 'Delivery started successfully' };
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
    .eq('status', 'in_transit');

  if (error) {
    throw new Error(`Failed to complete delivery: ${error.message}`);
  }

  await logWorkflowAction(supabase, orderId, userId, 'complete_delivery', 'delivery', 'in_transit', 'delivered');
  await sendNotification(supabase, orderId, 'delivery_completed', 'Your order has been delivered!');

  return { success: true, message: 'Delivery completed successfully' };
}

async function rollbackOrderStatus(supabase: any, orderId: string, targetStatus: string, reason: string, userId: string) {
  const { data, error } = await supabase.rpc('rollback_workflow_status', {
    p_order_id: orderId,
    p_target_status: targetStatus,
    p_reason: reason
  });

  if (error || !data?.success) {
    throw new Error(data?.error || error?.message || 'Rollback failed');
  }

  return { success: true, message: data.message };
}

// Helper functions
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

function isRetryableError(error: any): boolean {
  const retryableErrorCodes = [
    'ECONNRESET',
    'ENOTFOUND', 
    'ECONNREFUSED',
    'ETIMEDOUT'
  ];
  
  return retryableErrorCodes.some(code => 
    error.code === code || error.message?.includes(code)
  );
}

function createErrorResponse(error: WorkflowError, statusCode: number, requestId: string): Response {
  return new Response(
    JSON.stringify({ 
      error: error.message, 
      code: error.code,
      retryable: error.retryable,
      severity: error.severity,
      details: error.details,
      requestId 
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
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
        source: 'validated_workflow'
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

async function logAuditEvent(supabase: any, auditLog: AuditLog) {
  try {
    await supabase
      .from('order_workflow_log')
      .insert({
        order_id: auditLog.orderId,
        actor_id: auditLog.userId,
        action: auditLog.success ? `${auditLog.action}_success` : `${auditLog.action}_failure`,
        phase: 'audit',
        new_status: auditLog.success ? 'success' : 'failure',
        metadata: auditLog.metadata,
        notes: auditLog.error || 'Action completed'
      });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}