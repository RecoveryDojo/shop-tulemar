-- Phase 1: Fix All Database Errors

-- Clean up category header items (fallback processing items that aren't real products)
DELETE FROM import_items 
WHERE status = 'error' 
  AND (name IS NULL OR name = '' OR name ILIKE '%category%' OR name ILIKE '%section%')
  AND errors @> ARRAY['Fallback processing'];

-- Reset AI processing failed items to allow reprocessing
UPDATE import_items 
SET status = 'pending', 
    errors = ARRAY[]::text[]
WHERE status = 'error' 
  AND errors @> ARRAY['AI processing failed'];

-- Clean up items that are clearly category headers based on naming patterns
DELETE FROM import_items 
WHERE status = 'error' 
  AND (
    name ILIKE 'dairy%' OR 
    name ILIKE 'meat%' OR 
    name ILIKE 'produce%' OR 
    name ILIKE 'pantry%' OR 
    name ILIKE 'frozen%' OR 
    name ILIKE 'beverages%' OR
    name ILIKE 'snacks%' OR
    name ILIKE 'bakery%' OR
    name IN ('DAIRY', 'MEAT', 'PRODUCE', 'PANTRY', 'FROZEN', 'BEVERAGES', 'SNACKS', 'BAKERY')
  );