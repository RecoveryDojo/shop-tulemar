import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowRule {
  id: string;
  trigger_status: string;
  target_status: string;
  conditions: Record<string, any>;
  actions: string[];
  delay_minutes?: number;
  enabled: boolean;
}

interface AutomationEvent {
  orderId: string;
  currentStatus: string;
  metadata?: Record<string, any>;
}

const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'auto_assign_on_confirm',
    trigger_status: 'confirmed',
    target_status: 'assigned',
    conditions: { payment_status: 'succeeded' },
    actions: ['assign_stakeholders', 'send_notifications'],
    enabled: true
  },
  {
    id: 'auto_complete_stocking',
    trigger_status: 'stocking',
    target_status: 'completed',
    conditions: { all_tasks_completed: true },
    actions: ['send_completion_notifications', 'log_completion'],
    delay_minutes: 5,
    enabled: true
  },
  {
    id: 'escalate_delays',
    trigger_status: 'shopping',
    target_status: 'shopping',
    conditions: { duration_minutes: 120 },
    actions: ['send_delay_notification', 'escalate_to_manager'],
    enabled: true
  }
];

export function useWorkflowAutomation() {
  const [rules, setRules] = useState<WorkflowRule[]>(DEFAULT_WORKFLOW_RULES);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to order status changes for real-time automation
    const channel = supabase
      .channel('workflow_automation')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          console.log('Order updated for automation:', payload);
          
          const orderId = payload.new.id;
          const currentStatus = payload.new.status;
          const previousStatus = payload.old?.status;
          
          // Only trigger automation if status actually changed
          if (currentStatus !== previousStatus) {
            try {
              // Call the automation trigger edge function
              const { data, error } = await supabase.functions.invoke('workflow-automation-trigger', {
                body: {
                  orderId,
                  currentStatus,
                  previousStatus,
                  metadata: {
                    updated_at: payload.new.updated_at,
                    payment_status: payload.new.payment_status
                  }
                }
              });

              if (error) {
                console.error('Automation trigger failed:', error);
              } else {
                console.log('Automation triggered successfully:', data);
              }
            } catch (error) {
              console.error('Error triggering automation:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const processWorkflowEvent = async (event: AutomationEvent) => {
    if (isProcessing) return;
    
    // Prevent processing the same event multiple times
    const eventKey = `${event.orderId}-${event.currentStatus}-${Date.now()}`;
    
    setIsProcessing(true);
    
    try {
      // Check if we've already processed this exact event recently (prevent duplicates)
      const { data: recentLogs } = await supabase
        .from('order_workflow_log')
        .select('id')
        .eq('order_id', event.orderId)
        .eq('action', `automation_processed`)
        .gte('timestamp', new Date(Date.now() - 60000).toISOString()) // Last minute
        .limit(1);

      if (recentLogs && recentLogs.length > 0) {
        console.log(`Skipping duplicate automation for order ${event.orderId}`);
        return;
      }

      // Find applicable rules
      const applicableRules = [];
      for (const rule of rules) {
        if (rule.enabled && 
            rule.trigger_status === event.currentStatus &&
            await checkConditions(rule.conditions, event)) {
          applicableRules.push(rule);
        }
      }

      // Log that we processed this event
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: event.orderId,
          phase: 'automation',
          action: 'automation_processed',
          notes: `Processed automation for status: ${event.currentStatus}`,
          metadata: { event_key: eventKey, applicable_rules: applicableRules.length }
        });

      for (const rule of applicableRules) {
        console.log(`Processing rule: ${rule.id} for order ${event.orderId}`);
        
        if (rule.delay_minutes) {
          // Schedule delayed execution with safety check
          setTimeout(async () => {
            // Re-check conditions before delayed execution
            if (await checkConditions(rule.conditions, event)) {
              await executeRule(rule, event);
            } else {
              console.log(`Delayed rule ${rule.id} conditions no longer met for order ${event.orderId}`);
            }
          }, rule.delay_minutes * 60 * 1000);
        } else {
          // Execute immediately
          await executeRule(rule, event);
        }
      }
    } catch (error) {
      console.error('Error processing workflow event:', error);
      
      // Log the error for debugging
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: event.orderId,
          phase: 'automation',
          action: 'automation_error',
          notes: `Error processing automation: ${error.message}`,
          metadata: { error: error.message, event_key: eventKey }
        });
    } finally {
      setIsProcessing(false);
    }
  };

  const checkConditions = async (conditions: Record<string, any>, event: AutomationEvent): Promise<boolean> => {
    try {
      for (const [key, value] of Object.entries(conditions)) {
        switch (key) {
          case 'payment_status':
            const { data: order } = await supabase
              .from('orders')
              .select('payment_status')
              .eq('id', event.orderId)
              .single();
            
            if (!order || order.payment_status !== value) {
              console.log(`Condition failed: payment_status is ${order?.payment_status}, expected ${value}`);
              return false;
            }
            break;
            
          case 'all_tasks_completed':
            const { data: orderItems } = await supabase
              .from('order_items')
              .select('shopping_status')
              .eq('order_id', event.orderId);
            
            const allCompleted = orderItems?.every(item => item.shopping_status === 'found') || false;
            if (!allCompleted) {
              console.log(`Condition failed: not all tasks completed for order ${event.orderId}`);
              return false;
            }
            break;
            
          case 'duration_minutes':
            const { data: orderData } = await supabase
              .from('orders')
              .select('updated_at, shopping_started_at')
              .eq('id', event.orderId)
              .single();
            
            if (!orderData) return false;
            
            const startTime = orderData.shopping_started_at || orderData.updated_at;
            const elapsed = (Date.now() - new Date(startTime).getTime()) / (1000 * 60);
            
            if (elapsed < value) {
              console.log(`Condition failed: elapsed time ${elapsed}min < required ${value}min`);
              return false;
            }
            break;
            
          default:
            console.warn(`Unknown condition: ${key}`);
            return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking conditions:', error);
      return false;
    }
  };

  const executeRule = async (rule: WorkflowRule, event: AutomationEvent) => {
    try {
      for (const action of rule.actions) {
        await executeAction(action, event, rule);
      }

      // Log the automation execution
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: event.orderId,
          phase: 'automation',
          action: `rule_executed_${rule.id}`,
          notes: `Automated workflow rule executed: ${rule.id}`,
          metadata: {
            rule_id: rule.id,
            trigger_status: rule.trigger_status,
            target_status: rule.target_status,
            actions: rule.actions
          }
        });

      console.log(`Successfully executed rule ${rule.id} for order ${event.orderId}`);
      
    } catch (error) {
      console.error(`Error executing rule ${rule.id}:`, error);
    }
  };

  const executeAction = async (action: string, event: AutomationEvent, rule: WorkflowRule) => {
    switch (action) {
      case 'assign_stakeholders':
        await assignStakeholders(event.orderId);
        break;
        
      case 'send_notifications':
        await sendAutomatedNotifications(event.orderId, rule.trigger_status);
        break;
        
      case 'send_completion_notifications':
        await sendCompletionNotifications(event.orderId);
        break;
        
      case 'send_delay_notification':
        await sendDelayNotification(event.orderId);
        break;
        
      case 'escalate_to_manager':
        await escalateToManager(event.orderId);
        break;
        
      case 'update_status':
        await updateOrderStatus(event.orderId, rule.target_status);
        break;
        
      case 'log_completion':
        await logOrderCompletion(event.orderId);
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  const assignStakeholders = async (orderId: string) => {
    try {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) return;

      // Check if assignments already exist to prevent duplicates
      const { data: existingAssignments } = await supabase
        .from('stakeholder_assignments')
        .select('role')
        .eq('order_id', orderId);

      const existingRoles = existingAssignments?.map(a => a.role) || [];

      // Find available users for each role
      const rolesToAssign = ['shopper', 'driver', 'concierge'].filter(role => !existingRoles.includes(role));
      
      for (const role of rolesToAssign) {
        // Get available users with this role and minimal current workload
        const { data: availableUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', role as any);

        if (!availableUsers || availableUsers.length === 0) {
          console.warn(`No available users found for role: ${role}`);
          continue;
        }

        // Get profile data for these users
        const userIds = availableUsers.map(u => u.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, status')
          .in('id', userIds);

        // Simple round-robin assignment - pick first available user
        // In production, this could be more sophisticated (workload-based, availability, etc.)
        const selectedUser = availableUsers.find(user => {
          const profile = profiles?.find(p => p.id === user.user_id);
          return profile && profile.status !== 'busy';
        }) || availableUsers[0];

        if (selectedUser) {
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
      }
    } catch (error) {
      console.error('Error assigning stakeholders:', error);
    }
  };

  const sendAutomatedNotifications = async (orderId: string, triggerStatus: string) => {
    try {
      await supabase.functions.invoke('notification-orchestrator', {
        body: {
          orderId,
          notificationType: 'order_confirmed',
          phase: 'confirmation',
          metadata: { automated: true }
        }
      });
    } catch (error) {
      console.error('Error sending automated notifications:', error);
    }
  };

  const sendCompletionNotifications = async (orderId: string) => {
    try {
      await supabase.functions.invoke('notification-orchestrator', {
        body: {
          orderId,
          notificationType: 'stocking_complete',
          phase: 'completion',
          metadata: { automated: true }
        }
      });
    } catch (error) {
      console.error('Error sending completion notifications:', error);
    }
  };

  const sendDelayNotification = async (orderId: string) => {
    try {
      await supabase.functions.invoke('notification-orchestrator', {
        body: {
          orderId,
          notificationType: 'delay_notification',
          phase: 'shopping',
          metadata: { 
            automated: true,
            reason: 'Extended shopping time detected',
            newEta: '30 minutes'
          }
        }
      });
    } catch (error) {
      console.error('Error sending delay notification:', error);
    }
  };

  const escalateToManager = async (orderId: string) => {
    try {
      // Would send notification to management team
      await supabase
        .from('order_notifications')
        .insert({
          order_id: orderId,
          notification_type: 'escalation',
          recipient_type: 'system',
          recipient_identifier: 'manager@system',
          channel: 'email',
          message_content: `Order ${orderId} requires management attention due to extended processing time.`,
          metadata: { automated: true, escalation_reason: 'extended_duration' }
        });

      console.log(`Order ${orderId} escalated to management`);
    } catch (error) {
      console.error('Error escalating to manager:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const logOrderCompletion = async (orderId: string) => {
    try {
      await supabase
        .from('order_workflow_log')
        .insert({
          order_id: orderId,
          phase: 'completion',
          action: 'automated_completion_logged',
          notes: 'Order completion automatically logged by workflow system',
          metadata: { automated: true, completion_time: new Date().toISOString() }
        });
    } catch (error) {
      console.error('Error logging completion:', error);
    }
  };

  const triggerManualAutomation = async (orderId: string, ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) {
      toast({
        title: "Error",
        description: "Automation rule not found",
        variant: "destructive"
      });
      return;
    }

    try {
      await executeRule(rule, {
        orderId,
        currentStatus: rule.trigger_status,
        metadata: { manual_trigger: true }
      });

      toast({
        title: "Automation Triggered",
        description: `Successfully executed rule: ${rule.id}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute automation rule",
        variant: "destructive"
      });
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ));
  };

  return {
    rules,
    isProcessing,
    processWorkflowEvent,
    triggerManualAutomation,
    toggleRule
  };
}