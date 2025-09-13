-- Ensure automatic profile and role creation on user signup
-- 1) Create trigger to call public.handle_new_user() when a user registers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- 2) Create trigger to auto-create default email preferences when a profile is created
DROP TRIGGER IF EXISTS create_email_prefs ON public.profiles;
CREATE TRIGGER create_email_prefs
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.create_default_email_preferences();

-- 3) Backfill: Create profiles for existing users missing profiles
INSERT INTO public.profiles (id, display_name, email)
SELECT au.id,
       COALESCE(au.raw_user_meta_data->>'display_name', au.email) AS display_name,
       au.email
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 4) Backfill: Assign 'client' role for existing users missing any role
-- Ensure the enum app_role has 'client' (already present in schema)
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'client'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.user_id IS NULL;
