import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, X, AlertTriangle, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchOrderItems } from '@/data/views';
import type { OrderItemView } from '@/types/db-views';

interface SubstitutionRequest {
  id: string;
  order_id: string;
  customer_name: string;
  product_name: string;
  original_product: string;
  suggested_substitute: string;
  reason: string;
  shopper_notes?: string;
  photo_url?: string;
  price_difference: number;
  created_at: string;
}

export function SubstitutionApprovalPanel() {
  const [substitutionRequests, setSubstitutionRequests] = useState<SubstitutionRequest[]>([]);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubstitutionRequests();
  }, []);

  const fetchSubstitutionRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id, order_id, shopper_notes, photo_url,
          unit_price, shopping_status, substitution_data,
          created_at, updated_at,
          product:products(name),
          order:orders(customer_name)
        `)
        .eq('shopping_status', 'substitution_needed')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const requests: SubstitutionRequest[] = data.map(item => {
        const itemData = item as any;
        const substitutionData = (itemData.substitution_data ?? {}) as any;
        const product = (itemData.product ?? {}) as { name?: string };
        const order = (itemData.order ?? {}) as { customer_name?: string };
        return {
          id: itemData.id || '',
          order_id: itemData.order_id || '',
          customer_name: order.customer_name || 'Unknown',
          product_name: product.name || itemData.product_name || 'Unknown Product',
          original_product: product.name || itemData.product_name || 'Unknown',
          suggested_substitute: substitutionData?.suggestedProduct || 'Alternative product',
          reason: substitutionData?.reason || 'Not available',
          shopper_notes: itemData.shopper_notes || '',
          photo_url: itemData.photo_url || '',
          price_difference: 0, // Would calculate based on substitute price
          created_at: itemData.created_at || new Date().toISOString()
        };
      });

      setSubstitutionRequests(requests);
    } catch (error) {
      console.error('Error fetching substitution requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveSubstitution = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ 
          shopping_status: 'substituted',
          shopper_notes: approvalNotes[requestId] || 'Substitution approved'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Notify customer
      const request = substitutionRequests.find(r => r.id === requestId);
      if (request) {
        await supabase.functions.invoke('notification-orchestrator', {
          body: {
            orderId: request.order_id,
            notificationType: 'substitution_approved',
            metadata: {
              originalProduct: request.original_product,
              substitute: request.suggested_substitute,
              notes: approvalNotes[requestId]
            }
          }
        });
      }

      toast({
        title: "Substitution Approved",
        description: "Customer has been notified of the substitution"
      });

      fetchSubstitutionRequests();
    } catch (error) {
      console.error('Error approving substitution:', error);
      toast({
        title: "Error",
        description: "Failed to approve substitution",
        variant: "destructive"
      });
    }
  };

  const rejectSubstitution = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ 
          shopping_status: 'unavailable',
          shopper_notes: approvalNotes[requestId] || 'Substitution rejected - item unavailable'
        })
        .eq('id', requestId);

      if (error) throw error;

      const request = substitutionRequests.find(r => r.id === requestId);
      if (request) {
        await supabase.functions.invoke('notification-orchestrator', {
          body: {
            orderId: request.order_id,  
            notificationType: 'substitution_rejected',
            metadata: {
              originalProduct: request.original_product,
              reason: approvalNotes[requestId] || 'Substitution not suitable'
            }
          }
        });
      }

      toast({
        title: "Substitution Rejected",
        description: "Customer has been notified that the item is unavailable"
      });

      fetchSubstitutionRequests();
    } catch (error) {
      console.error('Error rejecting substitution:', error);
      toast({
        title: "Error",
        description: "Failed to reject substitution", 
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Loading substitution requests...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Substitution Approval Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {substitutionRequests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{request.customer_name}</h4>
                  <p className="text-sm text-muted-foreground">Order #{request.order_id.slice(-6)}</p>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Substitution Needed
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium text-red-600">Unavailable:</p>
                  <p className="text-sm">{request.original_product}</p>
                  <p className="text-xs text-muted-foreground">Reason: {request.reason}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Suggested:</p>
                  <p className="text-sm">{request.suggested_substitute}</p>
                  {request.price_difference !== 0 && (
                    <p className="text-xs text-muted-foreground">
                      Price difference: ${request.price_difference}
                    </p>
                  )}
                </div>
              </div>

              {request.shopper_notes && (
                <div className="mb-3 p-2 bg-muted rounded text-sm">
                  <strong>Shopper Notes:</strong> {request.shopper_notes}
                </div>
              )}

              {request.photo_url && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Shopper Photo:</p>
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      View Photo
                    </Button>
                  </div>
                </div>
              )}

              <Textarea
                placeholder="Approval notes (optional)..."
                value={approvalNotes[request.id] || ''}
                onChange={(e) => setApprovalNotes(prev => ({
                  ...prev,
                  [request.id]: e.target.value
                }))}
                className="mb-3"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => approveSubstitution(request.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve Substitution
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectSubstitution(request.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject - Item Unavailable
                </Button>
              </div>
            </div>
          ))}

          {substitutionRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No substitution requests pending approval</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}