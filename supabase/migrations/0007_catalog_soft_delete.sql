-- Migration 0007 — soft-delete via `activo` flag on clientes and productos.
--
-- Deleting catalog rows breaks history (cotizaciones FK to clientes; SKU
-- snapshots in cotizacion_items reference productos). Hard delete is
-- already blocked at the RLS layer. We add an `activo` boolean so admins
-- can hide an obsolete cliente or producto from the new-quote pickers
-- without losing it from old cotizaciones — those still resolve via the
-- snapshot or by FK lookup.
--
-- Apply manually in Supabase SQL Editor.

------------------------------------------------------------------------
-- clientes
------------------------------------------------------------------------

alter table public.clientes
  add column if not exists activo boolean not null default true;

create index if not exists clientes_activo_idx on public.clientes(activo);

------------------------------------------------------------------------
-- productos
------------------------------------------------------------------------

alter table public.productos
  add column if not exists activo boolean not null default true;

create index if not exists productos_activo_idx on public.productos(activo);
