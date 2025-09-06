-- Phase 2: Enhanced Publishing System with Duplicate Prevention

-- Step 1: Add file hash column to import_jobs to prevent duplicate uploads
ALTER TABLE import_jobs ADD COLUMN file_hash TEXT;

-- Step 2: Add unique constraint to products table to prevent duplicates
ALTER TABLE products ADD CONSTRAINT unique_product_name_category UNIQUE (name, category_id) DEFERRABLE INITIALLY DEFERRED;

-- Step 3: Add is_test_product column for test product system
ALTER TABLE products ADD COLUMN is_test_product BOOLEAN DEFAULT false;

-- Step 4: Create index for faster duplicate checking
CREATE INDEX idx_products_name_category ON products (name, category_id) WHERE is_active = true;

-- Step 5: Clean up duplicate import jobs (keep only the latest one)
-- Delete older duplicate jobs based on same filename and stats
WITH duplicate_jobs AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY source_filename, stats_total_rows, stats_valid_rows 
           ORDER BY created_at DESC
         ) as rn
  FROM import_jobs
  WHERE source_filename = 'Grocery_List_Precios.xlsx'
)
DELETE FROM import_items 
WHERE job_id IN (
  SELECT id FROM duplicate_jobs WHERE rn > 1
);

DELETE FROM import_jobs 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY source_filename, stats_total_rows, stats_valid_rows 
             ORDER BY created_at DESC
           ) as rn
    FROM import_jobs
    WHERE source_filename = 'Grocery_List_Precios.xlsx'
  ) ranked WHERE rn > 1
);