-- Fix security warnings by updating functions with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_sysadmin(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'sysadmin')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_order_by_token(order_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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