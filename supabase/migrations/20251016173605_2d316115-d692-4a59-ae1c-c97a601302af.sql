-- Emergency fix: Reset Susan's order to 'placed' status for demo
UPDATE orders 
SET status = 'placed', updated_at = now() 
WHERE id = 'a84ff3b2-018d-4cbe-81b5-e899bce4291f' 
AND assigned_shopper_id IS NULL;