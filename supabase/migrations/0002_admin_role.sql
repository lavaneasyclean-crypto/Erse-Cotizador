-- Migration 0002 — admin role on profiles.
-- Apply manually in Supabase SQL Editor on project fpvvbitexaspktkinfxv.

------------------------------------------------------------------------
-- 1. Add is_admin flag
------------------------------------------------------------------------

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'When true, the user can access /admin/* pages (create/manage users). Toggled via the service-role admin client only — never editable from regular RLS.';

------------------------------------------------------------------------
-- 2. Bootstrap: mark the current single user as admin.
--    Edit the WHERE clause if you have multiple users and want to
--    pick a different one. Safe to re-run — already-admin users
--    stay admin.
------------------------------------------------------------------------

update public.profiles
   set is_admin = true
 where id = (
   select id from auth.users where email = 'ventas@erse.cl' limit 1
 );

------------------------------------------------------------------------
-- 3. RLS update: the existing "profiles update own" policy only lets
--    users edit their own row, so is_admin cannot be self-elevated.
--    Admins toggle other users' is_admin via the service-role key,
--    which bypasses RLS entirely — no extra policy needed.
------------------------------------------------------------------------
