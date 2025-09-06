-- Handle duplicates and complete the migration

-- Step 1: First unlist the current 48 live products
UPDATE products 
SET is_test_product = true 
WHERE is_active = true 
  AND (is_test_product IS NULL OR is_test_product = false);

-- Step 2: Create a temporary view of deduplicated import items
WITH deduplicated_items AS (
  SELECT DISTINCT ON (name, category_id) 
    name,
    price,
    category_id,
    image_url,
    id
  FROM import_items 
  WHERE status = 'suggested' 
    AND name IS NOT NULL 
    AND name != ''
    AND price > 0
    AND category_id IS NOT NULL
  ORDER BY name, category_id, created_at DESC
)
-- Step 3: Insert deduplicated products that don't already exist
INSERT INTO products (name, description, price, category_id, unit, origin, image_url, stock_quantity, is_active, is_test_product)
SELECT 
  d.name,
  d.name as description,
  d.price,
  d.category_id,
  'each' as unit,
  NULL as origin,
  d.image_url,
  10 as stock_quantity,
  true as is_active,
  true as is_test_product
FROM deduplicated_items d
WHERE NOT EXISTS (
  SELECT 1 FROM products p 
  WHERE p.name = d.name 
    AND p.category_id = d.category_id 
    AND p.is_active = true
);

-- Step 4: Update all suggested items to published status
UPDATE import_items 
SET status = 'published' 
WHERE status = 'suggested';