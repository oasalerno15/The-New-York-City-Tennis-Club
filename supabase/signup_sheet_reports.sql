-- =============================================================================
-- Sign Up Sheets feature: table + RLS + Storage bucket policies
-- Run the full script in the Supabase SQL Editor (Dashboard → SQL).
-- Safe to re-run: drops and recreates policies by name.
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
  device_id text,
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

drop policy if exists "signup_sheet_reports_select_public" on public.signup_sheet_reports;
create policy "signup_sheet_reports_select_public"
  on public.signup_sheet_reports
  for select
  to anon, authenticated
  using (expires_at > now());

drop policy if exists "signup_sheet_reports_insert_anon" on public.signup_sheet_reports;
create policy "signup_sheet_reports_insert_anon"
  on public.signup_sheet_reports
  for insert
  to anon, authenticated
  with check (true);

-- 3) Storage bucket -----------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('signup-sheet-photos', 'signup-sheet-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "signup_photos_select_anon" on storage.objects;
create policy "signup_photos_select_anon"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'signup-sheet-photos');

drop policy if exists "signup_photos_insert_anon" on storage.objects;
create policy "signup_photos_insert_anon"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'signup-sheet-photos');
