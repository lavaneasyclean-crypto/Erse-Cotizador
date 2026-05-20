# ADR 007 — URL-driven filters in /cotizaciones

## Context

The cotizaciones listing started with no filters — every page load
returned the full table. Once we added the estado workflow (borrador →
enviada → aprobada/rechazada) and the team accumulated >20 quotes, the
need for filtering by estado, date range, and free-text became obvious.

There were two ways to wire the filters:

1. **Client-side state** inside a Client Component that fetches once
   and filters in memory.
2. **URL search params** read by the Server Component, which re-runs the
   Supabase query whenever the URL changes.

## Decision

We chose option 2 — **filters live in the URL** (`?estado=enviada,aprobada&desde=2026-01-01&q=ABM`).

`CotizacionesFilters` is a Client Component that:

- Reads the current URL with `useSearchParams()`.
- Renders the control surface (search input with 300 ms debounce, two
  date inputs, four estado pills).
- Pushes new URLs via `router.replace(`?${next}`, { scroll: false })`
  so each interaction updates the URL without scrolling or polluting
  browser history.

The Server Component (`(app)/cotizaciones/page.tsx`) parses the same
params and builds the Supabase query:

```ts
let query = supabase.from('cotizaciones')
  .select('..., clientes!inner(razon_social), ...')
  .order('numero', { ascending: false });

if (selectedEstados.length > 0) query = query.in('estado', selectedEstados);
if (desde) query = query.gte('fecha', desde);
if (hasta) query = query.lte('fecha', hasta);
if (q) {
  if (/^\d+$/.test(q)) query = query.eq('numero', Number(q));
  else query = query.ilike('clientes.razon_social', `%${q}%`);
}
```

`clientes!inner(razon_social)` switches the embedded resource to an
INNER JOIN, which is what PostgREST needs to filter parent rows by a
related field.

The free-text input has dual semantics: pure digits → exact match on
the correlative number; anything else → ILIKE on the cliente's razón
social. This covers the two ways vendors actually look up a quote.

## Consequences

- **Bookmarkable filters**: a vendor can save
  `/cotizaciones?estado=enviada` and land directly on "everything I
  need to follow up".
- **Shareable**: `/cotizaciones?cliente=ABM&estado=aprobada` survives
  copy-paste and onboarding ("look at all your ABM closed deals").
- **Back/forward** in the browser does the expected thing.
- **Server-side filtering** keeps the response small as the table grows
  — we're not shipping every quote to the browser just to hide most of
  them.
- The 300 ms search debounce avoids one URL push per keystroke; date
  pickers and pills push immediately because they're discrete choices.

## Alternatives considered

- **Client-side filter only.** Fast for the first few hundred rows but
  doesn't scale and loses bookmark/shareable URLs. Rejected.
- **A `view_cotizaciones_filtered` Postgres view.** Cleaner from the
  query-builder side but harder to evolve (every new filter is a
  migration). Rejected; the inline query is short and explicit.
- **Server actions for each filter change.** Heavier than needed —
  `router.replace` already triggers a Server Component re-render, and
  using actions would add an unnecessary POST round-trip.
- **`.or()` for the free-text search to match both numero and razón
  social at once.** PostgREST's `.or()` over embedded resources is
  awkward and brittle. Splitting on `/^\d+$/` is simple, fast, and
  exact for the digit case.
