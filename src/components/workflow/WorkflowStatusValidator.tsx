import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useEnhancedOrderWorkflow } from '@/hooks/useEnhancedOrderWorkflow';
import { useToast } from '@/hooks/use-toast';

interface StatusIssue {
  orderId: string;
  customerName: string;
  currentStatus: string;
  expectedStatus: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const WorkflowStatusValidator: React.FC = () => {
  const [issues, setIssues] = useState<StatusIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { loading: workflowLoading } = useEnhancedOrderWorkflow();
  const { toast } = useToast();

  const validateOrderStatuses = async () => {
    setLoading(true);
    try {
      // Get all active orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          status,
          assigned_shopper_id,
          shopping_started_at,
          shopping_completed_at,
          delivery_started_at,
          delivery_completed_at,
          created_at,
          updated_at
        `)
        .not('status', 'in', '(delivered,cancelled)');

      if (error) throw error;

      const foundIssues: StatusIssue[] = [];

      for (const order of orders || []) {
        // Check for Jessica's specific issue: placed → claimed
        if (order.status === 'placed' && order.assigned_shopper_id) {
          foundIssues.push({
            orderId: order.id,
            customerName: order.customer_name,
            currentStatus: order.status,
            expectedStatus: 'assigned',
            issue: 'Order has assigned shopper but status is still pending',
            severity: 'high'
          });
        }

        // Check for inconsistent status progressions
        const now = new Date();
        const orderAge = (now.getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60); // hours

        // Order stuck in placed for too long
        if (order.status === 'placed' && orderAge > 24) {
          foundIssues.push({
            orderId: order.id,
            customerName: order.customer_name,
            currentStatus: order.status,
            expectedStatus: 'confirmed',
            issue: `Order pending for ${Math.round(orderAge)} hours`,
            severity: 'medium'
          });
        }

        // Shopping started but status not updated
        if (order.shopping_started_at && order.status !== 'shopping') {
          foundIssues.push({
            orderId: order.id,
            customerName: order.customer_name,
            currentStatus: order.status,
            expectedStatus: 'shopping',
            issue: 'Shopping started but status not updated',
            severity: 'high'
          });
        }

        // Shopping completed but status not updated
        if (order.shopping_completed_at && order.status !== 'packed') {
          foundIssues.push({
            orderId: order.id,
            customerName: order.customer_name,
            currentStatus: order.status,
            expectedStatus: 'packed',
            issue: 'Shopping completed but status not updated',
            severity: 'high'
          });
        }

        // Delivery started but status not updated
        if (order.delivery_started_at && order.status !== 'in_transit') {
          foundIssues.push({
            orderId: order.id,
            customerName: order.customer_name,
            currentStatus: order.status,
            expectedStatus: 'in_transit',
            issue: 'Delivery started but status not updated',
            severity: 'critical'
          });
        }

        // Order claimed but no shopper
        if (order.status === 'claimed' && !order.assigned_shopper_id) {
          foundIssues.push({
            orderId: order.id,
            customerName: order.customer_name,
            currentStatus: order.status,
            expectedStatus: 'confirmed',
            issue: 'Status is assigned but no shopper assigned',
            severity: 'high'
          });
        }
      }

      setIssues(foundIssues);
      setLastCheck(new Date());

    } catch (error) {
      console.error('Error validating order statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixStatusIssue = async (issue: StatusIssue) => {
    try {
      // Show toast for now - manual intervention required
      toast({
        title: "Manual Fix Required",
        description: `Please manually correct status for order ${issue.orderId}`,
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error fixing status issue:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    validateOrderStatuses();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Workflow Status Validator</span>
          <Button 
            onClick={validateOrderStatuses} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Validate
          </Button>
        </CardTitle>
        <CardDescription>
          Detect and fix order status inconsistencies across the workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastCheck && (
          <div className="text-sm text-muted-foreground">
            Last check: {lastCheck.toLocaleString()}
          </div>
        )}

        {issues.length === 0 ? (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              No status inconsistencies detected. All orders are properly synchronized.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              Found {issues.length} status issue{issues.length !== 1 ? 's' : ''}:
            </div>
            
            {issues.map((issue, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(issue.severity)}
                    <span className="font-medium">{issue.customerName}</span>
                    <Badge variant="outline" className="text-xs">
                      {issue.orderId.slice(0, 8)}
                    </Badge>
                  </div>
                  <Badge variant={getSeverityColor(issue.severity) as any}>
                    {issue.severity}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {issue.issue}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span>
                    Current: <Badge variant="outline">{issue.currentStatus}</Badge>
                    {issue.expectedStatus && (
                      <>
                        {' → Expected: '}
                        <Badge variant="outline">{issue.expectedStatus}</Badge>
                      </>
                    )}
                  </span>
                  
                  {issue.expectedStatus && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fixStatusIssue(issue)}
                      disabled={workflowLoading}
                    >
                      Fix Status
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};