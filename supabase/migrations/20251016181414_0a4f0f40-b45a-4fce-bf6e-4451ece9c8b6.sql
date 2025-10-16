-- Delete remaining test orders that were missed in the first cleanup
-- First, delete events
WITH orders_to_delete AS (
  SELECT id FROM orders 
  WHERE customer_email IN ('test@example.com', 'demo@example.com', 'demo_client@tulemar.test')
)
DELETE FROM new_order_events WHERE order_id IN (SELECT id FROM orders_to_delete);

-- Delete items
DELETE FROM new_order_items WHERE order_id IN (
  SELECT id FROM orders 
  WHERE customer_email IN ('test@example.com', 'demo@example.com', 'demo_client@tulemar.test')
);

-- Delete the orders
DELETE FROM orders 
WHERE customer_email IN ('test@example.com', 'demo@example.com', 'demo_client@tulemar.test');