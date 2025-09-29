-- Idempotent: Create/normalize demo order for DbSmoke (with correct status)
DO $$
DECLARE
  v_email text := 'demo_client@tulemar.test';
  v_order_id uuid;
BEGIN
  -- Find existing demo order (most recent)
  SELECT id INTO v_order_id
  FROM public.orders
  WHERE customer_email = v_email
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_order_id IS NULL THEN
    -- Create new demo order
    INSERT INTO public.orders (
      customer_email, customer_name, customer_phone,
      property_address, status, subtotal, tax_amount,
      delivery_fee, total_amount, special_instructions
    ) VALUES (
      v_email, 'Demo Client', '+1-555-DEMO',
      '123 Demo Street, Demo City', 'confirmed', 25.50, 2.04,
      5.00, 32.54, 'Demo order for smoke testing'
    ) RETURNING id INTO v_order_id;
  ELSE
    -- Normalize existing order (use confirmed status)
    UPDATE public.orders
    SET status = 'confirmed',
        customer_name = COALESCE(customer_name, 'Demo Client'),
        customer_phone = COALESCE(customer_phone, '+1-555-DEMO'),
        property_address = COALESCE(property_address, '123 Demo Street, Demo City'),
        subtotal = COALESCE(subtotal, 25.50),
        tax_amount = COALESCE(tax_amount, 2.04),
        delivery_fee = COALESCE(delivery_fee, 5.00),
        total_amount = COALESCE(total_amount, 32.54),
        special_instructions = COALESCE(special_instructions, 'Demo order for smoke testing'),
        updated_at = now()
    WHERE id = v_order_id;
  END IF;

  -- Reset items for determinism
  DELETE FROM public.order_items WHERE order_id = v_order_id;
  DELETE FROM public.new_order_items WHERE order_id = v_order_id;

  -- Legacy items
  INSERT INTO public.order_items (id, order_id, sku, name, qty, notes, created_at)
  VALUES
    (gen_random_uuid(), v_order_id, 'COFFEE-001', 'Premium Coffee', 2, 'Ground beans', now()),
    (gen_random_uuid(), v_order_id, 'MILK-001', 'Organic Milk', 1, '1 gallon', now()),
    (gen_random_uuid(), v_order_id, 'BANANA-001', 'Fresh Bananas', 1, '1 bunch', now());

  -- Canonical items
  INSERT INTO public.new_order_items (order_id, sku, name, qty, notes)
  VALUES
    (v_order_id, 'COFFEE-001', 'Premium Coffee', 2, 'Ground beans'),
    (v_order_id, 'MILK-001', 'Organic Milk', 1, '1 gallon'),
    (v_order_id, 'BANANA-001', 'Fresh Bananas', 1, '1 bunch');

  -- Ensure STATUS_CHANGED event
  IF NOT EXISTS (
    SELECT 1 FROM public.new_order_events 
    WHERE order_id = v_order_id AND event_type = 'STATUS_CHANGED'
  ) THEN
    INSERT INTO public.new_order_events (order_id, event_type, actor_role, data)
    VALUES (v_order_id, 'STATUS_CHANGED', 'system',
            jsonb_build_object('from','pending','to','confirmed','timestamp', now()));
  END IF;

  RAISE NOTICE 'Demo order ready: %', v_order_id;
END $$;