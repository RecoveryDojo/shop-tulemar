-- Delete test orders and duplicates in correct order to avoid FK violations
-- First, identify orders to delete
WITH orders_to_delete AS (
  SELECT id FROM orders 
  WHERE 
    -- Delete all scott@microcasting.com test orders
    customer_email = 'scott@microcasting.com'
    -- Delete demo orders
    OR customer_email = 'demo_customer@example.com'
    -- Delete empty orders
    OR id IN (
      SELECT o.id 
      FROM orders o
      LEFT JOIN new_order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      HAVING COUNT(oi.id) = 0
    )
    -- Delete Scott Guest duplicates (keep only the most recent one)
    OR (
      customer_name = 'Scott Guest' 
      AND id != '5577f33a-7e43-4927-9fbc-bb247a1266cc'
    )
)
-- Delete events first
DELETE FROM new_order_events WHERE order_id IN (SELECT id FROM orders_to_delete);

-- Delete items second
DELETE FROM new_order_items WHERE order_id IN (
  SELECT id FROM orders 
  WHERE 
    customer_email = 'scott@microcasting.com'
    OR customer_email = 'demo_customer@example.com'
    OR id IN (
      SELECT o.id 
      FROM orders o
      LEFT JOIN new_order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      HAVING COUNT(oi.id) = 0
    )
    OR (
      customer_name = 'Scott Guest' 
      AND id != '5577f33a-7e43-4927-9fbc-bb247a1266cc'
    )
);

-- Delete orders last
DELETE FROM orders 
WHERE 
  customer_email = 'scott@microcasting.com'
  OR customer_email = 'demo_customer@example.com'
  OR id IN (
    SELECT o.id 
    FROM orders o
    LEFT JOIN new_order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    HAVING COUNT(oi.id) = 0
  )
  OR (
    customer_name = 'Scott Guest' 
    AND id != '5577f33a-7e43-4927-9fbc-bb247a1266cc'
  );