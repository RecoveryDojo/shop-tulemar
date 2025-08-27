-- First, let's populate the categories table with data from the static file
INSERT INTO categories (id, name, icon, description, is_active) VALUES 
('fresh-produce', 'Fresh Produce', '🥭', 'Fresh tropical fruits and vegetables from Costa Rica', true),
('coffee-beverages', 'Coffee & Beverages', '☕', 'Premium Costa Rican coffee and traditional drinks', true),
('fresh-seafood', 'Fresh Seafood', '🐟', 'Fresh catches from both Pacific and Caribbean coasts', true),
('meat-poultry', 'Meat & Poultry', '🥩', 'Premium grass-fed meats and free-range poultry', true),
('bakery-grains', 'Bakery & Grains', '🍞', 'Traditional breads, grains, and staples for Costa Rican cuisine', true),
('wines-spirits', 'Wines & Spirits', '🍷', 'Local and imported wines and spirits', true),
('baby-family', 'Baby & Family', '👶', 'Family essentials and baby products', true),
('organic-health', 'Organic & Health', '🌱', 'Organic and health-focused products', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;