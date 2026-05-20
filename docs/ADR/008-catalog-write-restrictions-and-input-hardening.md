# ADR 008 — Catalog write restrictions and request-input hardening

## Context

After the [4-area audit](../../README.md#decisiones-de-diseño-adrs) we
identified several issues to fix **before** the app goes live on Netlify:

1. **`clientes` / `productos` UPDATE policy was open to any authenticated
   user.** A vendor could rename `"ABM ELECTRICIDAD SPA"` to `"abm Inc."`
   or change `Interruptor 63A` price from `484.545` to `1`. No audit
   trail, no business reason.
2. **The free-text search `q` interpolated user input directly into the
   PostgREST `ilike` pattern.** Sending `?q=%____%` made the query do a
   wildcard scan of the joined `clientes` table. Not a SQL-injection
   in the classical sense (supabase-js parametrises the value) but a
   DoS and enumeration vector.
3. **The PDF `Content-Disposition` filename interpolated `razon_social`
   directly.** A cliente whose razón social contained `"\r\n` would
   inject HTTP headers into the response.

The cotizaciones `SELECT` policy was also flagged as "permissive"
because every authenticated user can read every quote. We deliberately
keep it open per ADR 002 — the small ERSE team needs everyone to see
the pipeline. No change there.

## Decision

### Migration 0005: catalog write restrictions

```sql
-- clientes
create policy "clientes update (admin)" on public.clientes for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- productos (same shape)
```

INSERT stays open so vendors can register a new cliente or product they
encountered without waiting for an admin. UPDATE is admin-only.

### App-level mirroring

- `updateClienteAction` and `updateProductoAction` look up the caller's
  `is_admin` flag and return `"Sólo administradores pueden editar…"`
  before issuing the UPDATE. This keeps the failure message friendly
  instead of letting the RLS-rejected UPDATE silently affect 0 rows.
- `/clientes` and `/productos` pages fetch the viewer's `is_admin` and
  pass `canEdit` to the table component. The "Editar" button is hidden
  for non-admins and replaced with a `—` placeholder.

### `q` filter sanitised

The search filter on `/cotizaciones`:

```ts
const escaped = q.slice(0, 80).replace(/[\\%_]/g, '\\$&');
query = query.ilike('clientes.razon_social', `%${escaped}%`);
```

- Caps the input at 80 chars so an attacker can't ship a megabyte of
  pattern data.
- Escapes the three `ilike` metacharacters (`\`, `%`, `_`) so a typed
  `%` becomes a literal percent sign, not a wildcard.

### Safe `Content-Disposition`

New helper `lib/pdf/filename.ts` exports `contentDispositionInline(rawName)`
that:

- Normalises the string with NFKD + strips anything not in
  `[A-Za-z0-9._\- ]`, collapses whitespace and underscores.
- Caps the ASCII filename at 80 chars.
- Emits the RFC 5987 `filename*=UTF-8''…` form alongside the legacy
  `filename=` so UTF-8 names survive on modern browsers.

Both `/cotizaciones/[id]/pdf` and `/manual` use this helper. The
behaviour is locked by tests in `filename.test.ts`.

### Error messages

`throw new Error(error.message)` was leaking PostgREST internals (column
names, RLS specifics). Replaced with generic strings in the listings;
the original error is still available in server logs for debugging.

## Consequences

- **Vendors can no longer edit clientes/productos.** This is a UX change.
  If a vendor needs a fix, they ask an admin — same flow as user
  management.
- **The audit trail of who edited what is still missing.** When that
  matters we'll add an `updated_by` column + trigger; not in scope here.
- **Search no longer auto-expands `%`.** A vendor who copy-pastes `%`
  into the search will now get exact matches instead of wildcards. Edge
  case, acceptable.
- **PDF filenames change slightly.** Customers receive files like
  `Cotizacion_5530_ABM_ELECTRICIDAD_SPA.pdf` (no special chars). UTF-8
  names round-trip via the `filename*` form on Chrome/Firefox/Safari.
- **Cotizaciones SELECT stays open** — documented decision (ADR 002).
  If business changes mind, a future migration tightens it without
  touching this ADR.

## Alternatives considered

- **Restrict INSERT too.** Would force vendors to ask an admin every
  time they land a new cliente. Rejected — too much friction for a
  small team.
- **Add `updated_by` audit column now.** Useful but expands the scope;
  the immediate goal is closing the unauthorised-write hole.
- **Use Postgres `auth.uid()` directly in the RLS instead of the
  `EXISTS … profiles` lookup.** Same outcome but less explicit; the
  exists form documents the intent in the policy itself.
- **Run a full-text search (`tsvector`) instead of `ilike`.** Better
  for large catalogs, but the cotizaciones list is small for the
  foreseeable future; revisit when row count grows past a few hundred.
