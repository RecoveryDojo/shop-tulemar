-- Create a more precise mapping between products and uploaded images
WITH product_image_mapping AS (
  SELECT 
    p.id as product_id,
    p.name as product_name,
    so.name as image_filename,
    ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY so.created_at) as rn
  FROM products p
  JOIN import_items ii ON ii.name = p.name 
  CROSS JOIN storage.objects so
  WHERE so.bucket_id = 'product-images' 
    AND so.name LIKE 'excel-image-%'
    AND ii.name IS NOT NULL 
    AND ii.name != 'Unknown Product'
)
UPDATE products 
SET image_url = 'https://whxmjebukensinfduber.supabase.co/storage/v1/object/public/product-images/' || pim.image_filename
FROM product_image_mapping pim
WHERE products.id = pim.product_id 
  AND pim.rn = 1;