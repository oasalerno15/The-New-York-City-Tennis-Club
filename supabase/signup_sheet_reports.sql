-- =============================================================================
-- Sign Up Sheets feature: table + RLS + Storage bucket policies
-- Run in Supabase SQL Editor (or via migration). Adjust if your project uses a custom schema.
-- =============================================================================

-- 1) Table -------------------------------------------------------------------
create table if not exists public.signup_sheet_reports (
  id uuid primary key default gen_random_uuid(),
  court_name text not null,
  borough text not null,
  status text not null
    constraint signup_sheet_reports_status_check
      check (status in ('sheet_empty', 'few_names', 'line_forming', 'sheet_full')),
  photo_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists signup_sheet_reports_expires_at_idx
  on public.signup_sheet_reports (expires_at);

create index if not exists signup_sheet_reports_court_created_idx
  on public.signup_sheet_reports (court_name, created_at desc);

comment on table public.signup_sheet_reports is
  'Anonymous sign-up sheet line reports; expires_at hides stale rows (8h in app).';

-- 2) Row Level Security ------------------------------------------------------
alter table public.signup_sheet_reports enable row level security;

-- Anyone can read non-expired rows (optional: remove time check and filter in app only)
create policy "signup_sheet_reports_select_public"
  on public.signup_sheet_reports
  for select
  to anon, authenticated
  using (expires_at > now());

-- Anonymous inserts (no login) — matches frictonless mobile reporting
create policy "signup_sheet_reports_insert_anon"
  on public.signup_sheet_reports
  for insert
  to anon, authenticated
  with check (true);

-- No updates/deletes from clients (optional cleanup via service role cron)
-- create policy ... for delete to service_role only (manage in Dashboard if needed)

-- 3) Storage bucket -----------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('signup-sheet-photos', 'signup-sheet-photos', true)
on conflict (id) do update set public = excluded.public;

-- Read objects in this bucket (public bucket + policy)
create policy "signup_photos_select_anon"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'signup-sheet-photos');

-- Anonymous uploads (keep simple; optional: add file size / mime checks)
create policy "signup_photos_insert_anon"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'signup-sheet-photos');

-- Optional: allow users to replace own objects — not needed for one-shot uploads
-- Optional: tighten with (storage.extension(name) in ('jpg','jpeg','png','webp'))
