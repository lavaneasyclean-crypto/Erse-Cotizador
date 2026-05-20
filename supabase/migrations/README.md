# Supabase migrations

SQL migrations applied **manually** in the Supabase SQL Editor. They are
not run automatically — Netlify never touches the database. Apply them
in numeric order against the project at
https://supabase.com/dashboard/project/fpvvbitexaspktkinfxv.

Each file is idempotent enough to re-run during early development
(`create table if not exists`, `drop policy if exists`, etc.), but the
canonical history is git: don't edit a migration after it has been
applied — write the next one instead.

| File | What it does |
|------|--------------|
| `0001_cotizaciones.sql` | Creates `profiles`, `cotizaciones`, `cotizacion_items`, the `cotizaciones_numero_seq` sequence (starting at **5527**), the new-user trigger, the `updated_at` trigger, and per-table RLS policies (read all / insert+update own). |
| `0002_admin_role.sql` | Adds `profiles.is_admin boolean default false`. Bootstraps `ventas@erse.cl` as the first admin. |
| `0003_clientes_rls.sql` | Enables RLS on `clientes` and `productos` with authenticated-only read/insert/update. Removes any anon access left over from the legacy HTML prototype. |
| `0004_admin_can_update_cotizaciones.sql` | Replaces the `cotizaciones update own` policy with `update by owner or admin` so admins can flip estado on any quote. Same change applied to `cotizacion_items`. |
| `0005_tighten_catalog_writes.sql` | Restricts UPDATE on `clientes` and `productos` to admins (INSERT stays open). See ADR 008. |
| `0006_catalog_audit.sql` | Adds `updated_at` + `updated_by` columns to `clientes` and `productos`, with the shared `set_updated_at` trigger. Server actions set `updated_by = auth.uid()` on every UPDATE. |
| `0007_catalog_soft_delete.sql` | Adds an `activo boolean default true` flag to `clientes` and `productos`. Archived rows are hidden from the new-quote pickers but stay readable for historical cotizaciones. |

## Applying a new migration

1. Open https://supabase.com/dashboard/project/fpvvbitexaspktkinfxv/sql/new
2. Paste the contents of the next-numbered file from this directory.
3. Click **Run**.
4. Verify no errors. Re-run is safe (`if not exists` / `drop … if exists`).

## When to add a new migration

Per ADR rules (`AGENTS.md` §7), any schema change is "architectural" —
write the new migration as `NNNN_short-name.sql` here, then add or
update the relevant ADR in `docs/ADR/`.
