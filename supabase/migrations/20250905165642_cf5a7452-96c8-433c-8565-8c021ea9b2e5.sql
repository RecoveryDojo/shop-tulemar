-- Security fix: restrict projects table from anonymous access
-- 1) Remove the overly permissive anonymous policy
DROP POLICY IF EXISTS "Anon all access" ON public.projects; 

-- Note: We keep the existing authenticated policy in place ("Allow all for authenticated users")
-- so that signed-in users continue to have access without breaking current functionality.