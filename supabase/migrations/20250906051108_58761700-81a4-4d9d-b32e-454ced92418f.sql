-- Clear all existing products and related data for fresh start
-- This ensures clean image mapping with the fixed import system

-- Delete all existing products (especially test products from imports)
DELETE FROM products WHERE is_test_product = true;

-- Also clear any remaining products if user wants complete reset
DELETE FROM products;

-- Clear any orphaned images from previous imports
DELETE FROM storage.objects 
WHERE bucket_id = 'product-images' 
AND name LIKE 'excel-image-%';

-- Clear import job history for clean tracking
DELETE FROM import_items;
DELETE FROM import_jobs;