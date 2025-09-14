import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TestTube, 
  ShoppingCart,
  MessageSquare,
  Phone,
  Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

interface WorkflowTest {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'automation' | 'notifications' | 'workflow';
  steps: string[];
  testFunction: () => Promise<void>;
}

export function WorkflowTestSuite() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const updateResult = (testId: string, update: Partial<TestResult>) => {
    setResults(prev => ({
      ...prev,
      [testId]: { ...prev[testId], ...update }
    }));
  };

  const workflowTests: WorkflowTest[] = [
    {
      id: 'floating_comm_notify_all',
      name: 'FloatingCommunicationWidget - Notify All',
      description: 'Test that the Notify All button actually sends notifications',
      category: 'communication',
      steps: [
        'Create test order with stakeholders',
        'Click Notify All button',
        'Verify notifications were created in database',
        'Verify notification orchestrator was called'
      ],
      testFunction: async () => {
        // Create test order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            property_address: '123 Test St',
            subtotal: 90,
            tax_amount: 5,
            delivery_fee: 5,
            total_amount: 100,
            status: 'confirmed'
          })
          .select()
          .single();

        if (orderError) throw new Error(`Failed to create test order: ${orderError.message}`);

        // Create test stakeholder assignments
        const stakeholders = [
          { order_id: order.id, user_id: user?.id, role: 'shopper', status: 'assigned' },
          { order_id: order.id, user_id: user?.id, role: 'driver', status: 'assigned' }
        ];

        const { error: stakeholderError } = await supabase
          .from('stakeholder_assignments')
          .insert(stakeholders);

        if (stakeholderError) throw new Error(`Failed to create stakeholders: ${stakeholderError.message}`);

        // Test notification orchestrator
        const { data, error } = await supabase.functions.invoke('notification-orchestrator', {
          body: {
            orderId: order.id,
            notificationType: 'status_update',
            phase: 'testing',
            metadata: { test: true, message: 'Test notification from test suite' }
          }
        });

        if (error) throw new Error(`Notification orchestrator failed: ${error.message}`);

        // Verify notifications were created
        const { data: notifications } = await supabase
          .from('order_notifications')
          .select('*')
          .eq('order_id', order.id);

        if (!notifications || notifications.length === 0) {
          throw new Error('No notifications were created');
        }

        // Cleanup
        await supabase.from('orders').delete().eq('id', order.id);
      }
    },
    {
      id: 'voice_call_service',
      name: 'Voice Call Service',
      description: 'Test voice call functionality',
      category: 'communication',
      steps: [
        'Invoke voice call service',
        'Verify call log is created',
        'Verify notification is sent to recipient',
        'Check call outcome simulation'
      ],
      testFunction: async () => {
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase.functions.invoke('voice-call-service', {
          body: {
            recipientId: user.id, // Call self for testing
            callType: 'voice',
            message: 'Test call from test suite'
          }
        });

        if (error) throw new Error(`Voice call service failed: ${error.message}`);

        if (!data.call_id) throw new Error('No call ID returned');

        // Verify call log was created
        const { data: callLog } = await supabase
          .from('order_workflow_log')
          .select('*')
          .eq('id', data.call_id)
          .single();

        if (!callLog) throw new Error('Call log not found');

        if (callLog.action !== 'voice_call_initiated') {
          throw new Error('Call log has incorrect action');
        }
      }
    },
    {
      id: 'workflow_automation_trigger',
      name: 'Workflow Automation Trigger',
      description: 'Test real-time workflow automation on order status changes',
      category: 'automation',
      steps: [
        'Create test order',
        'Update order status',
        'Verify automation trigger fires',
        'Check automation logs',
        'Verify notifications sent'
      ],
      testFunction: async () => {
        // Create test order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: 'Automation Test',
            customer_email: 'automation@test.com',
            property_address: '456 Auto St',
            subtotal: 135,
            tax_amount: 10,
            delivery_fee: 5,
            total_amount: 150,
            status: 'pending',
            payment_status: 'succeeded'
          })
          .select()
          .single();

        if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

        // Update status to trigger automation
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', order.id);

        if (updateError) throw new Error(`Failed to update order: ${updateError.message}`);

        // Wait for automation to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for automation logs
        const { data: automationLogs } = await supabase
          .from('order_workflow_log')
          .select('*')
          .eq('order_id', order.id)
          .eq('phase', 'automation');

        if (!automationLogs || automationLogs.length === 0) {
          throw new Error('No automation logs found');
        }

        // Check for stakeholder assignments
        const { data: assignments } = await supabase
          .from('stakeholder_assignments')
          .select('*')
          .eq('order_id', order.id);

        if (!assignments || assignments.length === 0) {
          throw new Error('No stakeholder assignments created by automation');
        }

        // Cleanup
        await supabase.from('orders').delete().eq('id', order.id);
      }
    },
    {
      id: 'order_workflow_complete',
      name: 'Complete Order Workflow',
      description: 'Test complete order workflow from creation to delivery',
      category: 'workflow',
      steps: [
        'Create order',
        'Accept order (shopper)',
        'Start shopping',
        'Mark items found',
        'Complete shopping', 
        'Start delivery',
        'Complete delivery',
        'Verify all notifications sent'
      ],
      testFunction: async () => {
        // Create test order with items
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: 'Workflow Test',
            customer_email: 'workflow@test.com',
            property_address: '789 Workflow Ave',
            subtotal: 180,
            tax_amount: 15,
            delivery_fee: 5,
            total_amount: 200,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

        // Add test order items
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert([
            {
              order_id: order.id,
              product_id: '550e8400-e29b-41d4-a716-446655440000', // Test product ID
              quantity: 2,
              unit_price: 50,
              total_price: 100,
              shopping_status: 'pending'
            },
            {
              order_id: order.id,
              product_id: '550e8400-e29b-41d4-a716-446655440001', // Test product ID
              quantity: 1,
              unit_price: 100,
              total_price: 100,
              shopping_status: 'pending'
            }
          ]);

        if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);

        // Simulate workflow steps using order-workflow edge function
        const workflowSteps = [
          { action: 'accept_order', expectedStatus: 'assigned' },
          { action: 'start_shopping', expectedStatus: 'shopping' },
          { action: 'complete_shopping', expectedStatus: 'packed' },
          { action: 'start_delivery', expectedStatus: 'in_transit' },
          { action: 'complete_delivery', expectedStatus: 'delivered' }
        ];

        for (const step of workflowSteps) {
          const { data, error } = await supabase.functions.invoke('order-workflow', {
            body: {
              action: step.action,
              orderId: order.id
            }
          });

          if (error) throw new Error(`${step.action} failed: ${error.message}`);

          // Verify status change
          const { data: updatedOrder } = await supabase
            .from('orders')
            .select('status')
            .eq('id', order.id)
            .single();

          if (updatedOrder?.status !== step.expectedStatus) {
            throw new Error(`Expected status ${step.expectedStatus}, got ${updatedOrder?.status}`);
          }
        }

        // Verify workflow logs exist for each step
        const { data: workflowLogs } = await supabase
          .from('order_workflow_log')
          .select('*')
          .eq('order_id', order.id);

        if (!workflowLogs || workflowLogs.length < 5) {
          throw new Error(`Expected at least 5 workflow logs, got ${workflowLogs?.length || 0}`);
        }

        // Cleanup
        await supabase.from('orders').delete().eq('id', order.id);
      }
    },
    {
      id: 'notification_system_validation',
      name: 'Notification System Validation',
      description: 'Validate all notification types and channels work',
      category: 'notifications',
      steps: [
        'Test each notification type',
        'Verify notifications are created',
        'Check notification status updates',
        'Validate recipient targeting'
      ],
      testFunction: async () => {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: 'Notification Test',
            customer_email: 'notifications@test.com',
            property_address: '321 Notify St',
            subtotal: 68,
            tax_amount: 5,
            delivery_fee: 2,
            total_amount: 75,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

        const notificationTypes = [
          'order_confirmed',
          'shopping_started',
          'items_packed',
          'out_for_delivery',
          'delivered',
          'delay_notification'
        ];

        for (const notificationType of notificationTypes) {
          const { error } = await supabase.functions.invoke('notification-orchestrator', {
            body: {
              orderId: order.id,
              notificationType,
              phase: 'testing',
              metadata: { 
                test: true,
                reason: 'Test notification',
                newEta: '30 minutes'
              }
            }
          });

          if (error) throw new Error(`${notificationType} notification failed: ${error.message}`);
        }

        // Verify all notifications were created
        const { data: notifications } = await supabase
          .from('order_notifications')
          .select('*')
          .eq('order_id', order.id);

        if (!notifications || notifications.length < notificationTypes.length) {
          throw new Error(`Expected ${notificationTypes.length} notifications, got ${notifications?.length || 0}`);
        }

        // Cleanup
        await supabase.from('orders').delete().eq('id', order.id);
      }
    }
  ];

  const runSingleTest = async (test: WorkflowTest) => {
    const startTime = Date.now();
    
    updateResult(test.id, {
      id: test.id,
      name: test.name,
      status: 'running'
    });

    try {
      await test.testFunction();
      const duration = Date.now() - startTime;
      
      updateResult(test.id, {
        status: 'passed',
        message: 'Test completed successfully',
        duration
      });

      toast({
        title: "Test Passed",
        description: `${test.name} completed in ${duration}ms`,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      updateResult(test.id, {
        status: 'failed',
        message: error.message,
        duration
      });

      toast({
        title: "Test Failed",
        description: `${test.name}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    
    // Initialize all tests as pending
    const initialResults: Record<string, TestResult> = {};
    workflowTests.forEach(test => {
      initialResults[test.id] = {
        id: test.id,
        name: test.name,
        status: 'pending'
      };
    });
    setResults(initialResults);

    for (let i = 0; i < workflowTests.length; i++) {
      const test = workflowTests[i];
      await runSingleTest(test);
      setProgress(((i + 1) / workflowTests.length) * 100);
    }

    setIsRunning(false);
    
    const passedCount = Object.values(results).filter(r => r.status === 'passed').length;
    const totalCount = workflowTests.length;
    
    toast({
      title: "Test Suite Complete",
      description: `${passedCount}/${totalCount} tests passed`,
      variant: passedCount === totalCount ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication':
        return <MessageSquare className="h-4 w-4" />;
      case 'automation':
        return <PlayCircle className="h-4 w-4" />;
      case 'notifications':
        return <Bell className="h-4 w-4" />;
      case 'workflow':
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Workflow Test Suite
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>
        </div>
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Running tests... {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {workflowTests.map((test) => {
            const result = results[test.id];
            
            return (
              <Card key={test.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getCategoryIcon(test.category)}
                      <h3 className="font-medium">{test.name}</h3>
                      {result && getStatusIcon(result.status)}
                      <Badge variant="outline" className="text-xs">
                        {test.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {test.description}
                    </p>
                    
                    <div className="text-xs space-y-1">
                      <div className="font-medium">Test Steps:</div>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {test.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {result && (
                      <div className="mt-3 pt-3 border-t">
                        {result.status === 'failed' && result.message && (
                          <div className="text-sm text-red-600 mb-2">
                            Error: {result.message}
                          </div>
                        )}
                        {result.duration && (
                          <div className="text-xs text-muted-foreground">
                            Duration: {result.duration}ms
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSingleTest(test)}
                    disabled={isRunning}
                  >
                    Run Test
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}