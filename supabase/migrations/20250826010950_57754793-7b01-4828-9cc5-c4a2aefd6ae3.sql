-- Create profiles table for Tulemar Shop with strict RLS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies: users can only manage their own profile
create policy if not exists "Users can view their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy if not exists "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy if not exists "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy if not exists "Users can delete their own profile"
  on public.profiles for delete to authenticated
  using (auth.uid() = id);

-- Timestamp updater function (idempotent)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_profiles_updated_at'
  ) then
    create trigger update_profiles_updated_at
      before update on public.profiles
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- On new auth user, create profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'display_name', ''),
          coalesce(new.raw_user_meta_data ->> 'avatar_url', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger only if it doesn't exist
do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;