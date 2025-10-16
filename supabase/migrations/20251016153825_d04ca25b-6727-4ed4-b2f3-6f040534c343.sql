-- Fix orders.status default value to match canonical vocabulary
-- Canonical statuses: placed, claimed, shopping, ready, delivered, closed, canceled

-- Update default value from 'pending' to 'placed'
ALTER TABLE orders 
ALTER COLUMN status 
SET DEFAULT 'placed';

-- Update any existing orders with invalid or NULL statuses to 'placed'
UPDATE orders 
SET status = 'placed' 
WHERE status IS NULL 
   OR status NOT IN ('placed', 'claimed', 'shopping', 'ready', 'delivered', 'closed', 'canceled');

-- Add comment for documentation
COMMENT ON COLUMN orders.status IS 'Canonical order status: placed, claimed, shopping, ready, delivered, closed, canceled';