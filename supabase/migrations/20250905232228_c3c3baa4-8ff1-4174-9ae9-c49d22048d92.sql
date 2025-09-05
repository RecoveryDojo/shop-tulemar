
-- 1) Staging tables for AI-assisted imports

-- Table: import_jobs
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  source_filename text,
  original_headers jsonb,
  column_mapping jsonb,
  settings jsonb,
  status text NOT NULL DEFAULT 'created', -- created | processing | completed | failed
  stats_total_rows integer DEFAULT 0,
  stats_valid_rows integer DEFAULT 0,
  stats_error_rows integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: import_items
CREATE TABLE IF NOT EXISTS public.import_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_index integer, -- original row index from sheet
  raw jsonb NOT NULL, -- original row as-is
  normalized jsonb,   -- AI/heuristic normalized shape
  status text NOT NULL DEFAULT 'pending', -- pending | suggested | ready | published | error
  errors text[] DEFAULT '{}'::text[],
  -- Flattened columns for convenience and publishing
  name text,
  description text,
  price numeric,
  category_id text,
  unit text,
  origin text,
  image_url text,
  stock_quantity integer,
  product_id uuid, -- if published/linked
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Triggers to maintain updated_at
DROP TRIGGER IF EXISTS set_timestamp_import_jobs ON public.import_jobs;
CREATE TRIGGER set_timestamp_import_jobs
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_import_items ON public.import_items;
CREATE TRIGGER set_timestamp_import_items
BEFORE UPDATE ON public.import_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Indexes for performance
CREATE INDEX IF NOT EXISTS import_jobs_created_by_idx ON public.import_jobs (created_by);
CREATE INDEX IF NOT EXISTS import_jobs_status_idx ON public.import_jobs (status);
CREATE INDEX IF NOT EXISTS import_items_job_id_idx ON public.import_items (job_id);
CREATE INDEX IF NOT EXISTS import_items_status_idx ON public.import_items (status);
CREATE INDEX IF NOT EXISTS import_items_row_index_idx ON public.import_items (row_index);
CREATE INDEX IF NOT EXISTS import_items_raw_gin ON public.import_items USING GIN (raw);
CREATE INDEX IF NOT EXISTS import_items_normalized_gin ON public.import_items USING GIN (normalized);

-- 4) RLS: Admin-only by default (leverages existing function is_admin_or_sysadmin)
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage import_jobs
DROP POLICY IF EXISTS "Admins can manage import jobs" ON public.import_jobs;
CREATE POLICY "Admins can manage import jobs"
ON public.import_jobs
FOR ALL
USING (is_admin_or_sysadmin(auth.uid()))
WITH CHECK (is_admin_or_sysadmin(auth.uid()));

-- Admins can manage import_items
DROP POLICY IF EXISTS "Admins can manage import items" ON public.import_items;
CREATE POLICY "Admins can manage import items"
ON public.import_items
FOR ALL
USING (is_admin_or_sysadmin(auth.uid()))
WITH CHECK (is_admin_or_sysadmin(auth.uid()));
