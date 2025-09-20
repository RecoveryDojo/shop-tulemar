import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function AssignmentTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const runFullTest = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      // Test 1: Get Test Customer order
      const testResult: any[] = [];
      
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id, customer_name, total_amount, status,
          order_items(id, products(name))
        `)
        .eq('customer_name', 'Test Customer')
        .limit(1);

      if (!orders || orders.length === 0) {
        testResult.push({ step: 'Get Orders', status: 'FAIL', message: 'No Test Customer orders found' });
        setResults(testResult);
        return;
      }

      const testOrder = orders[0];
      testResult.push({ 
        step: 'Get Orders', 
        status: 'PASS', 
        message: `Found order ${testOrder.id} with ${testOrder.order_items?.length || 0} items`
      });

      // Test 2: Get Shopper Scott
      const { data: shoppers } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .ilike('display_name', '%shopper scott%')
        .limit(1);

      if (!shoppers || shoppers.length === 0) {
        testResult.push({ step: 'Get Shopper', status: 'FAIL', message: 'Shopper Scott not found' });
        setResults(testResult);
        return;
      }

      const shopper = shoppers[0];
      testResult.push({ 
        step: 'Get Shopper', 
        status: 'PASS', 
        message: `Found ${shopper.display_name} (${shopper.email})`
      });

      // Test 3: Call assignment workflow
      const { data: assignmentResult, error: assignmentError } = await supabase.functions.invoke('assignment-workflow', {
        body: { 
          orderId: testOrder.id,
          staffId: shopper.id,
          role: 'shopper',
          adminId: user?.id
        }
      });

      if (assignmentError) {
        testResult.push({ 
          step: 'Assignment', 
          status: 'FAIL', 
          message: `Assignment failed: ${assignmentError.message}`
        });
        setResults(testResult);
        return;
      }

      testResult.push({ 
        step: 'Assignment', 
        status: 'PASS', 
        message: `Successfully assigned! Order status: ${assignmentResult?.order_details?.status}`
      });

      // Test 4: Verify assignment was created
      const { data: assignments } = await supabase
        .from('stakeholder_assignments')
        .select('*')
        .eq('order_id', testOrder.id)
        .eq('user_id', shopper.id);

      if (!assignments || assignments.length === 0) {
        testResult.push({ step: 'Verify Assignment', status: 'FAIL', message: 'No assignment record found' });
      } else {
        testResult.push({ 
          step: 'Verify Assignment', 
          status: 'PASS', 
          message: `Assignment record created with status: ${assignments[0].status}`
        });
      }

      // Test 5: Check order status update
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('status, assigned_shopper_id')
        .eq('id', testOrder.id)
        .single();

      if (updatedOrder?.status === 'assigned' && updatedOrder?.assigned_shopper_id === shopper.id) {
        testResult.push({ 
          step: 'Order Update', 
          status: 'PASS', 
          message: `Order status updated to 'assigned' with correct shopper ID`
        });
      } else {
        testResult.push({ 
          step: 'Order Update', 
          status: 'FAIL', 
          message: `Order status: ${updatedOrder?.status}, shopper ID: ${updatedOrder?.assigned_shopper_id}`
        });
      }

      // Test 6: Check notifications
      const { data: notifications } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('order_id', testOrder.id)
        .order('created_at', { ascending: false })
        .limit(5);

      testResult.push({ 
        step: 'Notifications', 
        status: 'PASS', 
        message: `${notifications?.length || 0} notifications created`
      });

      setResults(testResult);
      
      const passCount = testResult.filter(r => r.status === 'PASS').length;
      const totalCount = testResult.length;
      
      toast({
        title: "Test Complete! ✅",
        description: `${passCount}/${totalCount} tests passed. Assignment workflow is ${passCount === totalCount ? 'working perfectly' : 'partially working'}.`,
      });

    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed ❌",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Assignment Workflow Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runFullTest} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Run Full Assignment Test'}
        </Button>
        
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded">
                <Badge variant={result.status === 'PASS' ? 'default' : 'destructive'}>
                  {result.status}
                </Badge>
                <div>
                  <div className="font-medium">{result.step}</div>
                  <div className="text-sm text-muted-foreground">{result.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}