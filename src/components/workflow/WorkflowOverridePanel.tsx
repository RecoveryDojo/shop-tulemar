import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function WorkflowOverridePanel() {
  const [orderId, setOrderId] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validStatuses = [
    'pending', 'confirmed', 'assigned', 'shopping', 
    'packed', 'in_transit', 'delivered', 'cancelled'
  ];

  const forceStatusChange = async () => {
    if (!orderId || !targetStatus || !reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get current order status first
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status, customer_name')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Force status change
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: targetStatus
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Log the override
      await supabase.from('order_workflow_log').insert({
        order_id: orderId,
        phase: 'admin_override',
        action: 'force_status_change',
        actor_role: 'admin',
        previous_status: currentOrder.status,
        new_status: targetStatus,
        notes: `ADMIN OVERRIDE: ${reason}`
      });

      toast({
        title: "Status Override Complete",
        description: `Order ${orderId.slice(-6)} status changed from ${currentOrder.status} to ${targetStatus}`
      });

      // Clear form
      setOrderId('');
      setTargetStatus('');
      setReason('');
    } catch (error: any) {
      console.error('Error forcing status change:', error);
      toast({
        title: "Override Failed",
        description: error.message || "Failed to override order status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const rollbackOrder = async () => {
    if (!orderId || !reason) {
      toast({
        title: "Missing Information", 
        description: "Please enter order ID and reason",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get last workflow log entry to determine previous status
      const { data: lastLog, error: logError } = await supabase
        .from('order_workflow_log')
        .select('previous_status, new_status')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (logError) throw logError;

      const rollbackStatus = lastLog.previous_status || 'pending';

      // Rollback status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: rollbackStatus
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Log the rollback
      await supabase.from('order_workflow_log').insert({
        order_id: orderId,
        phase: 'admin_override',
        action: 'rollback_status',
        actor_role: 'admin',
        previous_status: lastLog.new_status,
        new_status: rollbackStatus,
        notes: `ADMIN ROLLBACK: ${reason}`
      });

      toast({
        title: "Order Rolled Back",
        description: `Order ${orderId.slice(-6)} rolled back to ${rollbackStatus}`
      });

      setOrderId('');
      setReason('');
    } catch (error: any) {
      console.error('Error rolling back order:', error);
      toast({
        title: "Rollback Failed",
        description: error.message || "Failed to rollback order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Shield className="h-5 w-5" />
          Emergency Workflow Override
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          Use only when normal workflow is broken
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Order ID</label>
            <Input
              placeholder="Enter full order ID..."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Force Status Change</label>
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target status" />
                </SelectTrigger>
                <SelectContent>
                  {validStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      <Badge variant="outline">{status}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={rollbackOrder}
                variant="outline"
                disabled={loading || !orderId}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback Last Action
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Reason for Override *</label>
            <Textarea
              placeholder="Explain why this override is necessary..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <Button
            onClick={forceStatusChange}
            disabled={loading || !orderId || !targetStatus || !reason}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            {loading ? 'Processing Override...' : 'Execute Override'}
          </Button>

          <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
            <strong>Warning:</strong> This bypasses all normal workflow validation. 
            Use only for emergency situations when the normal workflow is broken. 
            All overrides are logged and auditable.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}