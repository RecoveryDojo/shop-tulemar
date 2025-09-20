import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, X, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  items_count: number;
  special_instructions?: string;
  created_at: string;
  payment_status: string;
}

export function OrderConfirmationPanel() {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [confirmationNotes, setConfirmationNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, customer_name, customer_email, total_amount, 
          special_instructions, created_at, payment_status,
          order_items(count)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedOrders = data.map(order => ({
        ...order,
        items_count: order.order_items?.[0]?.count || 0
      }));

      setPendingOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Log the confirmation
      await supabase.from('order_workflow_log').insert({
        order_id: orderId,
        phase: 'confirmation',
        action: 'order_confirmed',
        actor_role: 'admin',
        notes: confirmationNotes[orderId] || 'Order confirmed by admin'
      });

      toast({
        title: "Order Confirmed",
        description: "Order confirmed and ready for shopper assignment"
      });

      fetchPendingOrders();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: "Error",
        description: "Failed to confirm order",
        variant: "destructive"
      });
    }
  };

  const rejectOrder = async (orderId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      await supabase.from('order_workflow_log').insert({
        order_id: orderId,
        phase: 'confirmation',
        action: 'order_rejected',
        actor_role: 'admin',
        notes: reason
      });

      toast({
        title: "Order Rejected",
        description: "Order has been cancelled"
      });

      fetchPendingOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast({
        title: "Error", 
        description: "Failed to reject order",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Loading pending orders...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Order Confirmation Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingOrders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{order.customer_name}</h4>
                  <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm">{order.items_count} items</span>
                    <span className="text-sm font-medium">${order.total_amount}</span>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                  Pending Confirmation
                </Badge>
              </div>

              {order.special_instructions && (
                <div className="mb-3 p-2 bg-muted rounded text-sm">
                  <strong>Special Instructions:</strong> {order.special_instructions}
                </div>
              )}

              <Textarea
                placeholder="Confirmation notes (optional)..."
                value={confirmationNotes[order.id] || ''}
                onChange={(e) => setConfirmationNotes(prev => ({
                  ...prev,
                  [order.id]: e.target.value
                }))}
                className="mb-3"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => confirmOrder(order.id)}
                  disabled={order.payment_status !== 'paid'}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Confirm Order
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectOrder(order.id, confirmationNotes[order.id] || 'Order rejected by admin')}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                {order.payment_status !== 'paid' && (
                  <Button size="sm" variant="secondary" disabled>
                    <DollarSign className="h-4 w-4 mr-1" />
                    Payment Required
                  </Button>
                )}
              </div>
            </div>
          ))}

          {pendingOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No orders pending confirmation</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}