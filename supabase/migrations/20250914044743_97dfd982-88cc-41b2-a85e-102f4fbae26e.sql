-- Create helper function to fetch current user's email without touching auth schema
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE id = auth.uid();
$$;

-- Update RLS policy on order_notifications to avoid referencing auth.users
DROP POLICY IF EXISTS "Users can view notifications related to their orders" ON public.order_notifications;
CREATE POLICY "Users can view notifications related to their orders"
ON public.order_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_notifications.order_id
      AND o.customer_email = public.get_current_user_email()
  )
  OR recipient_identifier = public.get_current_user_email()
  OR recipient_identifier = (auth.uid())::text
);

-- Update RLS policy on order_workflow_log to avoid referencing auth.users
DROP POLICY IF EXISTS "Users can view logs for their orders" ON public.order_workflow_log;
CREATE POLICY "Users can view logs for their orders"
ON public.order_workflow_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_workflow_log.order_id
      AND o.customer_email = public.get_current_user_email()
  )
);

-- Update RLS policy on order_items to avoid referencing auth.users
DROP POLICY IF EXISTS "Authenticated users can view their order items" ON public.order_items;
CREATE POLICY "Authenticated users can view their order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.customer_email = public.get_current_user_email()
  )
);
