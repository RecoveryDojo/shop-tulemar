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
    // Subscribe to order status changes
    const channel = supabase
      .channel('workflow_automation')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload);
          processWorkflowEvent({
            orderId: payload.new.id,
            currentStatus: payload.new.status,
            metadata: {
              previous_status: payload.old?.status,
              updated_at: payload.new.updated_at
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rules]);

  const processWorkflowEvent = async (event: AutomationEvent) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Find applicable rules
      const applicableRules = rules.filter(rule => 
        rule.enabled && 
        rule.trigger_status === event.currentStatus &&
        checkConditions(rule.conditions, event)
      );

      for (const rule of applicableRules) {
        console.log(`Processing rule: ${rule.id} for order ${event.orderId}`);
        
        if (rule.delay_minutes) {
          // Schedule delayed execution
          setTimeout(() => executeRule(rule, event), rule.delay_minutes * 60 * 1000);
        } else {
          // Execute immediately
          await executeRule(rule, event);
        }
      }
    } catch (error) {
      console.error('Error processing workflow event:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkConditions = (conditions: Record<string, any>, event: AutomationEvent): boolean => {
    // Simple condition checking - would be more sophisticated in production
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'payment_status':
          // Would check actual payment status
          return true;
        case 'all_tasks_completed':
          // Would check stocking task completion
          return true;
        case 'duration_minutes':
          // Would check time elapsed since status change
          return true;
        default:
          return true;
      }
    }
    return true;
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

      // Auto-assign stakeholders based on business logic
      const stakeholderAssignments = [
        {
          order_id: orderId,
          role: 'shopper',
          status: 'assigned',
          notes: 'Auto-assigned by workflow automation'
        },
        {
          order_id: orderId,
          role: 'driver', 
          status: 'assigned',
          notes: 'Auto-assigned by workflow automation'
        },
        {
          order_id: orderId,
          role: 'concierge',
          status: 'assigned', 
          notes: 'Auto-assigned by workflow automation'
        }
      ];

      const { error } = await supabase
        .from('stakeholder_assignments')
        .insert(stakeholderAssignments);

      if (error) throw error;

      console.log(`Stakeholders assigned for order ${orderId}`);
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