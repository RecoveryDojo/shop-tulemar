import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface AutomationRequest {
  orderId: string;
  currentStatus: string;
  previousStatus?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, currentStatus, previousStatus, metadata }: AutomationRequest = await req.json();

    console.log(`Processing automation for order ${orderId}: ${previousStatus} -> ${currentStatus}`);

    // Get order details with timestamps
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Define automation rules
    const automationRules = [
      {
        id: 'auto_assign_on_confirm',
        trigger_status: 'confirmed',
        conditions: { payment_status: 'succeeded' },
        actions: ['assign_stakeholders', 'send_notifications'],
        enabled: true
      },
      {
        id: 'auto_start_shopping_notification',
        trigger_status: 'shopping',
        conditions: {},
        actions: ['send_notifications'],
        enabled: true
      },
      {
        id: 'auto_delivery_notification',
        trigger_status: 'in_transit',
        conditions: {},
        actions: ['send_notifications', 'estimate_delivery_time'],
        enabled: true
      },
      {
        id: 'auto_completion_handling',
        trigger_status: 'delivered',
        conditions: {},
        actions: ['send_notifications', 'log_completion'],
        enabled: true
      }
    ];

    // Find applicable rules
    const applicableRules = automationRules.filter(rule => 
      rule.enabled && 
      rule.trigger_status === currentStatus &&
      await checkConditions(rule.conditions, order)
    );

    console.log(`Found ${applicableRules.length} applicable automation rules`);

    for (const rule of applicableRules) {
      console.log(`Executing automation rule: ${rule.id}`);

      // Execute each action in the rule
      for (const action of rule.actions) {
        await executeAutomationAction(action, orderId, order, rule, metadata);
      }

      // Log the automation execution
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: orderId,
          phase: 'automation',
          action: `rule_executed_${rule.id}`,
          notes: `Automated workflow rule executed: ${rule.id}`,
          metadata: {
            rule_id: rule.id,
            trigger_status: rule.trigger_status,
            actions: rule.actions,
            previous_status: previousStatus
          }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        rules_executed: applicableRules.length,
        order_id: orderId,
        status: currentStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in workflow automation trigger:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function checkConditions(conditions: Record<string, any>, order: any): Promise<boolean> {
  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case 'payment_status':
        if (order.payment_status !== value) {
          console.log(`Condition failed: payment_status is ${order.payment_status}, expected ${value}`);
          return false;
        }
        break;
        
      case 'all_tasks_completed':
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('shopping_status')
          .eq('order_id', order.id);
        
        const allCompleted = orderItems?.every(item => item.shopping_status === 'found') || false;
        if (!allCompleted) {
          console.log(`Condition failed: not all tasks completed for order ${order.id}`);
          return false;
        }
        break;
        
      case 'duration_minutes':
        const startTime = order.shopping_started_at || order.updated_at;
        const elapsed = (Date.now() - new Date(startTime).getTime()) / (1000 * 60);
        
        if (elapsed < value) {
          console.log(`Condition failed: elapsed time ${elapsed}min < required ${value}min`);
          return false;
        }
        break;
        
      default:
        console.warn(`Unknown condition: ${key}`);
        return true;
    }
  }
  return true;
}

async function executeAutomationAction(action: string, orderId: string, order: any, rule: any, metadata?: any) {
  console.log(`Executing action: ${action} for order ${orderId}`);

  switch (action) {
    case 'assign_stakeholders':
      await assignStakeholders(orderId);
      break;
      
    case 'send_notifications':
      await sendAutomatedNotifications(orderId, rule.trigger_status, metadata);
      break;
      
    case 'estimate_delivery_time':
      await estimateDeliveryTime(orderId, order);
      break;
      
    case 'log_completion':
      await logOrderCompletion(orderId);
      break;
      
    default:
      console.warn(`Unknown automation action: ${action}`);
  }
}

async function assignStakeholders(orderId: string) {
  try {
    // Check if assignments already exist
    const { data: existingAssignments } = await supabase
      .from('stakeholder_assignments')
      .select('role')
      .eq('order_id', orderId);

    const existingRoles = existingAssignments?.map(a => a.role) || [];
    const rolesToAssign = ['shopper', 'driver', 'concierge'].filter(role => !existingRoles.includes(role));

    for (const role of rolesToAssign) {
      // Get available users with this role
      const { data: availableUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role as any);

      if (!availableUsers || availableUsers.length === 0) {
        console.warn(`No available users found for role: ${role}`);
        continue;
      }

      // Simple assignment - pick first available user
      // In production, this would consider workload, availability, etc.
      const selectedUser = availableUsers[0];

      const { error } = await supabase
        .from('stakeholder_assignments')
        .insert({
          order_id: orderId,
          user_id: selectedUser.user_id,
          role: role,
          status: 'assigned',
          notes: 'Auto-assigned by workflow automation'
        });

      if (error) {
        console.error(`Error assigning ${role}:`, error);
      } else {
        console.log(`Assigned ${role} (${selectedUser.user_id}) to order ${orderId}`);
      }
    }
  } catch (error) {
    console.error('Error in assignStakeholders:', error);
  }
}

async function sendAutomatedNotifications(orderId: string, triggerStatus: string, metadata?: any) {
  try {
    // Map status to notification type
    const statusToNotification = {
      'confirmed': 'order_confirmed',
      'shopping': 'shopping_started',
      'packed': 'items_packed',
      'in_transit': 'out_for_delivery',
      'delivered': 'delivered'
    };

    const notificationType = statusToNotification[triggerStatus] || 'status_update';

    await supabase.functions.invoke('notification-orchestrator', {
      body: {
        orderId,
        notificationType,
        phase: triggerStatus,
        metadata: { ...metadata, automated: true }
      }
    });

    console.log(`Sent automated notifications for ${notificationType}`);
  } catch (error) {
    console.error('Error sending automated notifications:', error);
  }
}

async function estimateDeliveryTime(orderId: string, order: any) {
  try {
    // Simple delivery time estimation (in production, use real routing/traffic data)
    const baseDeliveryTime = 45; // minutes
    const estimatedDelivery = new Date(Date.now() + baseDeliveryTime * 60 * 1000);

    // Update order with estimated delivery time
    await supabase
      .from('orders')
      .update({ 
        estimated_delivery_time: estimatedDelivery.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    console.log(`Estimated delivery time updated for order ${orderId}: ${estimatedDelivery}`);
  } catch (error) {
    console.error('Error estimating delivery time:', error);
  }
}

async function logOrderCompletion(orderId: string) {
  try {
    await supabase
      .from('order_workflow_log')
      .insert({
        order_id: orderId,
        phase: 'completion',
        action: 'automated_completion_logged',
        notes: 'Order completion automatically logged by workflow system',
        metadata: { 
          automated: true, 
          completion_time: new Date().toISOString(),
          logged_by: 'workflow_automation'
        }
      });

    console.log(`Logged completion for order ${orderId}`);
  } catch (error) {
    console.error('Error logging completion:', error);
  }
}