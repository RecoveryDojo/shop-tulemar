-- Add sample documentation entries to showcase the system
INSERT INTO public.documentation (project_id, title, description, type, status, priority, tags, notes)
SELECT 
  p.id as project_id,
  'Added Documentation System' as title,
  'Created a comprehensive documentation system to track all development work including builds, fixes, updates, features, bugs, and improvements. Features include filtering, search, status tracking, and priority management.' as description,
  'feature' as type,
  'completed' as status,
  'high' as priority,
  ARRAY['documentation', 'tracking', 'ui', 'database'] as tags,
  'This system allows tracking of all development work with categories, status updates, and comprehensive filtering options.' as notes
FROM public.projects p
LIMIT 5;

INSERT INTO public.documentation (project_id, title, description, type, status, priority, tags, notes)
SELECT 
  p.id as project_id,
  'Implemented Role-Based Authentication' as title,
  'Built complete authentication system with role-based access control supporting admin, driver, client, concierge, and sysadmin user roles. Includes secure RLS policies and user management.' as description,
  'build' as type,
  'completed' as status,
  'critical' as priority,
  ARRAY['auth', 'security', 'rbac', 'supabase'] as tags,
  'Authentication system with multiple user roles and secure database policies implemented.' as notes
FROM public.projects p
LIMIT 5;