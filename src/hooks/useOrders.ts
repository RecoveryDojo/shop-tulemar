import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateOrderData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  property_address?: string;
  arrival_date?: string;
  departure_date?: string;
  guest_count?: number;
  dietary_restrictions?: any;
  special_instructions?: string;
  items: OrderItem[];
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  property_address?: string;
  arrival_date?: string;
  departure_date?: string;
  guest_count?: number;
  dietary_restrictions?: any;
  special_instructions?: string;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrder = async (orderData: CreateOrderData): Promise<string | null> => {
    setLoading(true);
    try {
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + item.total_price, 0);
      const taxRate = 0.13; // Costa Rica IVA
      const deliveryFee = 5.00;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount + deliveryFee;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          property_address: orderData.property_address,
          arrival_date: orderData.arrival_date,
          departure_date: orderData.departure_date,
          guest_count: orderData.guest_count,
          dietary_restrictions: orderData.dietary_restrictions,
          special_instructions: orderData.special_instructions,
          subtotal,
          tax_amount: taxAmount,
          delivery_fee: deliveryFee,
          total_amount: totalAmount,
          status: 'placed',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order created successfully",
        description: `Order #${order.id.slice(0, 8)} has been created.`,
      });

      return order.id;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error creating order",
        description: "Failed to create your order. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  };

  const getOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            unit,
            origin
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching order items:', error);
      return [];
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order updated",
        description: `Order status changed to ${status}.`,
      });

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error updating order",
        description: "Failed to update order status.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string, paymentIntentId?: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: paymentStatus,
          payment_intent_id: paymentIntentId
        })
        .eq('id', orderId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  };

  return {
    loading,
    createOrder,
    getOrderById,
    getOrderItems,
    updateOrderStatus,
    updatePaymentStatus
  };
};