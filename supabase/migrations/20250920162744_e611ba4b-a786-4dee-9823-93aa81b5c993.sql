-- Add sample products if they don't exist
INSERT INTO products (id, name, description, category_id, unit, price, stock_quantity, image_url) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Fresh Bananas', 'Organic yellow bananas', 'produce', 'bunch', 3.99, 100, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Whole Milk', 'Fresh whole milk 1 gallon', 'dairy', 'gallon', 4.29, 50, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sourdough Bread', 'Artisan sourdough bread loaf', 'bakery', 'loaf', 5.99, 25, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400')
ON CONFLICT (id) DO NOTHING;

-- Add order items to existing Test Customer orders that have 0 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
  o.id,
  '550e8400-e29b-41d4-a716-446655440000',
  2,
  3.99,
  7.98
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id 
WHERE o.customer_name = 'Test Customer' 
  AND oi.id IS NULL
  AND o.total_amount >= 7.98;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
  o.id,
  '550e8400-e29b-41d4-a716-446655440001',
  1,
  4.29,
  4.29
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id 
WHERE o.customer_name = 'Test Customer' 
  AND o.total_amount >= 12.27
  AND EXISTS (
    SELECT 1 FROM order_items oi2 
    WHERE oi2.order_id = o.id 
    AND oi2.product_id = '550e8400-e29b-41d4-a716-446655440000'
  );

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
  o.id,
  '550e8400-e29b-41d4-a716-446655440002',
  1,
  5.99,
  5.99
FROM orders o 
WHERE o.customer_name = 'Test Customer' 
  AND o.total_amount >= 18.26
  AND EXISTS (
    SELECT 1 FROM order_items oi2 
    WHERE oi2.order_id = o.id 
    AND oi2.product_id = '550e8400-e29b-41d4-a716-446655440001'
  );