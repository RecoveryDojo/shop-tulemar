-- Automated category reassignment based on product name keywords
-- Restrict updates to items currently miscategorized as 'baby-family'

WITH updated_beverages AS (
  UPDATE public.products
  SET category_id = 'coffee-beverages'
  WHERE is_active = true
    AND category_id = 'baby-family'
    AND (
      name ILIKE ANY (ARRAY[
        '%coffee%','%tea%','%juice%','%soda%','%cola%','%soft drink%','%water%','%sparkling water%','%energy drink%','%non-alcoholic%'
      ])
    )
  RETURNING id
),
updated_wines AS (
  UPDATE public.products
  SET category_id = 'wines-spirits'
  WHERE is_active = true
    AND category_id = 'baby-family'
    AND (
      name ILIKE ANY (ARRAY[
        '%beer%','%lager%','%ipa%','%stout%','%ale%','%wine%','%red wine%','%white wine%',
        '%rosé%','%champagne%','%sparkling%','%vodka%','%whiskey%','%bourbon%','%gin%',
        '%tequila%','%rum%','%vermouth%','%liqueur%','%margarita%','%bloody mary%','%piña colada%','%pina colada%'
      ])
    )
    AND name NOT ILIKE '%non-alcoholic%'
  RETURNING id
),
updated_dairy AS (
  UPDATE public.products
  SET category_id = 'dairy-eggs'
  WHERE is_active = true
    AND category_id = 'baby-family'
    AND name ILIKE ANY (ARRAY[
      '%milk%','%cheese%','%butter%','%yogurt%','%egg%','%cream%','%brie%','%mozzarella%','%cheddar%'
    ])
  RETURNING id
),
updated_bakery AS (
  UPDATE public.products
  SET category_id = 'bakery-grains'
  WHERE is_active = true
    AND category_id = 'baby-family'
    AND name ILIKE ANY (ARRAY[
      '%bread%','%bagel%','%bun%','%tortilla%','%pita%','%croissant%','%brioche%','%roll%',
      '%chips%','%cracker%','%cookies%','%cookie%','%pretzel%','%popcorn%','%granola%','%cereal%','%oats%','%oatmeal%','%rice%','%pasta%','%flour%','%burrito%','%pizza%'
    ])
  RETURNING id
),
updated_meat AS (
  UPDATE public.products
  SET category_id = 'meat-poultry'
  WHERE is_active = true
    AND category_id = 'baby-family'
    AND name ILIKE ANY (ARRAY[
      '%beef%','%steak%','%pork%','%chicken%','%turkey%','%bacon%','%sausage%','%ham%','%lamb%','%ground beef%'
    ])
  RETURNING id
),
updated_seafood AS (
  UPDATE public.products
  SET category_id = 'fresh-seafood'
  WHERE is_active = true
    AND category_id = 'baby-family'
    AND name ILIKE ANY (ARRAY[
      '%fish%','%salmon%','%tuna%','%shrimp%','%prawn%','%lobster%','%crab%','%tilapia%','%mahi%'
    ])
  RETURNING id
),
updated_produce AS (
  UPDATE public.products
  SET category_id = 'fresh-produce'
  WHERE is_active = true
    AND category_id = 'baby-family'
    AND name ILIKE ANY (ARRAY[
      '%apple%','%banana%','%orange%','%lemon%','%lime%','%avocado%','%tomato%','%onion%','%lettuce%','%spinach%','%broccoli%','%carrot%','%pepper%','%potato%','%cilantro%','%parsley%','%basil%','%herb%'
    ])
  RETURNING id
),
updated_organic AS (
  UPDATE public.products
  SET category_id = 'organic-health'
  WHERE is_active = true
    AND category_id = 'baby-family'
    AND name ILIKE ANY (ARRAY[
      '%organic%','%gluten-free%','%vegan%','%supplement%','%protein%','%keto%','%vitamin%'
    ])
  RETURNING id
)
SELECT
  (SELECT count(*) FROM updated_beverages) AS beverages_updated,
  (SELECT count(*) FROM updated_wines) AS wines_updated,
  (SELECT count(*) FROM updated_dairy) AS dairy_updated,
  (SELECT count(*) FROM updated_bakery) AS bakery_updated,
  (SELECT count(*) FROM updated_meat) AS meat_updated,
  (SELECT count(*) FROM updated_seafood) AS seafood_updated,
  (SELECT count(*) FROM updated_produce) AS produce_updated,
  (SELECT count(*) FROM updated_organic) AS organic_updated;