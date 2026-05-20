-- Migration 0006 — audit columns on clientes and productos.
--
-- The security audit flagged that catalog updates had no trail: an admin
-- could rename a cliente or change a precio and nobody could see who/when.
-- We add updated_at + updated_by on both tables. updated_at is set by a
-- trigger on every UPDATE; updated_by is set explicitly by the server
-- actions so it reflects the human caller, not the role.
--
-- Apply manually in Supabase SQL Editor.

------------------------------------------------------------------------
-- 1. clientes — add columns
------------------------------------------------------------------------

alter table public.clientes
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users(id);

------------------------------------------------------------------------
-- 2. productos — add columns
------------------------------------------------------------------------

alter table public.productos
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users(id);

------------------------------------------------------------------------
-- 3. updated_at trigger (reuses public.set_updated_at from migration 0001)
------------------------------------------------------------------------

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

drop trigger if exists productos_set_updated_at on public.productos;
create trigger productos_set_updated_at
  before update on public.productos
  for each row execute function public.set_updated_at();
