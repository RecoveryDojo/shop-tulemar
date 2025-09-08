-- Add Dairy & Eggs category
INSERT INTO public.categories (id, name, icon, description, is_active)
VALUES ('dairy-eggs', 'Dairy & Eggs', '🥛', 'Fresh dairy products, eggs, cheese, and milk', true)
ON CONFLICT (id) DO NOTHING;