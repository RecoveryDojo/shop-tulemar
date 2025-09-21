-- Simplify RLS policies to use only assigned_shopper_id model
-- Remove complex stakeholder_assignments checks and standardize permissions

-- First, drop existing complex policies for orders
DROP POLICY IF EXISTS "Assigned stakeholders can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated shoppers can view available order summaries" ON public.orders;

-- Create simplified RLS policies for orders
CREATE POLICY "Shoppers can update their assigned orders" 
ON public.orders 
FOR UPDATE 
USING (assigned_shopper_id = auth.uid());

CREATE POLICY "Customers can update their own orders until assigned" 
ON public.orders 
FOR UPDATE 
USING (customer_email = get_current_user_email() AND assigned_shopper_id IS NULL);

CREATE POLICY "Shoppers can view their assigned orders" 
ON public.orders 
FOR SELECT 
USING (assigned_shopper_id = auth.uid());

CREATE POLICY "Shoppers can view available orders for assignment" 
ON public.orders 
FOR SELECT 
USING (status = 'pending' AND assigned_shopper_id IS NULL AND has_role(auth.uid(), 'shopper'));

-- Update order_items policies to use simpler assigned_shopper_id check
DROP POLICY IF EXISTS "Assigned stakeholders can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Assigned stakeholders can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated shoppers can view available order item summaries" ON public.order_items;

CREATE POLICY "Shoppers can update items for their assigned orders" 
ON public.order_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.id = order_items.order_id 
  AND o.assigned_shopper_id = auth.uid()
));

CREATE POLICY "Shoppers can view items for their assigned orders" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.id = order_items.order_id 
  AND o.assigned_shopper_id = auth.uid()
));

CREATE POLICY "Customers can update items for their unassigned orders" 
ON public.order_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.id = order_items.order_id 
  AND o.customer_email = get_current_user_email() 
  AND o.assigned_shopper_id IS NULL
));

-- Ensure updated_at triggers exist for automatic timestamp management
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for orders and order_items if they don't exist
DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;
CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_order_items_updated_at ON public.order_items;
CREATE TRIGGER handle_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();