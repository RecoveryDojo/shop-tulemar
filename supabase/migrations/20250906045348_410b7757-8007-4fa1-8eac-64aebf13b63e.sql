-- Update products with their corresponding uploaded images from storage
UPDATE products 
SET image_url = 'https://whxmjebukensinfduber.supabase.co/storage/v1/object/public/product-images/' || 
  (SELECT so.name 
   FROM storage.objects so 
   WHERE so.bucket_id = 'product-images' 
   AND so.name LIKE 'excel-image-%'
   ORDER BY so.created_at 
   LIMIT 1 OFFSET (
     SELECT ROW_NUMBER() OVER (ORDER BY ii.created_at) - 1
     FROM import_items ii 
     WHERE ii.name = products.name
     AND ii.name IS NOT NULL 
     AND ii.name != 'Unknown Product'
   )
  )
WHERE EXISTS (
  SELECT 1 FROM import_items ii 
  WHERE ii.name = products.name 
  AND ii.name IS NOT NULL 
  AND ii.name != 'Unknown Product'
);