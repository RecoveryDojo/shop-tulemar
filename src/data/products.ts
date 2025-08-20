import { Product } from '@/contexts/CartContext';

export const categories = [
  { id: 'fresh-produce', name: 'Fresh Produce', icon: '🥭' },
  { id: 'coffee-beverages', name: 'Coffee & Beverages', icon: '☕' },
  { id: 'fresh-seafood', name: 'Fresh Seafood', icon: '🐟' },
  { id: 'meat-poultry', name: 'Meat & Poultry', icon: '🥩' },
  { id: 'bakery-grains', name: 'Bakery & Grains', icon: '🍞' },
  { id: 'wines-spirits', name: 'Wines & Spirits', icon: '🍷' },
  { id: 'baby-family', name: 'Baby & Family', icon: '👶' },
  { id: 'organic-health', name: 'Organic & Health', icon: '🌱' },
];

export const products: Record<string, Product[]> = {
  'fresh-produce': [
    {
      id: 'mango-tommy',
      name: 'Mango Tommy Atkins',
      price: 2.50,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Sweet and juicy Costa Rican mangoes, perfect for tropical smoothies',
      unit: 'each',
      origin: 'Guanacaste Province'
    },
    {
      id: 'plantain-maduro',
      name: 'Plátano Maduro',
      price: 1.25,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Sweet ripe plantains, ideal for patacones or gallo pinto',
      unit: 'each',
      origin: 'Central Valley'
    },
    {
      id: 'yuca-fresh',
      name: 'Fresh Yuca Root',
      price: 3.75,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Traditional Costa Rican yuca, perfect for boiling or frying',
      unit: 'lb',
      origin: 'Limón Province'
    },
    {
      id: 'pineapple-gold',
      name: 'Golden Pineapple',
      price: 4.50,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'World-famous Costa Rican pineapple, incredibly sweet and fresh',
      unit: 'each',
      origin: 'San Carlos'
    },
    {
      id: 'papaya-red',
      name: 'Red Papaya',
      price: 3.25,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Tropical papaya rich in vitamins and perfect for breakfast',
      unit: 'each',
      origin: 'Puntarenas'
    },
    {
      id: 'avocado-hass',
      name: 'Aguacate Hass',
      price: 2.75,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Creamy Hass avocados grown in Costa Rican highlands',
      unit: 'each',
      origin: 'Cartago'
    },
    {
      id: 'cilantro-fresh',
      name: 'Fresh Cilantro',
      price: 1.50,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Aromatic cilantro essential for Costa Rican cuisine',
      unit: 'bunch',
      origin: 'Central Valley'
    },
    {
      id: 'chile-dulce',
      name: 'Chile Dulce',
      price: 0.75,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Sweet bell peppers perfect for sofrito and rice dishes',
      unit: 'each',
      origin: 'Cartago'
    },
    {
      id: 'tomato-vine',
      name: 'Vine Tomatoes',
      price: 2.25,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Fresh vine-ripened tomatoes with intense flavor',
      unit: 'lb',
      origin: 'Central Valley'
    },
    {
      id: 'onion-white',
      name: 'White Onions',
      price: 1.85,
      image: '/placeholder.svg',
      category: 'fresh-produce',
      description: 'Crisp white onions, essential for Costa Rican cooking',
      unit: 'lb',
      origin: 'Cartago'
    }
  ],
  'coffee-beverages': [
    {
      id: 'cafe-britt-whole',
      name: 'Café Britt Whole Bean',
      price: 12.95,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Premium Costa Rican coffee beans with rich, full-bodied flavor',
      unit: '12oz bag',
      origin: 'Tarrazú'
    },
    {
      id: 'tarrazu-ground',
      name: 'Tarrazú Ground Coffee',
      price: 11.50,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'World-renowned Tarrazú coffee, medium roast ground',
      unit: '12oz bag',
      origin: 'Tarrazú'
    },
    {
      id: 'guaro-cacique',
      name: 'Guaro Cacique',
      price: 8.75,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Traditional Costa Rican sugar cane liquor, 30% alcohol',
      unit: '750ml',
      origin: 'Costa Rica'
    },
    {
      id: 'horchata-rice',
      name: 'Horchata de Arroz',
      price: 3.25,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Traditional rice and cinnamon drink, refreshing and sweet',
      unit: '1L carton',
      origin: 'Costa Rica'
    },
    {
      id: 'tamarindo-juice',
      name: 'Tamarindo Natural',
      price: 4.50,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Fresh tamarind juice with authentic tropical flavor',
      unit: '1L bottle',
      origin: 'Guanacaste'
    },
    {
      id: 'agua-dulce',
      name: 'Agua Dulce Blocks',
      price: 2.95,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Traditional brown sugar blocks for making Costa Rican tea',
      unit: '1lb package',
      origin: 'Central Valley'
    },
    {
      id: 'cas-juice',
      name: 'Cas Fruit Juice',
      price: 3.75,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Vitamin C rich cas fruit juice, tart and refreshing',
      unit: '500ml bottle',
      origin: 'Central Valley'
    },
    {
      id: 'pinolillo',
      name: 'Pinolillo Mix',
      price: 5.25,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Traditional corn and cacao drink mix with spices',
      unit: '1lb bag',
      origin: 'Nicaragua/Costa Rica'
    },
    {
      id: 'coconut-water',
      name: 'Fresh Coconut Water',
      price: 2.75,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Pure coconut water straight from the Pacific coast',
      unit: '330ml bottle',
      origin: 'Puntarenas'
    },
    {
      id: 'imperial-beer',
      name: 'Imperial Beer',
      price: 1.95,
      image: '/placeholder.svg',
      category: 'coffee-beverages',
      description: 'Costa Rica\'s national beer, light and refreshing',
      unit: '355ml bottle',
      origin: 'Costa Rica'
    }
  ],
  'fresh-seafood': [
    {
      id: 'mahi-mahi-fillet',
      name: 'Mahi Mahi Fillet',
      price: 18.95,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Fresh Pacific mahi mahi, firm white fish perfect for grilling',
      unit: 'lb',
      origin: 'Pacific Coast'
    },
    {
      id: 'red-snapper-whole',
      name: 'Red Snapper (Pargo)',
      price: 16.50,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Whole red snapper, traditionally prepared in Costa Rica',
      unit: 'lb',
      origin: 'Gulf of Nicoya'
    },
    {
      id: 'corvina-fillet',
      name: 'Corvina Fillet',
      price: 14.25,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Popular Costa Rican white fish, mild and flaky',
      unit: 'lb',
      origin: 'Pacific Coast'
    },
    {
      id: 'shrimp-jumbo',
      name: 'Jumbo Pacific Shrimp',
      price: 22.75,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Large Pacific shrimp, perfect for ceviche or grilling',
      unit: 'lb',
      origin: 'Puntarenas'
    },
    {
      id: 'lobster-tail',
      name: 'Caribbean Lobster Tail',
      price: 28.95,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Fresh Caribbean lobster tails, a true delicacy',
      unit: 'each',
      origin: 'Caribbean Coast'
    },
    {
      id: 'tuna-yellowfin',
      name: 'Yellowfin Tuna Steak',
      price: 24.50,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Sushi-grade yellowfin tuna, perfect for searing',
      unit: 'lb',
      origin: 'Pacific Coast'
    },
    {
      id: 'sea-bass-chilean',
      name: 'Chilean Sea Bass',
      price: 26.75,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Premium white fish with buttery texture',
      unit: 'lb',
      origin: 'Pacific Coast'
    },
    {
      id: 'octopus-baby',
      name: 'Baby Octopus',
      price: 15.95,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Tender baby octopus, great for Mediterranean dishes',
      unit: 'lb',
      origin: 'Pacific Coast'
    },
    {
      id: 'clams-fresh',
      name: 'Fresh Clams',
      price: 12.50,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Local clams perfect for soup or pasta',
      unit: 'dozen',
      origin: 'Gulf of Nicoya'
    },
    {
      id: 'crab-blue',
      name: 'Blue Crab',
      price: 19.25,
      image: '/placeholder.svg',
      category: 'fresh-seafood',
      description: 'Fresh blue crab from the Caribbean waters',
      unit: 'lb',
      origin: 'Caribbean Coast'
    }
  ],
  'meat-poultry': [
    {
      id: 'beef-tenderloin',
      name: 'Grass-Fed Beef Tenderloin',
      price: 24.95,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Premium grass-fed beef from Costa Rican highlands',
      unit: 'lb',
      origin: 'Cartago'
    },
    {
      id: 'chicken-free-range',
      name: 'Free-Range Chicken',
      price: 8.50,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Whole free-range chicken, naturally raised',
      unit: 'whole chicken',
      origin: 'Central Valley'
    },
    {
      id: 'chorizo-artisanal',
      name: 'Artisanal Chorizo',
      price: 12.75,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Traditional Costa Rican chorizo with local spices',
      unit: 'lb',
      origin: 'San José'
    },
    {
      id: 'pork-shoulder',
      name: 'Pork Shoulder (Cerdo)',
      price: 9.95,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Perfect for carnitas or traditional Costa Rican dishes',
      unit: 'lb',
      origin: 'Guanacaste'
    },
    {
      id: 'beef-ground',
      name: 'Ground Beef (85/15)',
      price: 7.25,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Lean ground beef from grass-fed cattle',
      unit: 'lb',
      origin: 'Cartago'
    },
    {
      id: 'chicken-breast',
      name: 'Chicken Breast Fillets',
      price: 11.50,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Boneless, skinless chicken breast fillets',
      unit: 'lb',
      origin: 'Central Valley'
    },
    {
      id: 'beef-ribeye',
      name: 'Ribeye Steak',
      price: 19.75,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Marbled ribeye steaks perfect for grilling',
      unit: 'lb',
      origin: 'Cartago'
    },
    {
      id: 'turkey-ground',
      name: 'Ground Turkey',
      price: 6.95,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Lean ground turkey for healthy meal options',
      unit: 'lb',
      origin: 'Central Valley'
    },
    {
      id: 'lamb-chops',
      name: 'Lamb Chops',
      price: 22.50,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Tender lamb chops from highland farms',
      unit: 'lb',
      origin: 'Cartago'
    },
    {
      id: 'bacon-artisanal',
      name: 'Artisanal Bacon',
      price: 14.25,
      image: '/placeholder.svg',
      category: 'meat-poultry',
      description: 'Thick-cut artisanal bacon, locally cured',
      unit: 'lb',
      origin: 'San José'
    }
  ],
  'bakery-grains': [
    {
      id: 'pan-tostado',
      name: 'Pan Tostado',
      price: 3.25,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Traditional Costa Rican toasted bread, perfect for breakfast',
      unit: 'loaf',
      origin: 'San José'
    },
    {
      id: 'rice-gallo-pinto',
      name: 'Gallo Pinto Rice',
      price: 4.50,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Special rice blend for authentic gallo pinto',
      unit: '2lb bag',
      origin: 'Guanacaste'
    },
    {
      id: 'black-beans',
      name: 'Black Beans (Frijoles)',
      price: 2.95,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Premium black beans, essential for gallo pinto',
      unit: '1lb bag',
      origin: 'Central Valley'
    },
    {
      id: 'tortillas-corn',
      name: 'Corn Tortillas',
      price: 2.75,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Fresh corn tortillas made daily',
      unit: 'pack of 20',
      origin: 'San José'
    },
    {
      id: 'quinoa-organic',
      name: 'Organic Quinoa',
      price: 8.95,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Nutrient-rich quinoa grown in Costa Rican mountains',
      unit: '1lb bag',
      origin: 'Cartago'
    },
    {
      id: 'oats-rolled',
      name: 'Rolled Oats',
      price: 3.75,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Wholesome rolled oats for breakfast or baking',
      unit: '1.5lb container',
      origin: 'Central Valley'
    },
    {
      id: 'flour-wheat',
      name: 'Whole Wheat Flour',
      price: 4.25,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Stone-ground whole wheat flour',
      unit: '2lb bag',
      origin: 'Costa Rica'
    },
    {
      id: 'empanada-dough',
      name: 'Empanada Dough',
      price: 5.50,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Ready-made empanada dough for quick meals',
      unit: 'pack of 12',
      origin: 'San José'
    },
    {
      id: 'bread-sourdough',
      name: 'Artisan Sourdough',
      price: 6.75,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'Handcrafted sourdough bread with crispy crust',
      unit: 'loaf',
      origin: 'San José'
    },
    {
      id: 'pasta-fresh',
      name: 'Fresh Pasta',
      price: 7.25,
      image: '/placeholder.svg',
      category: 'bakery-grains',
      description: 'House-made fresh pasta, various shapes available',
      unit: '1lb package',
      origin: 'San José'
    }
  ],
  'wines-spirits': [
    {
      id: 'wine-costa-rica',
      name: 'Costa Rican Red Wine',
      price: 18.95,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Local red wine from highland vineyards',
      unit: '750ml bottle',
      origin: 'Cartago'
    },
    {
      id: 'imperial-case',
      name: 'Imperial Beer Case',
      price: 22.50,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Case of Costa Rica\'s favorite beer',
      unit: '24-pack',
      origin: 'Costa Rica'
    },
    {
      id: 'pilsen-beer',
      name: 'Pilsen Beer',
      price: 2.25,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Refreshing Costa Rican lager beer',
      unit: '355ml bottle',
      origin: 'Costa Rica'
    },
    {
      id: 'rum-centenario',
      name: 'Ron Centenario',
      price: 32.95,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Premium Costa Rican aged rum',
      unit: '750ml bottle',
      origin: 'Costa Rica'
    },
    {
      id: 'wine-chilean',
      name: 'Chilean Cabernet',
      price: 15.75,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Imported Chilean Cabernet Sauvignon',
      unit: '750ml bottle',
      origin: 'Chile'
    },
    {
      id: 'beer-craft',
      name: 'Craft Beer Selection',
      price: 4.50,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Local craft brewery rotating selection',
      unit: '355ml bottle',
      origin: 'Costa Rica'
    },
    {
      id: 'wine-white',
      name: 'Sauvignon Blanc',
      price: 16.25,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Crisp white wine perfect for tropical climate',
      unit: '750ml bottle',
      origin: 'Chile'
    },
    {
      id: 'whiskey-imported',
      name: 'Imported Whiskey',
      price: 45.95,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Premium imported whiskey selection',
      unit: '750ml bottle',
      origin: 'Scotland'
    },
    {
      id: 'vodka-premium',
      name: 'Premium Vodka',
      price: 28.75,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Smooth premium vodka for cocktails',
      unit: '750ml bottle',
      origin: 'Eastern Europe'
    },
    {
      id: 'champagne-celebration',
      name: 'Celebration Champagne',
      price: 38.50,
      image: '/placeholder.svg',
      category: 'wines-spirits',
      description: 'Sparkling wine for special occasions',
      unit: '750ml bottle',
      origin: 'France'
    }
  ],
  'baby-family': [
    {
      id: 'diapers-pampers',
      name: 'Pampers Baby Dry',
      price: 24.95,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: '12-hour protection diapers, various sizes',
      unit: 'pack of 32',
      origin: 'USA'
    },
    {
      id: 'formula-enfamil',
      name: 'Enfamil Baby Formula',
      price: 28.75,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'Complete nutrition baby formula',
      unit: '22oz container',
      origin: 'USA'
    },
    {
      id: 'wipes-huggies',
      name: 'Huggies Baby Wipes',
      price: 12.50,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'Gentle baby wipes for sensitive skin',
      unit: 'pack of 168',
      origin: 'USA'
    },
    {
      id: 'sunscreen-family',
      name: 'Family Sunscreen SPF 50',
      price: 16.25,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'Broad spectrum protection for the whole family',
      unit: '6oz bottle',
      origin: 'USA'
    },
    {
      id: 'shampoo-baby',
      name: 'Baby Shampoo & Body Wash',
      price: 8.95,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'Gentle tear-free formula for babies',
      unit: '16oz bottle',
      origin: 'USA'
    },
    {
      id: 'toothbrush-kids',
      name: 'Kids Toothbrush Set',
      price: 7.50,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'Colorful toothbrushes designed for children',
      unit: 'pack of 4',
      origin: 'USA'
    },
    {
      id: 'snacks-baby',
      name: 'Baby Snack Puffs',
      price: 4.75,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'Organic puffs perfect for baby\'s first snacks',
      unit: '1.5oz container',
      origin: 'USA'
    },
    {
      id: 'thermometer-digital',
      name: 'Digital Thermometer',
      price: 19.95,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'Fast and accurate digital thermometer',
      unit: 'each',
      origin: 'USA'
    },
    {
      id: 'bottles-baby',
      name: 'Baby Bottles Set',
      price: 22.75,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'BPA-free baby bottles with anti-colic design',
      unit: 'set of 3',
      origin: 'USA'
    },
    {
      id: 'toys-bath',
      name: 'Bath Time Toys',
      price: 14.50,
      image: '/placeholder.svg',
      category: 'baby-family',
      description: 'Safe and fun bath toys for toddlers',
      unit: 'set of 6',
      origin: 'USA'
    }
  ],
  'organic-health': [
    {
      id: 'quinoa-organic-highland',
      name: 'Organic Highland Quinoa',
      price: 9.95,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Certified organic quinoa from Costa Rican highlands',
      unit: '1lb bag',
      origin: 'Cartago'
    },
    {
      id: 'chia-seeds',
      name: 'Organic Chia Seeds',
      price: 12.75,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Superfood chia seeds packed with omega-3',
      unit: '1lb bag',
      origin: 'Central America'
    },
    {
      id: 'supplements-vitamin-c',
      name: 'Natural Vitamin C',
      price: 18.50,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Vitamin C from natural acerola cherries',
      unit: '60 capsules',
      origin: 'Costa Rica'
    },
    {
      id: 'honey-raw',
      name: 'Raw Wildflower Honey',
      price: 14.95,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Unfiltered raw honey from Costa Rican wildflowers',
      unit: '16oz jar',
      origin: 'Central Valley'
    },
    {
      id: 'coconut-oil-virgin',
      name: 'Virgin Coconut Oil',
      price: 16.25,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Cold-pressed virgin coconut oil',
      unit: '16oz jar',
      origin: 'Puntarenas'
    },
    {
      id: 'spirulina-powder',
      name: 'Organic Spirulina Powder',
      price: 24.95,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Nutrient-dense blue-green algae superfood',
      unit: '8oz container',
      origin: 'Costa Rica'
    },
    {
      id: 'turmeric-fresh',
      name: 'Fresh Turmeric Root',
      price: 6.75,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Organic fresh turmeric root with anti-inflammatory properties',
      unit: '8oz package',
      origin: 'Central Valley'
    },
    {
      id: 'probiotics-natural',
      name: 'Natural Probiotics',
      price: 32.95,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Multi-strain probiotic supplement for digestive health',
      unit: '30 capsules',
      origin: 'USA'
    },
    {
      id: 'aloe-vera-gel',
      name: 'Pure Aloe Vera Gel',
      price: 11.50,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Organic aloe vera gel for skin and digestive health',
      unit: '16oz bottle',
      origin: 'Costa Rica'
    },
    {
      id: 'green-tea-organic',
      name: 'Organic Green Tea',
      price: 8.95,
      image: '/placeholder.svg',
      category: 'organic-health',
      description: 'Antioxidant-rich organic green tea leaves',
      unit: '3oz tin',
      origin: 'Costa Rica'
    }
  ]
};

export const getFeaturedProducts = (): Product[] => {
  const featured: Product[] = [];
  Object.values(products).forEach(categoryProducts => {
    featured.push(...categoryProducts.slice(0, 2));
  });
  return featured.slice(0, 12);
};

export const searchProducts = (query: string): Product[] => {
  const allProducts = Object.values(products).flat();
  return allProducts.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.description.toLowerCase().includes(query.toLowerCase()) ||
    product.category.includes(query.toLowerCase())
  );
};