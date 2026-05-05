-- Add anonymous device_id for repeat-contributor analytics (run once in Supabase SQL Editor).
-- Safe to re-run.

ALTER TABLE public.wait_times ADD COLUMN IF NOT EXISTS device_id text;
ALTER TABLE public.signup_sheet_reports ADD COLUMN IF NOT EXISTS device_id text;

COMMENT ON COLUMN public.wait_times.device_id IS
  'Opaque browser id from client localStorage (smartcourt_device_id); no login.';
COMMENT ON COLUMN public.signup_sheet_reports.device_id IS
  'Opaque browser id from client localStorage (smartcourt_device_id); no login.';

CREATE INDEX IF NOT EXISTS wait_times_device_id_idx
  ON public.wait_times (device_id)
  WHERE device_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS signup_sheet_reports_device_id_idx
  ON public.signup_sheet_reports (device_id)
  WHERE device_id IS NOT NULL;
