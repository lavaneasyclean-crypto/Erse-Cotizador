# ADR 005 — App shell, branding, and PDF logo

## Context

The app started as a simple Next.js scaffold with a top nav and the default
Geist Sans font. As the surface grew (cotizaciones, clientes, productos,
admin, dashboard), the top nav became cramped and the lack of brand
identity (Geist + neutral greys) made the tool feel generic. We also needed
the ERSE corporate logo on the customer-facing PDF.

## Decision

### Route group + shared layout

All authenticated pages live under `src/app/(app)/`. The parentheses make
it a Next.js route group — invisible in the URL, but it lets us share a
single layout (`(app)/layout.tsx`) that:

1. Runs the auth check once via `createClient().auth.getUser()`.
2. Fetches the user's profile (`nombre_completo`, `is_admin`).
3. Renders `<AppSidebar>` + a `bg-muted/30` main content panel.

Public routes (`/login`, `/auth/callback`) stay outside the group at
`src/app/` and don't render the sidebar.

### Left sidebar instead of a top nav

`src/components/app-sidebar.tsx` is a Client Component that:

- Shows the ERSE logo + brand name at the top.
- Renders the four primary links (Dashboard, Cotizaciones, Clientes,
  Productos), each with a `lucide-react` icon and an active-state pill in
  the ERSE blue token.
- Shows an **Administración** section with the Usuarios link only when
  `profile.is_admin === true`.
- Pins the user's display name + Mi perfil + Cerrar sesión to the bottom.
- On `<lg` viewports it collapses into an off-canvas drawer triggered from
  a top bar with a hamburger.

Active state uses `--sidebar-primary` so it inherits brand color
automatically when the theme palette changes.

### Branding tokens

`globals.css` defines the palette with `oklch()` values; the primary token
is set to ERSE corporate blue (approximately Tailwind blue-700,
`oklch(0.48 0.21 264)`). Every primary button, focus ring, sidebar active
state, link colour, and chart-1 colour reads from `--primary`, so future
re-skins only touch this file.

The accent and ring tokens are tinted blues (lighter hues with same hue
264°) for cohesion. Status colours (slate/sky/emerald/rose) stay outside
this palette so estado badges remain instantly recognisable.

### Roboto via `next/font`

`src/app/layout.tsx` loads Google Roboto (weights 400/500/700) and Roboto
Mono via `next/font/google` with `display: 'swap'`. The CSS variables
`--font-sans` and `--font-geist-mono` (kept name for backwards compat in
globals.css' `@theme` block) are populated by these font loaders. No
external CSS imports, no FOUT.

### ERSE logo in the PDF (filesystem + module cache)

`public/ERSE_7.png` is committed to git so the logo travels with every
clone and every deploy. The PDF route handler
(`src/app/(app)/cotizaciones/[id]/pdf/route.tsx`) reads the file with
`node:fs/promises.readFile` once per process, caches the `Buffer` in
module scope, and passes it to `<CotizacionPdf data={{ ...data, logo }} />`.

The PDF component renders `<Image src={logo}>` from `@react-pdf/renderer`
at 80×40 pt in the header. If the file is missing the component falls
back to the text brand `ERSE ELECTRIC SPA` so the PDF still renders.

Multiple filenames are tried (`logo-erse.png`, `ERSE_7.png`,
`erse-logo.png`, `logo.png`) so contributors can drop their preferred
name without touching code.

## Consequences

- Auth check happens **once per request** in the layout instead of once
  per page. The `proxy.ts` middleware still gates the route at the edge
  for the redirect; the layout is the source of truth for "is this user
  an admin?".
- Re-skinning to a different brand is a one-file change (`globals.css`).
- The sidebar is a Client Component (it needs `usePathname` for active
  state and `useState` for the mobile drawer). The expensive data
  loading happens in the Server-Component layout and is passed in as
  props.
- The PDF logo strategy adds zero deploy complexity — the file ships
  with the codebase. The trade-off is that updating the logo requires a
  commit + redeploy; Supabase Storage would let an admin swap it from
  the UI, but a corporate logo changes once a year at most.
- Module-scope cache means the first PDF after a cold start reads the
  disk; everything after is in-memory.

## Alternatives considered

- **Keep the top nav.** Works at four primary links but doesn't scale to
  the admin section without nesting. The sidebar also fits the dashboard
  aesthetic the user explicitly requested (Shopeers-style).
- **Sticky top nav + sidebar combo.** Common in B2B, but for this team
  size it adds chrome without value.
- **Per-page auth check.** What we had before. Drier but every page
  duplicates `getUser()` + profile fetch. Centralising in the layout is
  cheaper and harder to forget.
- **Logo as React-native SVG inside the PDF.** `@react-pdf/renderer`
  supports embedded SVG, but our logo file is a PNG and converting on
  every render would burn CPU.
- **Logo in Supabase Storage.** Editable from a future settings page,
  but adds a network round trip per PDF and an extra IAM surface. Park
  for if/when the brand changes mid-year is a real concern.
