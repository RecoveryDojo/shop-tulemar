-- Fix security vulnerabilities by removing public access policies

-- Remove public access from project management tables
DROP POLICY IF EXISTS "Anon all access" ON public.documentation;
DROP POLICY IF EXISTS "Anon all access" ON public.features;
DROP POLICY IF EXISTS "Anon all access" ON public.tasks;
DROP POLICY IF EXISTS "Anon all access" ON public.milestones;
DROP POLICY IF EXISTS "Anon all access" ON public.team_members;
DROP POLICY IF EXISTS "Anon all access" ON public.subtasks;
DROP POLICY IF EXISTS "Anon all access" ON public.task_comments;
DROP POLICY IF EXISTS "Anon all access" ON public.time_entries;
DROP POLICY IF EXISTS "Anon all access" ON public.task_dependencies;

-- Update product catalog access to require authentication
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Authenticated users can view active products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Authenticated users can view active categories" ON public.categories
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Restrict AI pattern types to authenticated users
DROP POLICY IF EXISTS "Everyone can view active pattern types" ON public.ai_pattern_types;
CREATE POLICY "Authenticated users can view active pattern types" ON public.ai_pattern_types
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Add public access for shop browsing (guests need to see products)
CREATE POLICY "Public can view active products for shopping" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active categories for shopping" ON public.categories
  FOR SELECT USING (is_active = true);