-- Idempotent seed migration for /db-smoke testing
-- Creates a demo order for demo_client@tulemar.test with 3 items
-- Safe to run multiple times - will not create duplicates

DO $$
DECLARE
  v_order_id UUID;
  v_existing_order_count INTEGER;
BEGIN
  -- Check if demo order already exists
  SELECT COUNT(*) INTO v_existing_order_count
  FROM orders
  WHERE customer_email = 'demo_client@tulemar.test';

  -- Only create if it doesn't exist
  IF v_existing_order_count = 0 THEN
    -- Insert demo order with status PLACED
    INSERT INTO orders (
      customer_email,
      customer_name,
      customer_phone,
      property_address,
      status,
      subtotal,
      tax_amount,
      delivery_fee,
      total_amount,
      special_instructions
    ) VALUES (
      'demo_client@tulemar.test',
      'Demo Client',
      '+1-555-0123',
      '123 Demo Street, Demo City, DC 12345',
      'PLACED',
      25.50,
      2.04,
      5.00,
      32.54,
      'Demo order for smoke testing'
    )
    RETURNING id INTO v_order_id;

    -- Insert 3 demo items via new_order_items (canonical table)
    INSERT INTO new_order_items (order_id, sku, name, qty, qty_picked, notes)
    VALUES 
      (v_order_id, 'COFFEE-001', 'Coffee', 1, 0, 'Premium blend'),
      (v_order_id, 'MILK-002', 'Milk', 2, 0, 'Whole milk'),
      (v_order_id, 'BANANA-003', 'Bananas', 3, 0, 'Fresh organic');

    -- Update status from PLACED to CLAIMED to trigger STATUS_CHANGED event
    UPDATE orders 
    SET status = 'CLAIMED',
        updated_at = now()
    WHERE id = v_order_id
      AND status = 'PLACED';

    RAISE NOTICE 'Demo order % created successfully with 3 items', v_order_id;
  ELSE
    RAISE NOTICE 'Demo order already exists for demo_client@tulemar.test - skipping seed';
  END IF;
END $$;