-- Reset all products to use appropriate category-based placeholder images
UPDATE products 
SET image_url = CASE 
  WHEN category_id = 'fresh-produce' THEN 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'
  WHEN category_id = 'coffee-beverages' THEN 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop'
  WHEN category_id = 'fresh-seafood' THEN 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop'
  WHEN category_id = 'meat-poultry' THEN 'https://images.unsplash.com/photo-1588347818481-ca5ad9039cea?w=400&h=400&fit=crop'
  WHEN category_id = 'bakery-grains' THEN 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop'
  WHEN category_id = 'wines-spirits' THEN 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop'
  WHEN category_id = 'baby-family' THEN 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop'
  WHEN category_id = 'organic-health' THEN 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'
END;