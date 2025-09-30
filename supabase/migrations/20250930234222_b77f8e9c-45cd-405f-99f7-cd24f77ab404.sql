-- Step 1: Drop the old status check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Migrate ALL existing order statuses to canonical vocabulary
UPDATE orders
SET status = CASE
  WHEN status = 'pending' THEN 'placed'
  WHEN status = 'confirmed' THEN 'placed'
  WHEN status = 'assigned' THEN 'claimed'
  WHEN status = 'shopping' THEN 'shopping'
  WHEN status = 'packed' THEN 'ready'
  WHEN status = 'in_transit' THEN 'delivered'
  WHEN status = 'delivered' THEN 'delivered'
  WHEN status = 'completed' THEN 'closed'
  WHEN status = 'cancelled' THEN 'canceled'
  ELSE status
END;

-- Step 3: Add new constraint with canonical status values only
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('placed', 'claimed', 'shopping', 'ready', 'delivered', 'closed', 'canceled'));

-- Step 4: Add documentation comment
COMMENT ON COLUMN orders.status IS 'Canonical status flow: placed → claimed → shopping → ready → delivered → closed (or canceled at any point)';