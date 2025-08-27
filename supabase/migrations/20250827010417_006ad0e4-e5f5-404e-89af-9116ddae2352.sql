-- Populate products table with fresh produce category
INSERT INTO products (id, name, price, description, unit, origin, category_id, stock_quantity, is_active) VALUES
-- Fresh Produce
('mango-tommy', 'Mango Tommy Atkins', 2.50, 'Sweet and juicy Costa Rican mangoes, perfect for tropical smoothies', 'each', 'Guanacaste Province', 'fresh-produce', 50, true),
('plantain-maduro', 'Plátano Maduro', 1.25, 'Sweet ripe plantains, ideal for patacones or gallo pinto', 'each', 'Central Valley', 'fresh-produce', 75, true),
('yuca-fresh', 'Fresh Yuca Root', 3.75, 'Traditional Costa Rican yuca, perfect for boiling or frying', 'lb', 'Limón Province', 'fresh-produce', 30, true),
('pineapple-gold', 'Golden Pineapple', 4.50, 'World-famous Costa Rican pineapple, incredibly sweet and fresh', 'each', 'San Carlos', 'fresh-produce', 25, true),
('papaya-red', 'Red Papaya', 3.25, 'Tropical papaya rich in vitamins and perfect for breakfast', 'each', 'Puntarenas', 'fresh-produce', 35, true),
('avocado-hass', 'Aguacate Hass', 2.75, 'Creamy Hass avocados grown in Costa Rican highlands', 'each', 'Cartago', 'fresh-produce', 60, true),
('cilantro-fresh', 'Fresh Cilantro', 1.50, 'Aromatic cilantro essential for Costa Rican cuisine', 'bunch', 'Central Valley', 'fresh-produce', 40, true),
('chile-dulce', 'Chile Dulce', 0.75, 'Sweet bell peppers perfect for sofrito and rice dishes', 'each', 'Cartago', 'fresh-produce', 80, true),
('tomato-vine', 'Vine Tomatoes', 2.25, 'Fresh vine-ripened tomatoes with intense flavor', 'lb', 'Central Valley', 'fresh-produce', 45, true),
('onion-white', 'White Onions', 1.85, 'Crisp white onions, essential for Costa Rican cooking', 'lb', 'Cartago', 'fresh-produce', 55, true),

-- Coffee & Beverages
('cafe-britt-whole', 'Café Britt Whole Bean', 12.95, 'Premium Costa Rican coffee beans with rich, full-bodied flavor', '12oz bag', 'Tarrazú', 'coffee-beverages', 20, true),
('tarrazu-ground', 'Tarrazú Ground Coffee', 11.50, 'World-renowned Tarrazú coffee, medium roast ground', '12oz bag', 'Tarrazú', 'coffee-beverages', 25, true),
('guaro-cacique', 'Guaro Cacique', 8.75, 'Traditional Costa Rican sugar cane liquor, 30% alcohol', '750ml', 'Costa Rica', 'coffee-beverages', 15, true),
('horchata-rice', 'Horchata de Arroz', 3.25, 'Traditional rice and cinnamon drink, refreshing and sweet', '1L carton', 'Costa Rica', 'coffee-beverages', 30, true),
('tamarindo-juice', 'Tamarindo Natural', 4.50, 'Fresh tamarind juice with authentic tropical flavor', '1L bottle', 'Guanacaste', 'coffee-beverages', 20, true),
('agua-dulce', 'Agua Dulce Blocks', 2.95, 'Traditional brown sugar blocks for making Costa Rican tea', '1lb package', 'Central Valley', 'coffee-beverages', 35, true),
('cas-juice', 'Cas Fruit Juice', 3.75, 'Vitamin C rich cas fruit juice, tart and refreshing', '500ml bottle', 'Central Valley', 'coffee-beverages', 25, true),
('pinolillo', 'Pinolillo Mix', 5.25, 'Traditional corn and cacao drink mix with spices', '1lb bag', 'Nicaragua/Costa Rica', 'coffee-beverages', 18, true),
('coconut-water', 'Fresh Coconut Water', 2.75, 'Pure coconut water straight from the Pacific coast', '330ml bottle', 'Puntarenas', 'coffee-beverages', 40, true),
('imperial-beer', 'Imperial Beer', 1.95, 'Costa Rica''s national beer, light and refreshing', '355ml bottle', 'Costa Rica', 'coffee-beverages', 100, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  origin = EXCLUDED.origin,
  category_id = EXCLUDED.category_id,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active;