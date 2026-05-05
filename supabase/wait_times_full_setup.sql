-- Full setup for a NEW Supabase project (run once in SQL Editor after project is created).
-- Creates `wait_times` + indexes + RLS policies for the NYC Tennis app.

CREATE TABLE IF NOT EXISTS public.wait_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_name text NOT NULL,
  wait_time text NOT NULL,
  comment text NOT NULL DEFAULT '',
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS wait_times_expires_at_idx ON public.wait_times (expires_at DESC);
CREATE INDEX IF NOT EXISTS wait_times_court_created_idx ON public.wait_times (court_name, created_at DESC);

ALTER TABLE public.wait_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wait_times_select_public" ON public.wait_times;
DROP POLICY IF EXISTS "wait_times_insert_public" ON public.wait_times;
DROP POLICY IF EXISTS "wait_times_delete_public" ON public.wait_times;

CREATE POLICY "wait_times_select_public"
  ON public.wait_times FOR SELECT
  USING (true);

CREATE POLICY "wait_times_insert_public"
  ON public.wait_times FOR INSERT
  WITH CHECK (true);

CREATE POLICY "wait_times_delete_public"
  ON public.wait_times FOR DELETE
  USING (true);
