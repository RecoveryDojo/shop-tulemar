-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'client', 'concierge', 'sysadmin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or sysadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_sysadmin(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'sysadmin')
  )
$$;

-- Add access_token to orders table for guest access
ALTER TABLE public.orders ADD COLUMN access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Create index on access_token for performance
CREATE INDEX idx_orders_access_token ON public.orders(access_token);

-- Update RLS policies for orders table
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can insert orders" ON public.orders;

-- New secure RLS policies for orders
CREATE POLICY "Admin/Sysadmin can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Admin/Sysadmin can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Authenticated users can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Anyone can insert orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Update RLS policies for order_items
DROP POLICY IF EXISTS "Order items viewable by order owner" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

CREATE POLICY "Admin/Sysadmin can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (public.is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Authenticated users can view their order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
));

CREATE POLICY "Anyone can insert order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create secure RPC for guest order access
CREATE OR REPLACE FUNCTION public.get_order_by_token(order_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_data JSON;
BEGIN
  SELECT json_build_object(
    'id', o.id,
    'customer_name', o.customer_name,
    'customer_email', o.customer_email,
    'customer_phone', o.customer_phone,
    'property_address', o.property_address,
    'arrival_date', o.arrival_date,
    'departure_date', o.departure_date,
    'guest_count', o.guest_count,
    'dietary_restrictions', o.dietary_restrictions,
    'special_instructions', o.special_instructions,
    'subtotal', o.subtotal,
    'tax_amount', o.tax_amount,
    'delivery_fee', o.delivery_fee,
    'total_amount', o.total_amount,
    'status', o.status,
    'payment_status', o.payment_status,
    'created_at', o.created_at,
    'items', (
      SELECT json_agg(json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      ))
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
  ) INTO order_data
  FROM orders o
  WHERE o.access_token = order_token;
  
  RETURN order_data;
END;
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin/Sysadmin can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Admin/Sysadmin can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin_or_sysadmin(auth.uid()));

-- Update profiles table to work with new auth system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update handle_new_user function to assign default client role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = new.email,
    display_name = coalesce(new.raw_user_meta_data ->> 'display_name', new.email);
    
  -- Assign default client role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;