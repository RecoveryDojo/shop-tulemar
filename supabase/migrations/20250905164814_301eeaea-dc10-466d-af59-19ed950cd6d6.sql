
-- Allow admin/sysadmin to view all profiles
create policy "Admin/Sysadmin can view all profiles"
  on public.profiles
  for select
  using (is_admin_or_sysadmin(auth.uid()));
