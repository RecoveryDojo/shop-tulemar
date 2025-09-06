-- Update all products to use uploaded images from Excel import
WITH ordered_products AS (
  SELECT 
    p.id as product_id,
    p.name as product_name,
    ROW_NUMBER() OVER (ORDER BY p.created_at, p.name) as product_order
  FROM products p 
  WHERE p.is_active = true
),
ordered_images AS (
  SELECT 
    so.name as image_filename,
    ROW_NUMBER() OVER (ORDER BY so.created_at) as image_order
  FROM storage.objects so
  WHERE so.bucket_id = 'product-images' 
    AND so.name LIKE 'excel-image-%'
),
product_image_pairs AS (
  SELECT 
    op.product_id,
    op.product_name,
    oi.image_filename
  FROM ordered_products op
  JOIN ordered_images oi ON op.product_order = oi.image_order
)
UPDATE products 
SET image_url = 'https://whxmjebukensinfduber.supabase.co/storage/v1/object/public/product-images/' || pip.image_filename
FROM product_image_pairs pip
WHERE products.id = pip.product_id;