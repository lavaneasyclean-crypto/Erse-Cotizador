-- Migration 0004 — admins can update any cotización.
--
-- Before this migration the UPDATE policy on `cotizaciones` only allowed the
-- vendor who created the quote. Admins (profiles.is_admin = true) need to be
-- able to flip estado on any quote — e.g. a sales manager marking quotes as
-- aprobada / rechazada based on a phone call.
--
-- Apply manually in Supabase SQL Editor on project fpvvbitexaspktkinfxv.

------------------------------------------------------------------------
-- cotizaciones: UPDATE policy
------------------------------------------------------------------------

drop policy if exists "cotizaciones update own" on public.cotizaciones;
drop policy if exists "cotizaciones update by owner or admin" on public.cotizaciones;

create policy "cotizaciones update by owner or admin"
  on public.cotizaciones for update
  to authenticated
  using (
    vendedor_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    vendedor_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

------------------------------------------------------------------------
-- cotizacion_items: same change so admins can edit items if/when we add
-- that capability (currently we don't, but the rule should stay aligned
-- with the parent).
------------------------------------------------------------------------

drop policy if exists "cotizacion_items write via parent" on public.cotizacion_items;
drop policy if exists "cotizacion_items write via parent or admin" on public.cotizacion_items;

create policy "cotizacion_items write via parent or admin"
  on public.cotizacion_items for all
  to authenticated
  using (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_items.cotizacion_id
        and (
          c.vendedor_id = auth.uid()
          or exists (
            select 1 from public.profiles
            where id = auth.uid() and is_admin = true
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_items.cotizacion_id
        and (
          c.vendedor_id = auth.uid()
          or exists (
            select 1 from public.profiles
            where id = auth.uid() and is_admin = true
          )
        )
    )
  );
