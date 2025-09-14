-- Shopper Workflow Migration: assignments, item statuses, and RLS for shoppers
-- Safe guards: use IF NOT EXISTS and avoid breaking changes

-- 1) ORDERS: shopper assignment + timestamps for workflow phases
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assigned_shopper_id uuid,
  ADD COLUMN IF NOT EXISTS shopping_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS shopping_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_completed_at timestamptz;

-- Helpful index for querying shopper's orders
CREATE INDEX IF NOT EXISTS idx_orders_assigned_shopper_id ON public.orders(assigned_shopper_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 2) ORDER_ITEMS: item-level shopper workflow fields
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS shopping_status text DEFAULT 'pending', -- pending|found|substitution_needed|skipped
  ADD COLUMN IF NOT EXISTS found_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shopper_notes text,
  ADD COLUMN IF NOT EXISTS substitution_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Trigger to maintain updated_at for order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_order_items_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_order_items_updated_at
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) RLS: Allow assigned shoppers to view their orders and items
-- Orders currently only visible to admins and the customer; add policy for assigned stakeholders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE polname = 'Assigned stakeholders can view orders'
      AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Assigned stakeholders can view orders"
    ON public.orders
    FOR SELECT
    USING (
      -- Stakeholder accepted assignment
      EXISTS (
        SELECT 1 FROM public.stakeholder_assignments sa
        WHERE sa.order_id = orders.id
          AND sa.user_id = auth.uid()
          AND sa.accepted_at IS NOT NULL
      )
      OR
      -- Direct assignment via assigned_shopper_id
      assigned_shopper_id = auth.uid()
    );
  END IF;
END $$;

-- Order Items: add policy to let assigned shoppers view items for their orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE polname = 'Assigned stakeholders can view order items'
      AND tablename = 'order_items'
  ) THEN
    CREATE POLICY "Assigned stakeholders can view order items"
    ON public.order_items
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.orders o
        LEFT JOIN public.stakeholder_assignments sa
          ON sa.order_id = o.id
         AND sa.user_id = auth.uid()
         AND sa.accepted_at IS NOT NULL
        WHERE o.id = order_items.order_id
          AND (
            sa.id IS NOT NULL
            OR o.assigned_shopper_id = auth.uid()
          )
      )
    );
  END IF;
END $$;

-- 4) Optional helpful indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shopping_status ON public.order_items(shopping_status);
