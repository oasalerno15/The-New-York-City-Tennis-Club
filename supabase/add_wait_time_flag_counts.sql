-- Add crowd confirmation flags to wait time reports (run in Supabase SQL Editor).

ALTER TABLE public.wait_times
  ADD COLUMN IF NOT EXISTS confirmed_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outdated_count integer NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "wait_times_update_public" ON public.wait_times;

CREATE POLICY "wait_times_update_public"
  ON public.wait_times FOR UPDATE
  USING (true)
  WITH CHECK (true);
