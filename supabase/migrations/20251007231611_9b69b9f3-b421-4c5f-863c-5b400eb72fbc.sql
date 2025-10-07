-- ============================================================
-- PHASE 2: CANONICAL STATUS ENFORCEMENT (Beta Alignments)
-- ============================================================

-- Step 1: Migrate existing order statuses to canonical lowercase
UPDATE orders 
SET status = CASE 
  WHEN LOWER(status) IN ('pending', 'confirmed') THEN 'placed'
  WHEN LOWER(status) = 'assigned' THEN 'claimed'
  WHEN LOWER(status) = 'shopping' THEN 'shopping'
  WHEN LOWER(status) IN ('packed', 'ready') THEN 'ready'
  WHEN LOWER(status) = 'in_transit' THEN 'delivered'
  WHEN LOWER(status) IN ('delivered', 'completed', 'fulfilled') THEN 'delivered'
  WHEN LOWER(status) = 'closed' THEN 'closed'
  WHEN LOWER(status) IN ('cancelled', 'canceled') THEN 'canceled'
  ELSE LOWER(status)
END
WHERE status IS NOT NULL;

-- Step 2: Add CHECK constraint for canonical statuses only
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('placed', 'claimed', 'shopping', 'ready', 'delivered', 'closed', 'canceled'));

-- Step 3: Redefine is_legal_transition() to enforce canonical flow
CREATE OR REPLACE FUNCTION public.is_legal_transition(from_status text, to_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    -- Canonical lowercase transitions only
    WHEN from_status = 'placed' AND to_status = 'claimed' THEN TRUE
    WHEN from_status = 'claimed' AND to_status = 'shopping' THEN TRUE
    WHEN from_status = 'shopping' AND to_status = 'ready' THEN TRUE
    WHEN from_status = 'ready' AND to_status = 'delivered' THEN TRUE
    WHEN from_status = 'delivered' AND to_status = 'closed' THEN TRUE
    WHEN to_status = 'canceled' THEN TRUE -- Any status can go to canceled
    ELSE FALSE
  END;
$$;

-- Step 4: Add three new RLS SELECT policies (role-based visibility)

-- 4a. Shoppers can view available orders (placed + unassigned)
DROP POLICY IF EXISTS "Shoppers can view available orders" ON orders;
CREATE POLICY "Shoppers can view available orders" 
ON orders 
FOR SELECT 
USING (
  status = 'placed' 
  AND assigned_shopper_id IS NULL 
  AND has_role(auth.uid(), 'shopper'::app_role)
);

-- 4b. Drivers can view ready orders
DROP POLICY IF EXISTS "Drivers can view ready orders" ON orders;
CREATE POLICY "Drivers can view ready orders" 
ON orders 
FOR SELECT 
USING (
  status = 'ready' 
  AND has_role(auth.uid(), 'driver'::app_role)
);

-- 4c. Concierges can view delivered orders
DROP POLICY IF EXISTS "Concierges can view delivered orders" ON orders;
CREATE POLICY "Concierges can view delivered orders" 
ON orders 
FOR SELECT 
USING (
  status = 'delivered' 
  AND has_role(auth.uid(), 'concierge'::app_role)
);

-- Step 5: Drop safe legacy tables (no FK dependencies)
DROP TABLE IF EXISTS legacy_order_events CASCADE;
DROP TABLE IF EXISTS legacy_order_items CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;