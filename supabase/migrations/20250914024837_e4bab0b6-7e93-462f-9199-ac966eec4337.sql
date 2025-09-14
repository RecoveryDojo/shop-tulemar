-- Fix RLS policies for shopper workflow and add shopper role

-- 1) Add public access policy for available orders (pending orders without assigned shopper)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public can view available orders'
      AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Public can view available orders"
    ON public.orders
    FOR SELECT
    USING (
      status = 'pending' 
      AND assigned_shopper_id IS NULL
    );
  END IF;
END $$;

-- 2) Add policy for order items of available orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public can view available order items'
      AND tablename = 'order_items'
  ) THEN
    CREATE POLICY "Public can view available order items"
    ON public.order_items
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.status = 'pending'
          AND o.assigned_shopper_id IS NULL
      )
    );
  END IF;
END $$;

-- 3) Add shopper role to the current user (you can modify the user_id as needed)
-- First, let's check if shopper role exists in user_roles for this user
INSERT INTO public.user_roles (user_id, role)
VALUES ('6c172e73-c6b3-4ed3-a733-b06548dbf720', 'shopper')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4) Create a sample order for testing
INSERT INTO public.orders (
  customer_name,
  customer_email,
  customer_phone,
  property_address,
  special_instructions,
  subtotal,
  tax_amount,
  delivery_fee,
  total_amount,
  status,
  payment_status
) VALUES (
  'Sarah Johnson',
  'sarah.johnson@example.com',
  '+1-555-0123',
  '123 Oak Street, Apt 4B, Los Angeles, CA 90210',
  'Ring doorbell, leave at door if no answer. Prefer organic products when available.',
  89.50,
  7.16,
  12.00,
  108.66,
  'pending',
  'paid'
) ON CONFLICT DO NOTHING;

-- 5) Add some sample order items for the test order
DO $$
DECLARE
  sample_order_id uuid;
  banana_product_id uuid;
  milk_product_id uuid;
  bread_product_id uuid;
BEGIN
  -- Get the order ID
  SELECT id INTO sample_order_id 
  FROM public.orders 
  WHERE customer_email = 'sarah.johnson@example.com' 
  LIMIT 1;
  
  -- Only proceed if we found the order
  IF sample_order_id IS NOT NULL THEN
    -- Create some basic products if they don't exist
    INSERT INTO public.products (name, description, price, category_id, unit, is_active)
    VALUES 
      ('Organic Bananas', 'Fresh organic bananas', 3.99, 'produce', 'bunch', true),
      ('Almond Milk', 'Unsweetened almond milk', 4.99, 'dairy', 'carton', true),
      ('Whole Wheat Bread', 'Fresh whole wheat bread', 5.49, 'bakery', 'loaf', true)
    ON CONFLICT (name) DO UPDATE SET 
      description = EXCLUDED.description,
      price = EXCLUDED.price;
    
    -- Get product IDs
    SELECT id INTO banana_product_id FROM public.products WHERE name = 'Organic Bananas' LIMIT 1;
    SELECT id INTO milk_product_id FROM public.products WHERE name = 'Almond Milk' LIMIT 1;
    SELECT id INTO bread_product_id FROM public.products WHERE name = 'Whole Wheat Bread' LIMIT 1;
    
    -- Add order items
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES 
      (sample_order_id, banana_product_id, 2, 3.99, 7.98),
      (sample_order_id, milk_product_id, 1, 4.99, 4.99),
      (sample_order_id, bread_product_id, 1, 5.49, 5.49)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;