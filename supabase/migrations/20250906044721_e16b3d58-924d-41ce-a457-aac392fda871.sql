-- Update products with sample realistic image URLs for better display
-- Fresh Produce
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop' WHERE name LIKE '%Mango%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop' WHERE name LIKE '%Pineapple%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop' WHERE name LIKE '%Banana%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop' WHERE name LIKE '%Avocado%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1546470427-e5070a67238e?w=400&h=400&fit=crop' WHERE name LIKE '%Tomato%' AND image_url IS NULL;

-- Coffee & Beverages  
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' WHERE category_id = 'coffee-beverages' AND name LIKE '%Coffee%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop' WHERE category_id = 'coffee-beverages' AND name LIKE '%Orange%' AND image_url IS NULL;

-- Fresh Seafood
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop' WHERE category_id = 'fresh-seafood' AND name LIKE '%Fish%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop' WHERE category_id = 'fresh-seafood' AND name LIKE '%Shrimp%' AND image_url IS NULL;

-- Meat & Poultry
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1588347818481-ca5ad9039cea?w=400&h=400&fit=crop' WHERE category_id = 'meat-poultry' AND name LIKE '%Chicken%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1554308535-eaa4c2916971?w=400&h=400&fit=crop' WHERE category_id = 'meat-poultry' AND name LIKE '%Beef%' AND image_url IS NULL;

-- Bakery & Grains
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop' WHERE category_id = 'bakery-grains' AND name LIKE '%Bread%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1536304447766-da0ed4ce1b73?w=400&h=400&fit=crop' WHERE category_id = 'bakery-grains' AND name LIKE '%Rice%' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=400&fit=crop' WHERE category_id = 'bakery-grains' AND name LIKE '%Tortilla%' AND image_url IS NULL;

-- Generic fallbacks for remaining categories
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop' WHERE category_id = 'wines-spirits' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop' WHERE category_id = 'baby-family' AND image_url IS NULL;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' WHERE category_id = 'organic-health' AND image_url IS NULL;