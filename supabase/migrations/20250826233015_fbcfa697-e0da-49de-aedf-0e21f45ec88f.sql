-- Fix linter: set search_path for function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Loosen RLS for work-tracker tables to allow anon (no-auth) usage for now
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.projects FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='features' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.features FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.tasks FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subtasks' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.subtasks FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='task_dependencies' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.task_dependencies FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='milestones' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.milestones FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_members' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.team_members FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='time_entries' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.time_entries FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='task_comments' AND policyname='Anon all access'
  ) THEN
    CREATE POLICY "Anon all access" ON public.task_comments FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;