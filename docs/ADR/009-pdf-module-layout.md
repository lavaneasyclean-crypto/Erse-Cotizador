# ADR 009 — `lib/pdf` module layout

## Context

The app generates two PDF documents at runtime: the customer-facing
cotización PDF and the internal user manual. They share concerns
(loading the ERSE logo, building a safe `Content-Disposition` header,
using `@react-pdf/renderer`) but have very different content. As the
codebase grew, the PDF logic ended up split between `src/lib/pdf/`
(rendering components) and the route handlers under
`src/app/(app)/.../route.tsx` (orchestration + IO).

After the audit we extracted `loadLogo` into a shared module; this
ADR documents the resulting layout so the next person (or agent) who
adds a third PDF (proforma? credit note?) doesn't reinvent it.

## Decision

```
src/lib/pdf/
├── cotizacion-pdf.tsx   ← React-PDF document for /cotizaciones/[id]/pdf
├── manual.tsx           ← React-PDF document for /manual
├── load-logo.ts         ← server-only Buffer cache for public/ERSE_7.png
├── filename.ts          ← contentDispositionInline(rawName) → safe header
└── filename.test.ts     ← invariants against header-injection payloads

src/app/(app)/
├── cotizaciones/[id]/pdf/route.tsx   ← Supabase query + renderToBuffer
└── manual/route.tsx                  ← static content + renderToBuffer
```

### Rules of thumb

- **Route handlers do IO**, including the Supabase fetch, the logo
  read (`await loadLogo()`), and the PDF render. They never declare
  React components.
- **`lib/pdf/*.tsx` exports pure React-PDF components.** They accept
  a fully-shaped `Data` prop and render — no DB calls, no env vars,
  no `fs`. This keeps them trivially testable and reusable.
- **`load-logo.ts`** is the only place that reads the filesystem. It
  imports `server-only` so any accidental Client Component import
  fails at build time, and uses React's `cache()` to dedupe within
  a single request.
- **`filename.ts`** wraps user-controlled strings before they touch
  the `Content-Disposition` header. Both routes go through it.
- **Helvetica only.** `@react-pdf/renderer` ships Helvetica out of
  the box; custom fonts require an extra registration step we don't
  need today. If we ever want a brand font, register it once inside
  `lib/pdf/fonts.ts` and import from there.

### Adding a third PDF

1. New `lib/pdf/<name>.tsx` exporting a `<NamePdf data={…} />`.
2. New `src/app/(app)/<path>/route.tsx` that:
   - Verifies auth (and admin if applicable).
   - Pulls the data from Supabase.
   - Calls `loadLogo()` if branding is needed.
   - `renderToBuffer(<NamePdf data={…} />)` and returns it with
     `contentDispositionInline(…)`.

## Consequences

- Adding a PDF is roughly 50 lines of code per file — small enough
  that copying the pattern is cheap.
- The Buffer cache survives the lifetime of the Node process. In a
  serverless environment (Netlify Functions) this means roughly per
  cold start; that is fine because the logo file is small.
- No headless browser, no Puppeteer, no Chromium download in the
  deploy. `@react-pdf/renderer` works in pure Node.

## Alternatives considered

- **Render PDFs from a print stylesheet via Puppeteer.** Cleanest
  visual fidelity (CSS = the print) but balloons the deploy size and
  cold-start time. Rejected; React-PDF is fine for the layouts we
  need.
- **Bundle all PDF logic under `app/(app)/.../route.tsx`.** Keeps
  related code close, but duplicates `loadLogo`, font setup, and the
  styles between routes. Rejected; the `lib/` split is worth a
  one-extra-file import.
- **Move `route.tsx` into `lib/`.** Next.js doesn't allow it — route
  handlers must live under `app/`. The current split honours that.
