-- Fix the RLS policy that's causing "permission denied for table users" error
DROP POLICY IF EXISTS "Authenticated users can view their own orders" ON public.orders;

-- Create new policy using profiles table instead of auth.users
CREATE POLICY "Authenticated users can view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (customer_email = (
  SELECT email 
  FROM public.profiles 
  WHERE id = auth.uid()
));