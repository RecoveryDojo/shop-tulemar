-- Idempotent Order System Migration (Compatible with existing schema)
-- Adds order_status enum, new columns, and event-sourcing triggers

-- Create order_status enum with idempotency
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('PLACED', 'CLAIMED', 'SHOPPING', 'READY', 'DELIVERED', 'CLOSED', 'CANCELED');
  END IF;
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns to existing orders table with idempotency
DO $$
BEGIN
  -- Add client_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'client_id' AND table_schema = 'public') THEN
    ALTER TABLE public.orders ADD COLUMN client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add assigned_concierge_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_concierge_id' AND table_schema = 'public') THEN
    ALTER TABLE public.orders ADD COLUMN assigned_concierge_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Add property_id column if it doesn't exist (may already exist)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'property_id' AND table_schema = 'public') THEN
    ALTER TABLE public.orders ADD COLUMN property_id UUID;
  END IF;
  
  -- Add notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes' AND table_schema = 'public') THEN
    ALTER TABLE public.orders ADD COLUMN notes TEXT;
  END IF;

EXCEPTION 
  WHEN others THEN NULL;
END $$;

-- Create order_items table with idempotency (using new simplified schema)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'new_order_items' AND table_schema = 'public') THEN
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
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;

-- Create order_events table with idempotency (checking for new name to avoid conflicts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'new_order_events' AND table_schema = 'public') THEN
    CREATE TABLE public.new_order_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      data JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes with idempotency
CREATE INDEX IF NOT EXISTS idx_new_order_events_order_created ON public.new_order_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_new_order_items_order ON public.new_order_items(order_id);

-- Create trigger function for order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.new_order_events (order_id, event_type, actor_role, data)
    VALUES (
      NEW.id,
      'STATUS_CHANGED',
      COALESCE(current_setting('app.current_user_role', true), 'system'),
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function for order items changes
CREATE OR REPLACE FUNCTION public.log_order_item_change_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.new_order_events (order_id, event_type, actor_role, data)
    VALUES (
      NEW.order_id,
      'ITEM_ADDED',
      COALESCE(current_setting('app.current_user_role', true), 'system'),
      jsonb_build_object(
        'item_id', NEW.id,
        'sku', NEW.sku,
        'name', NEW.name,
        'qty', NEW.qty,
        'qty_picked', NEW.qty_picked
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.new_order_events (order_id, event_type, actor_role, data)
    VALUES (
      NEW.order_id,
      'ITEM_UPDATED',
      COALESCE(current_setting('app.current_user_role', true), 'system'),
      jsonb_build_object(
        'item_id', NEW.id,
        'sku', NEW.sku,
        'name', NEW.name,
        'qty', NEW.qty,
        'qty_picked', NEW.qty_picked,
        'changes', jsonb_build_object(
          'qty_picked_from', OLD.qty_picked,
          'qty_picked_to', NEW.qty_picked
        )
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.new_order_events (order_id, event_type, actor_role, data)
    VALUES (
      OLD.order_id,
      'ITEM_REMOVED',
      COALESCE(current_setting('app.current_user_role', true), 'system'),
      jsonb_build_object(
        'item_id', OLD.id,
        'sku', OLD.sku,
        'name', OLD.name,
        'qty', OLD.qty,
        'qty_picked', OLD.qty_picked
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers with idempotency (using v2 names to avoid conflicts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_order_status_change_v2') THEN
    CREATE TRIGGER trigger_order_status_change_v2
      AFTER UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.log_order_status_change_v2();
  END IF;
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_order_item_change_v2') THEN
    CREATE TRIGGER trigger_order_item_change_v2
      AFTER INSERT OR UPDATE OR DELETE ON public.new_order_items
      FOR EACH ROW
      EXECUTE FUNCTION public.log_order_item_change_v2();
  END IF;
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.new_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_order_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for new_order_items
CREATE POLICY "Users can view items for their orders" ON public.new_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = new_order_items.order_id 
      AND (auth.uid() = orders.client_id OR auth.uid() = orders.assigned_shopper_id OR auth.uid() = orders.assigned_concierge_id)
    )
  );

CREATE POLICY "Users can manage items for their orders" ON public.new_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = new_order_items.order_id 
      AND (auth.uid() = orders.client_id OR auth.uid() = orders.assigned_shopper_id OR auth.uid() = orders.assigned_concierge_id)
    )
  );

-- Basic RLS policies for new_order_events
CREATE POLICY "Users can view events for their orders" ON public.new_order_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = new_order_events.order_id 
      AND (auth.uid() = orders.client_id OR auth.uid() = orders.assigned_shopper_id OR auth.uid() = orders.assigned_concierge_id)
    )
  );

CREATE POLICY "System can insert events" ON public.new_order_events
  FOR INSERT WITH CHECK (true);