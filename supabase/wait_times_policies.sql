-- If the `wait_times` table does not exist yet, run `wait_times_full_setup.sql` instead.
-- Use this file only when the table already exists and you only need RLS policies.
--
-- Run in Supabase → SQL Editor if reports fail with permission / RLS errors.

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
