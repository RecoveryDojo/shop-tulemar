-- Step 1: Unlist the current 48 live products by marking them as test products
UPDATE products 
SET is_test_product = true 
WHERE is_active = true 
  AND (is_test_product IS NULL OR is_test_product = false);

-- Step 2: Create products from the 209 suggested import items
INSERT INTO products (name, description, price, category_id, unit, origin, image_url, stock_quantity, is_active, is_test_product)
SELECT 
  COALESCE(name, 'Unnamed Product') as name,
  COALESCE(name, 'Product description') as description,
  COALESCE(price, 0) as price,
  COALESCE(category_id, 'groceries') as category_id,
  'each' as unit,
  NULL as origin,
  image_url,
  10 as stock_quantity,
  true as is_active,
  true as is_test_product
FROM import_items 
WHERE status = 'suggested' 
  AND name IS NOT NULL 
  AND name != ''
  AND price > 0
  AND category_id IS NOT NULL;

-- Step 3: Update the import items status to 'published'
UPDATE import_items 
SET status = 'published' 
WHERE status = 'suggested' 
  AND name IS NOT NULL 
  AND name != ''
  AND price > 0
  AND category_id IS NOT NULL;