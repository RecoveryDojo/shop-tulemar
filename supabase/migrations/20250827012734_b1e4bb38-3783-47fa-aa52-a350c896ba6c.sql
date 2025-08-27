-- Add remaining product categories
INSERT INTO products (name, price, description, unit, origin, category_id, stock_quantity, is_active) VALUES
-- Fresh Seafood
('Mahi Mahi Fillet', 18.95, 'Fresh Pacific mahi mahi, firm white fish perfect for grilling', 'lb', 'Pacific Coast', 'fresh-seafood', 15, true),
('Red Snapper (Pargo)', 16.50, 'Whole red snapper, traditionally prepared in Costa Rica', 'lb', 'Gulf of Nicoya', 'fresh-seafood', 12, true),
('Corvina Fillet', 14.25, 'Popular Costa Rican white fish, mild and flaky', 'lb', 'Pacific Coast', 'fresh-seafood', 20, true),
('Jumbo Pacific Shrimp', 22.75, 'Large Pacific shrimp, perfect for ceviche or grilling', 'lb', 'Puntarenas', 'fresh-seafood', 10, true),
('Caribbean Lobster Tail', 28.95, 'Fresh Caribbean lobster tails, a true delicacy', 'each', 'Caribbean Coast', 'fresh-seafood', 8, true),

-- Meat & Poultry
('Grass-Fed Beef Tenderloin', 24.95, 'Premium grass-fed beef from Costa Rican highlands', 'lb', 'Cartago', 'meat-poultry', 15, true),
('Free-Range Chicken', 8.50, 'Whole free-range chicken, naturally raised', 'whole chicken', 'Central Valley', 'meat-poultry', 25, true),
('Artisanal Chorizo', 12.75, 'Traditional Costa Rican chorizo with local spices', 'lb', 'San José', 'meat-poultry', 20, true),
('Pork Shoulder (Cerdo)', 9.95, 'Perfect for carnitas or traditional Costa Rican dishes', 'lb', 'Guanacaste', 'meat-poultry', 18, true),
('Ground Beef (85/15)', 7.25, 'Lean ground beef from grass-fed cattle', 'lb', 'Cartago', 'meat-poultry', 30, true),

-- Bakery & Grains
('Pan Tostado', 3.25, 'Traditional Costa Rican toasted bread, perfect for breakfast', 'loaf', 'San José', 'bakery-grains', 40, true),
('Gallo Pinto Rice', 4.50, 'Special rice blend for authentic gallo pinto', '2lb bag', 'Guanacaste', 'bakery-grains', 50, true),
('Black Beans (Frijoles)', 2.95, 'Premium black beans, essential for gallo pinto', '1lb bag', 'Central Valley', 'bakery-grains', 60, true),
('Corn Tortillas', 2.75, 'Fresh corn tortillas made daily', 'pack of 20', 'San José', 'bakery-grains', 45, true),
('Organic Quinoa', 8.95, 'Nutrient-rich quinoa grown in Costa Rican mountains', '1lb bag', 'Cartago', 'bakery-grains', 25, true),

-- Wines & Spirits  
('Costa Rican Rum', 24.95, 'Premium aged rum from local sugarcane', '750ml', 'Costa Rica', 'wines-spirits', 15, true),
('Tropical Wine Blend', 18.50, 'Local fruit wine with tropical flavors', '750ml', 'Central Valley', 'wines-spirits', 12, true),
('Craft Beer Selection', 12.95, 'Selection of local craft beers', '6-pack', 'Costa Rica', 'wines-spirits', 20, true),
('Imported Wine', 22.75, 'Quality imported wines', '750ml', 'International', 'wines-spirits', 18, true),

-- Baby & Family
('Baby Formula', 15.95, 'Organic baby formula for infants', '800g container', 'Costa Rica', 'baby-family', 25, true),
('Diapers (Various Sizes)', 12.50, 'Premium diapers for babies and toddlers', 'pack', 'Costa Rica', 'baby-family', 30, true),
('Baby Food Jars', 3.75, 'Organic baby food with local fruits', '6-pack', 'Costa Rica', 'baby-family', 40, true),
('Family Snacks', 8.25, 'Healthy snacks for the whole family', 'variety pack', 'Costa Rica', 'baby-family', 35, true),

-- Organic & Health
('Organic Vegetables Mix', 9.95, 'Seasonal organic vegetable selection', '3lb bag', 'Central Valley', 'organic-health', 20, true),
('Superfood Smoothie Mix', 12.75, 'Blend of local superfoods for smoothies', '1lb bag', 'Costa Rica', 'organic-health', 18, true),
('Herbal Tea Selection', 8.50, 'Traditional Costa Rican herbal teas', 'variety pack', 'Central Valley', 'organic-health', 25, true),
('Natural Honey', 11.25, 'Raw honey from Costa Rican beekeepers', '500g jar', 'Cartago', 'organic-health', 15, true),
('Coconut Oil', 14.95, 'Virgin coconut oil from Pacific coast', '500ml jar', 'Puntarenas', 'organic-health', 22, true);