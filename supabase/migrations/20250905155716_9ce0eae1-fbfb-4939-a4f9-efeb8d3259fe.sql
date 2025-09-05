-- Promote a specific user to sysadmin by email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'sysadmin'::app_role
FROM auth.users
WHERE email = 'scotticainc@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;