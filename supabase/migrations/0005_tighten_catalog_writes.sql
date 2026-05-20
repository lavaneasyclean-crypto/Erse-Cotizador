-- Migration 0005 — restrict catalog writes (clientes, productos) to admins.
--
-- Until now any authenticated vendor could UPDATE any cliente or producto,
-- which the security audit flagged as a high-impact problem: a vendor could
-- rename a cliente ("ABM Electricidad" → "ABM Electric") or change a
-- producto's price, with no audit trail and potentially poisoning future
-- quotations. The internal-team trust model still permits any vendor to
-- INSERT (so they can register a new cliente they just landed without
-- waiting for an admin); only UPDATE is reserved for admins.
--
-- SELECT stays open for authenticated users on every table — that is the
-- documented decision in ADR 002 (small team, everyone sees the pipeline).
--
-- Apply manually in Supabase SQL Editor.

------------------------------------------------------------------------
-- clientes
------------------------------------------------------------------------

drop policy if exists "clientes update (auth)" on public.clientes;
drop policy if exists "clientes update (admin)" on public.clientes;

create policy "clientes update (admin)"
  on public.clientes for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- INSERT stays open for any authenticated user — vendors can still register
-- new clientes from the quote flow.

------------------------------------------------------------------------
-- productos
------------------------------------------------------------------------

drop policy if exists "productos update (auth)" on public.productos;
drop policy if exists "productos update (admin)" on public.productos;

create policy "productos update (admin)"
  on public.productos for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- INSERT stays open: vendors can add a new SKU they encountered without
-- waiting for an admin.
