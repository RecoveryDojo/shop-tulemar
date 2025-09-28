-- Fixed Post-Migration Smoke Test Seed Data with Valid Status
-- This seed ensures test data exists for validating the migration

DO $$
DECLARE
    demo_order_id UUID;
    existing_order_count INTEGER;
BEGIN
    -- Step 1: Insert demo order if none exists for this client
    SELECT COUNT(*) INTO existing_order_count 
    FROM public.orders 
    WHERE customer_email = 'demo_client@tulemar.test';
    
    IF existing_order_count = 0 THEN
        INSERT INTO public.orders (
            customer_name,
            customer_email,
            customer_phone,
            property_address,
            subtotal,
            tax_amount,
            delivery_fee,
            total_amount,
            status,
            payment_status,
            notes
        ) VALUES (
            'Demo Client',
            'demo_client@tulemar.test',
            '+506-1234-5678',
            'Demo Property, Guanacaste, Costa Rica',
            45.00,
            5.85,
            5.00,
            55.85,
            'pending',
            'pending',
            'Seeded demo order for smoke testing'
        ) RETURNING id INTO demo_order_id;
    ELSE
        -- Get existing order
        SELECT id INTO demo_order_id 
        FROM public.orders 
        WHERE customer_email = 'demo_client@tulemar.test'
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;

    -- Step 2: Insert demo items via the canonical view (tests write-through rules)
    -- Check if items already exist for this order
    IF NOT EXISTS (SELECT 1 FROM public.order_items WHERE order_id = demo_order_id AND sku = 'COFFEE-001') THEN
        INSERT INTO public.order_items (order_id, sku, name, qty, qty_picked, notes)
        VALUES 
            (demo_order_id, 'COFFEE-001', 'Coffee', 1, 0, 'Colombian dark roast'),
            (demo_order_id, 'MILK-002', 'Milk', 2, 0, 'Organic whole milk'),
            (demo_order_id, 'BANANA-003', 'Bananas', 3, 0, 'Fresh yellow bananas');
    END IF;

    -- Step 3: Update order status to trigger STATUS_CHANGED event
    UPDATE public.orders 
    SET status = 'confirmed'
    WHERE id = demo_order_id AND status = 'pending';

    -- Step 4: Explicitly insert a demo event to ensure event system works
    INSERT INTO public.order_events (order_id, event_type, actor_role, data)
    SELECT 
        demo_order_id,
        'STATUS_CHANGED',
        'system',
        jsonb_build_object(
            'from', 'pending',
            'to', 'confirmed',
            'timestamp', now(),
            'note', 'Smoke test status change'
        )
    WHERE NOT EXISTS (
        SELECT 1 FROM public.order_events 
        WHERE order_id = demo_order_id 
        AND event_type = 'STATUS_CHANGED' 
        AND actor_role = 'system'
    );

    RAISE NOTICE 'Smoke test seed data created successfully. Order ID: %', demo_order_id;
END $$;