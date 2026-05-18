-- Migration 0001 — quotation tables for ERSE Electric.
-- Apply manually in Supabase SQL Editor on project fpvvbitexaspktkinfxv.
-- Idempotent enough to re-run during early development: drops happen only
-- inside DO blocks that check existence first. After the schema stabilises
-- we should manage migrations through the Supabase CLI.

------------------------------------------------------------------------
-- 1. profiles: link auth.users to a display name shown as VENDEDOR(a)
------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user metadata. nombre_completo is rendered as VENDEDOR(a) on the cotización PDF.';

-- Auto-create a profile row whenever a new auth user is created.
-- Falls back to the email local-part if no full_name was provided at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre_completo)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nombre_completo',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------
-- 2. cotizaciones: header of each quotation
------------------------------------------------------------------------

-- Numeración correlativa. Starts at 5527 to continue from the legacy Nº 5526.
create sequence if not exists public.cotizaciones_numero_seq
  start with 5527
  increment by 1
  minvalue 1
  no maxvalue
  cache 1;

create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique default nextval('public.cotizaciones_numero_seq'),

  cliente_rut text not null references public.clientes(rut),
  vendedor_id uuid not null references auth.users(id),

  fecha date not null default current_date,
  vencimiento text not null default '2 días hábiles',
  condicion_pago text,

  estado text not null default 'borrador'
    check (estado in ('borrador', 'enviada', 'aprobada', 'rechazada')),
  notas text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter sequence public.cotizaciones_numero_seq owned by public.cotizaciones.numero;

comment on table public.cotizaciones is
  'Quotation header. Totals are not stored — recompute from cotizacion_items.';
comment on column public.cotizaciones.numero is
  'Public-facing correlative shown as "Nº" on the PDF.';

create index if not exists cotizaciones_cliente_rut_idx on public.cotizaciones(cliente_rut);
create index if not exists cotizaciones_vendedor_id_idx on public.cotizaciones(vendedor_id);
create index if not exists cotizaciones_fecha_idx on public.cotizaciones(fecha desc);

------------------------------------------------------------------------
-- 3. cotizacion_items: line items with price snapshots
------------------------------------------------------------------------

create table if not exists public.cotizacion_items (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  posicion integer not null,

  -- Snapshots from productos at the moment of quoting. Do NOT FK to productos:
  -- price/description changes in the catalog must never alter past quotes.
  codigo_sku text not null,
  descripcion text not null,
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),

  cantidad numeric(12, 2) not null check (cantidad > 0),
  descuento_porcentaje numeric(5, 2) not null default 0
    check (descuento_porcentaje between 0 and 100),

  created_at timestamptz not null default now(),

  unique (cotizacion_id, posicion)
);

comment on table public.cotizacion_items is
  'Quotation lines. codigo_sku/descripcion/precio_unitario are snapshots; never join back to productos for historical data.';

create index if not exists cotizacion_items_cotizacion_id_idx on public.cotizacion_items(cotizacion_id);

------------------------------------------------------------------------
-- 4. updated_at trigger for cotizaciones
------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cotizaciones_set_updated_at on public.cotizaciones;
create trigger cotizaciones_set_updated_at
  before update on public.cotizaciones
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------
-- 5. Row Level Security
-- Internal-team app: every authenticated user can read and write everything.
-- Anon role is denied. Tighten per-vendor once the team requires it.
------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.cotizacion_items enable row level security;

-- profiles
drop policy if exists "profiles read all (auth)" on public.profiles;
create policy "profiles read all (auth)"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- cotizaciones
drop policy if exists "cotizaciones read all (auth)" on public.cotizaciones;
create policy "cotizaciones read all (auth)"
  on public.cotizaciones for select
  to authenticated
  using (true);

drop policy if exists "cotizaciones insert own" on public.cotizaciones;
create policy "cotizaciones insert own"
  on public.cotizaciones for insert
  to authenticated
  with check (vendedor_id = auth.uid());

drop policy if exists "cotizaciones update own" on public.cotizaciones;
create policy "cotizaciones update own"
  on public.cotizaciones for update
  to authenticated
  using (vendedor_id = auth.uid())
  with check (vendedor_id = auth.uid());

drop policy if exists "cotizaciones delete own" on public.cotizaciones;
create policy "cotizaciones delete own"
  on public.cotizaciones for delete
  to authenticated
  using (vendedor_id = auth.uid());

-- cotizacion_items inherit access through their parent cotización
drop policy if exists "cotizacion_items read all (auth)" on public.cotizacion_items;
create policy "cotizacion_items read all (auth)"
  on public.cotizacion_items for select
  to authenticated
  using (true);

drop policy if exists "cotizacion_items write via parent" on public.cotizacion_items;
create policy "cotizacion_items write via parent"
  on public.cotizacion_items for all
  to authenticated
  using (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_items.cotizacion_id
        and c.vendedor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_items.cotizacion_id
        and c.vendedor_id = auth.uid()
    )
  );

------------------------------------------------------------------------
-- 6. Existing tables: keep clientes and productos readable by authenticated
-- users for now. Do NOT touch anon access here — the legacy HTML prototype
-- still uses anon. Revisit once that prototype is retired.
------------------------------------------------------------------------
