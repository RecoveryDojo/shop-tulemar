-- Create proper mapping between products and their uploaded images based on order
WITH ordered_import_items AS (
  SELECT 
    name,
    ROW_NUMBER() OVER (ORDER BY created_at, name) as item_row
  FROM import_items 
  WHERE name IS NOT NULL AND name != 'Unknown Product'
),
ordered_images AS (
  SELECT 
    name as image_name,
    ROW_NUMBER() OVER (ORDER BY created_at) as image_row
  FROM storage.objects 
  WHERE bucket_id = 'product-images' AND name LIKE 'excel-image-%'
),
product_image_mapping AS (
  SELECT 
    p.id as product_id,
    oi.image_name,
    'https://whxmjebukensinfduber.supabase.co/storage/v1/object/public/product-images/' || oi.image_name as full_url
  FROM products p
  JOIN ordered_import_items oii ON oii.name = p.name
  JOIN ordered_images oi ON oi.image_row = oii.item_row
)
UPDATE products 
SET image_url = pim.full_url
FROM product_image_mapping pim
WHERE products.id = pim.product_id;