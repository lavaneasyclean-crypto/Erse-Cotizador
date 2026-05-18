# ADR 002 — Cotizaciones schema, correlativo and price snapshots

## Context

The app must:

- Generate quotations that look exactly like the legacy `Cotizacion_5526_…` PDF.
- Number each new quotation with a strict, gap-free correlativo starting at **5527** (continuing from the legacy system's Nº 5526).
- Keep historical quotes immutable: even if a product's price changes tomorrow, an old quote must still render with the price the customer was quoted.
- Run on Supabase with anon-only public access today (the legacy HTML prototype still hits `clientes` with the anon key) and per-user write rules going forward.

## Decision

### Tables

- `profiles` — one row per `auth.users` user, holds `nombre_completo` for the `VENDEDOR(a)` field on the PDF. Auto-populated by an `on_auth_user_created` trigger.
- `cotizaciones` — header. UUID primary key, `numero` is a separate integer column.
- `cotizacion_items` — lines. Cascades on header delete.

### Correlativo via `SEQUENCE`

```sql
create sequence cotizaciones_numero_seq start with 5527;
```

The `numero` column defaults to `nextval('cotizaciones_numero_seq')`. Sequences are atomic per Postgres transaction — two simultaneous inserts can never collide, which a `max(numero)+1` SELECT-and-INSERT could. Sequence values can have gaps if a transaction rolls back; that is acceptable here (the legacy system already has gaps in the wild).

### Snapshot price/description on items, do **not** FK to `productos`

`cotizacion_items` stores `codigo_sku`, `descripcion` and `precio_unitario` as plain columns, not foreign keys to `productos`. The product catalog (1,510 rows today) is mutable — prices and names change. If we joined back to `productos` to render an old quote, the customer would see a different number than what they were quoted. The snapshot is the source of truth for historical records.

This also keeps `productos` deletable without breaking quote history (a `set null` FK was considered and rejected for the same reason).

### Totals are computed, not stored

`subtotal`, `iva (19%)` and `total` are derived from `cotizacion_items` rows. Storing them invites drift — a forgotten `UPDATE` on an item without recomputing the cached total leaves the PDF and the database disagreeing. We compute on read in the service layer; performance is fine because every quote has a small handful of rows.

### Profiles instead of `raw_user_meta_data`

The vendedor name needs to be queryable (e.g. join on quote list) and editable from the UI later. `raw_user_meta_data` is opaque JSON on `auth.users` and is not joinable cleanly. A normalised `profiles` table is the recommended Supabase pattern.

### RLS

Every authenticated user can `SELECT` everything (it's a small internal team — they need to see each other's quotes). `INSERT`/`UPDATE`/`DELETE` are restricted to the vendor who created the row (`vendedor_id = auth.uid()`). The `cotizacion_items` policy gates on the parent cotización's vendor. Anon role is denied on all new tables.

`clientes` and `productos` are deliberately **not** modified by this migration. The legacy HTML prototype still reads them with the anon key; tightening that is a separate change tracked in [[project-cotizaciones]].

## Consequences

- Numbers will have gaps if inserts roll back. Documented; matches legacy behaviour.
- Item snapshots double-store some data already in `productos`. The duplication is intentional and the cost is negligible.
- Adding a new vendor only requires creating an auth user — the trigger handles the profile.
- Future tightening (per-vendor visibility, manager role, archive) is an additive change to the RLS policies, not a schema migration.

## Quotation history is append-only

Cotizaciones are never edited in place. The UI exposes a **"Usar como referencia"** action on the detail page that opens `/cotizaciones/nueva?from=[id]` with the form prefilled from the source. Saving creates a brand-new cotización with a fresh correlativo; the source row stays untouched.

**Why:** the historical record of what was quoted to a customer must be immutable. If a vendor "fixes a typo" on a quote that was already sent, the customer would receive a different document on the next render and the legal/audit trail is corrupted. Append-only also makes it safe to share a PDF URL — the file behind it never changes.

**How to apply:** there is no `UPDATE` server action for cotizaciones. The schema lacks any edit-specific columns. If we ever need true edits (e.g. correcting an obvious typo before sending), it should be a new "amend" flow that records an `amends_cotizacion_id` link and a `replaced_at` timestamp — see future ADRs.

## Alternatives considered

- **Correlativo via `MAX(numero)+1`.** Race-condition prone. Rejected.
- **Correlativo as the primary key.** Mixing the business-facing number with the internal PK couples them; if we ever need to renumber (very unlikely but real), every FK breaks. Rejected.
- **FK to `productos` with `ON DELETE SET NULL`.** Old quotes would mysteriously lose their lines when products are deleted. Rejected.
- **Storing totals in `cotizaciones`.** Faster reads, but a single bad update can desync the totals from the lines. Rejected; we'd revisit only if a quotes list page becomes slow.
- **Storing the vendedor display name on `cotizaciones` directly.** Renaming a user wouldn't update old quotes. We want renames to flow through (it's a user identity, not a snapshot like price). Profiles join wins.
- **Editable cotizaciones (UPDATE in place).** Discarded — the historical record must be immutable. "Usar como referencia" gives the same ergonomic benefit (prefilled form, fast turnaround) without overwriting history.
