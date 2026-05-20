-- Migration 0003 — clientes and productos RLS.
--
-- Until now `clientes` and `productos` were readable by the anon role because
-- the legacy HTML prototype (ERSEELECTRIC/erp-erse) used the anon key. That
-- prototype is retired. Lock both tables to authenticated users.
--
-- Apply manually in Supabase SQL Editor on project fpvvbitexaspktkinfxv.

------------------------------------------------------------------------
-- clientes
------------------------------------------------------------------------

alter table public.clientes enable row level security;

drop policy if exists "clientes anon read"        on public.clientes;
drop policy if exists "clientes public read"      on public.clientes;
drop policy if exists "clientes anon write"       on public.clientes;
drop policy if exists "clientes read all (auth)"  on public.clientes;
drop policy if exists "clientes insert (auth)"    on public.clientes;
drop policy if exists "clientes update (auth)"    on public.clientes;

create policy "clientes read all (auth)"
  on public.clientes for select
  to authenticated
  using (true);

create policy "clientes insert (auth)"
  on public.clientes for insert
  to authenticated
  with check (true);

create policy "clientes update (auth)"
  on public.clientes for update
  to authenticated
  using (true)
  with check (true);

-- No delete policy on purpose: deletes are blocked because removing a cliente
-- would break the FK from cotizaciones and corrupt history. Use a future
-- "activo" flag for soft-delete if needed.

------------------------------------------------------------------------
-- productos (same tightening — they were also anon-readable)
------------------------------------------------------------------------

alter table public.productos enable row level security;

drop policy if exists "productos anon read"        on public.productos;
drop policy if exists "productos public read"      on public.productos;
drop policy if exists "productos anon write"       on public.productos;
drop policy if exists "productos read all (auth)"  on public.productos;
drop policy if exists "productos insert (auth)"    on public.productos;
drop policy if exists "productos update (auth)"    on public.productos;

create policy "productos read all (auth)"
  on public.productos for select
  to authenticated
  using (true);

create policy "productos insert (auth)"
  on public.productos for insert
  to authenticated
  with check (true);

create policy "productos update (auth)"
  on public.productos for update
  to authenticated
  using (true)
  with check (true);
