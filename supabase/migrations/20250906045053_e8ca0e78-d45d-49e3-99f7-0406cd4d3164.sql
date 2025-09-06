-- Restore original image URLs from import data
UPDATE products 
SET image_url = import_items.raw->>'image_url'
FROM import_items 
WHERE products.name = import_items.name 
  AND import_items.raw->>'image_url' IS NOT NULL 
  AND import_items.raw->>'image_url' != '';