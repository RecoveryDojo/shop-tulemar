-- Ensure uuid generator available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Backfill + rename if order_items is a TABLE (not a view)
DO $$
DECLARE kind char;
BEGIN
  SELECT c.relkind INTO kind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'order_items';

  IF kind = 'r' THEN
    -- Ensure base table
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name='new_order_items'
    ) THEN
      CREATE TABLE public.new_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
        sku TEXT,
        name TEXT,
        qty INTEGER,
        qty_picked INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    END IF;

    -- Backfill (mapping existing columns to new schema)
    EXECUTE $bf$
      INSERT INTO public.new_order_items (id, order_id, sku, name, qty, qty_picked, notes, created_at)
      SELECT 
        oi.id,
        oi.order_id,
        oi.product_id::text as sku,
        COALESCE(p.name, 'Unknown Product') as name,
        oi.quantity as qty,
        COALESCE(oi.found_quantity, 0) as qty_picked,
        oi.shopper_notes as notes,
        oi.created_at
      FROM public.order_items oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      ON CONFLICT (id) DO NOTHING
    $bf$;

    -- Rename old table
    ALTER TABLE public.order_items RENAME TO legacy_order_items;
  END IF;
END $$;

-- 2) Backfill + rename if order_events is a TABLE (not a view)
DO $$
DECLARE kind char;
BEGIN
  SELECT c.relkind INTO kind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'order_events';

  IF kind = 'r' THEN
    -- Ensure base table
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name='new_order_events'
    ) THEN
      CREATE TABLE public.new_order_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    END IF;

    -- Backfill (mapping existing columns to new schema)
    EXECUTE $bf$
      INSERT INTO public.new_order_events (id, order_id, event_type, actor_role, data, created_at)
      SELECT 
        oe.id,
        oe.order_id,
        oe.event_type,
        COALESCE(oe.actor_role, 'system') as actor_role,
        oe.payload as data,
        oe.created_at
      FROM public.order_events oe
      ON CONFLICT (id) DO NOTHING
    $bf$;

    -- Rename old table
    ALTER TABLE public.order_events RENAME TO legacy_order_events;
  END IF;
END $$;

-- 3) Create canonical VIEWS if names are now free
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='order_items' AND c.relkind IN ('v','m')
  ) THEN
    EXECUTE 'CREATE VIEW public.order_items AS
      SELECT id, order_id, sku, name, qty, qty_picked, notes, created_at
      FROM public.new_order_items';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='order_events' AND c.relkind IN ('v','m')
  ) THEN
    EXECUTE 'CREATE VIEW public.order_events AS
      SELECT id, order_id, event_type, actor_role, data, created_at
      FROM public.new_order_events';
  END IF;
END $$;

-- 4) Write-through RULES (safe to replace if they already exist)
CREATE OR REPLACE RULE order_items_insert AS
  ON INSERT TO public.order_items DO INSTEAD
  INSERT INTO public.new_order_items (id, order_id, sku, name, qty, qty_picked, notes, created_at)
  VALUES (COALESCE(NEW.id, gen_random_uuid()), NEW.order_id, NEW.sku, NEW.name, NEW.qty, COALESCE(NEW.qty_picked, 0), NEW.notes, COALESCE(NEW.created_at, now()))
  RETURNING *;

CREATE OR REPLACE RULE order_items_update AS
  ON UPDATE TO public.order_items DO INSTEAD
  UPDATE public.new_order_items SET
    order_id   = NEW.order_id,
    sku        = NEW.sku,
    name       = NEW.name,
    qty        = NEW.qty,
    qty_picked = NEW.qty_picked,
    notes      = NEW.notes
  WHERE id = OLD.id
  RETURNING *;

CREATE OR REPLACE RULE order_items_delete AS
  ON DELETE TO public.order_items DO INSTEAD
  DELETE FROM public.new_order_items WHERE id = OLD.id
  RETURNING *;

CREATE OR REPLACE RULE order_events_insert AS
  ON INSERT TO public.order_events DO INSTEAD
  INSERT INTO public.new_order_events (id, order_id, event_type, actor_role, data, created_at)
  VALUES (COALESCE(NEW.id, gen_random_uuid()), NEW.order_id, NEW.event_type, NEW.actor_role, NEW.data, COALESCE(NEW.created_at, now()))
  RETURNING *;

CREATE OR REPLACE RULE order_events_update AS
  ON UPDATE TO public.order_events DO INSTEAD
  UPDATE public.new_order_events SET
    order_id   = NEW.order_id,
    event_type = NEW.event_type,
    actor_role = NEW.actor_role,
    data       = NEW.data
  WHERE id = OLD.id
  RETURNING *;

CREATE OR REPLACE RULE order_events_delete AS
  ON DELETE TO public.order_events DO INSTEAD
  DELETE FROM public.new_order_events WHERE id = OLD.id
  RETURNING *;

-- 5) Indexes on base tables (idempotent)
CREATE INDEX IF NOT EXISTS idx_new_order_items_order ON public.new_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_new_order_events_order_created ON public.new_order_events(order_id, created_at DESC);