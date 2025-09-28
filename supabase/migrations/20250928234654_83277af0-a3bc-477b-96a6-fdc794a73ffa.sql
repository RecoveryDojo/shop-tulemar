-- Comprehensive Order Items/Events Migration with Full Idempotency
-- This migration ensures proper table structure and view compatibility

DO $$
BEGIN
    -- Step 1: Create base tables if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'new_order_items') THEN
        CREATE TABLE public.new_order_items (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
            sku text,
            name text,
            qty integer,
            qty_picked integer DEFAULT 0,
            notes text,
            created_at timestamptz DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.new_order_items ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can manage items for their orders" ON public.new_order_items
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM orders 
                    WHERE orders.id = new_order_items.order_id 
                    AND (
                        auth.uid() = orders.client_id 
                        OR auth.uid() = orders.assigned_shopper_id 
                        OR auth.uid() = orders.assigned_concierge_id
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'new_order_events') THEN
        CREATE TABLE public.new_order_events (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
            event_type text NOT NULL,
            actor_role text NOT NULL,
            data jsonb,
            created_at timestamptz DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.new_order_events ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "System can insert events" ON public.new_order_events
            FOR INSERT WITH CHECK (true);
            
        CREATE POLICY "Users can view events for their orders" ON public.new_order_events
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM orders 
                    WHERE orders.id = new_order_events.order_id 
                    AND (
                        auth.uid() = orders.client_id 
                        OR auth.uid() = orders.assigned_shopper_id 
                        OR auth.uid() = orders.assigned_concierge_id
                    )
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    -- Step 2: Handle legacy table migration for order_items
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'order_items'
        AND table_type = 'BASE TABLE'
    ) THEN
        -- Check if it's not already renamed
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'legacy_order_items'
        ) THEN
            -- Backfill data from legacy table
            INSERT INTO public.new_order_items (order_id, sku, name, qty, qty_picked, notes, created_at)
            SELECT 
                COALESCE(order_id, (SELECT id FROM orders LIMIT 1)),
                COALESCE(sku, product_id, 'unknown'),
                COALESCE(name, product_name, 'Unknown Item'),
                COALESCE(qty, quantity, 1),
                COALESCE(qty_picked, found_quantity, 0),
                COALESCE(notes, shopper_notes, ''),
                COALESCE(created_at, now())
            FROM public.order_items
            ON CONFLICT (id) DO NOTHING;
            
            -- Rename legacy table
            ALTER TABLE public.order_items RENAME TO legacy_order_items;
        END IF;
    END IF;
    
    -- Handle legacy table migration for order_events
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'order_events'
        AND table_type = 'BASE TABLE'
    ) THEN
        -- Check if it's not already renamed
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'legacy_order_events'
        ) THEN
            -- Backfill data from legacy table
            INSERT INTO public.new_order_events (order_id, event_type, actor_role, data, created_at)
            SELECT 
                COALESCE(order_id, (SELECT id FROM orders LIMIT 1)),
                COALESCE(event_type, 'UNKNOWN'),
                COALESCE(actor_role, 'system'),
                COALESCE(data, payload, '{}'),
                COALESCE(created_at, now())
            FROM public.order_events
            ON CONFLICT (id) DO NOTHING;
            
            -- Rename legacy table
            ALTER TABLE public.order_events RENAME TO legacy_order_events;
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    -- Step 3: Drop old views if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'order_items'
    ) THEN
        DROP VIEW public.order_items CASCADE;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'order_events'
    ) THEN
        DROP VIEW public.order_events CASCADE;
    END IF;
END $$;

-- Step 4: Create compatibility views
CREATE VIEW public.order_items AS
SELECT 
    id,
    order_id,
    sku,
    sku as product_id,
    name,
    name as product_name,
    qty,
    qty as quantity,
    qty_picked,
    qty_picked as found_quantity,
    notes,
    notes as shopper_notes,
    CASE 
        WHEN qty_picked >= qty THEN 'found'
        WHEN qty_picked > 0 THEN 'partial'
        ELSE 'pending'
    END as shopping_status,
    0::numeric as unit_price,
    0::numeric as total_price,
    0::numeric as product_price,
    NULL::text as product_unit,
    NULL::text as product_category_id,
    NULL::text as photo_url,
    NULL::jsonb as substitution_data,
    JSON_BUILD_OBJECT(
        'name', name,
        'unit', 'each',
        'origin', 'local'
    )::jsonb as products,
    created_at
FROM public.new_order_items;

CREATE VIEW public.order_events AS
SELECT 
    id,
    order_id,
    event_type,
    actor_role,
    data,
    data as payload,
    created_at
FROM public.new_order_events;

-- Step 5: Create write-through rules
CREATE RULE order_items_insert AS
    ON INSERT TO public.order_items DO INSTEAD
    INSERT INTO public.new_order_items (order_id, sku, name, qty, qty_picked, notes, created_at)
    VALUES (NEW.order_id, NEW.sku, NEW.name, NEW.qty, COALESCE(NEW.qty_picked, 0), NEW.notes, COALESCE(NEW.created_at, now()));

CREATE RULE order_items_update AS
    ON UPDATE TO public.order_items DO INSTEAD
    UPDATE public.new_order_items SET
        sku = NEW.sku,
        name = NEW.name,
        qty = NEW.qty,
        qty_picked = COALESCE(NEW.qty_picked, 0),
        notes = NEW.notes
    WHERE id = OLD.id;

CREATE RULE order_items_delete AS
    ON DELETE TO public.order_items DO INSTEAD
    DELETE FROM public.new_order_items WHERE id = OLD.id;

CREATE RULE order_events_insert AS
    ON INSERT TO public.order_events DO INSTEAD
    INSERT INTO public.new_order_events (order_id, event_type, actor_role, data, created_at)
    VALUES (NEW.order_id, NEW.event_type, NEW.actor_role, COALESCE(NEW.data, NEW.payload), COALESCE(NEW.created_at, now()));

CREATE RULE order_events_update AS
    ON UPDATE TO public.order_events DO INSTEAD
    UPDATE public.new_order_events SET
        event_type = NEW.event_type,
        actor_role = NEW.actor_role,
        data = COALESCE(NEW.data, NEW.payload)
    WHERE id = OLD.id;

CREATE RULE order_events_delete AS
    ON DELETE TO public.order_events DO INSTEAD
    DELETE FROM public.new_order_events WHERE id = OLD.id;

-- Step 6: Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_new_order_items_order ON public.new_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_new_order_events_order_created ON public.new_order_events(order_id, created_at DESC);

-- Step 7: Set security settings
ALTER VIEW public.order_items SET (security_invoker = true);
ALTER VIEW public.order_events SET (security_invoker = true);