-- Create Jessica's account manually with all required components
-- 1) Create the auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'b8c7e4d2-9f8a-4e7b-a8d9-c5f1e2d3a4b5',
  '00000000-0000-0000-0000-000000000000',
  'babeslovesdaisies@gmail.com',
  crypt('TempPass123!', gen_salt('bf')),
  now(),
  '2025-09-12 22:10:00+00:00',
  now(),
  '{"display_name": "Jessica Wallsinger"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- 2) Create the profile (will trigger email preferences creation automatically)
INSERT INTO public.profiles (
  id,
  display_name,
  email,
  phone,
  preferences,
  created_at
) VALUES (
  'b8c7e4d2-9f8a-4e7b-a8d9-c5f1e2d3a4b5',
  'Jessica Wallsinger',
  'babeslovesdaisies@gmail.com',
  '2146749070',
  '{"created_via": "admin_recovery", "original_order_id": "93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7"}'::jsonb,
  '2025-09-12 22:10:00+00:00'
) ON CONFLICT (id) DO NOTHING;

-- 3) Assign client role
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at
) VALUES (
  'b8c7e4d2-9f8a-4e7b-a8d9-c5f1e2d3a4b5',
  'client',
  '2025-09-12 22:10:00+00:00'
) ON CONFLICT (user_id, role) DO NOTHING;