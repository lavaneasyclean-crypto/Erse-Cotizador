# ADR 010 — Content-Security-Policy deliberately deferred

## Context

The security audit ([Tanda 1](./008-catalog-write-restrictions-and-input-hardening.md))
recommended adding a Content-Security-Policy header alongside the other
security headers (`Strict-Transport-Security`, `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
A strict CSP is one of the strongest defences against XSS, and is
trivial to add **when** the framework cooperates.

Next.js App Router does not cooperate easily:

- React Server Components stream inline `<script>` tags during
  hydration. A CSP that blocks `'unsafe-inline'` breaks the app.
- Allowing `'unsafe-inline'` defeats the purpose — XSS becomes free
  again.
- The recommended pattern is **per-request nonces**: generate a
  random nonce in middleware (now `proxy.ts` in Next 16), inject it
  into every inline script through Next's
  `Document`/`<Script nonce>`/`<style nonce>` integration, and add
  `script-src 'nonce-<value>'` to the CSP. This requires custom
  request rewriting, careful Turbopack interaction, and Edge runtime
  considerations.
- Third-party assets (the React-PDF renderer fonts at runtime,
  potential future Sentry/analytics) each need explicit allow-list
  entries. Misconfiguring any one of them crashes a feature.

## Decision

Ship without a CSP for v1. Document the choice here so it doesn't
slip into "we forgot". Tracked as a follow-up.

The other five security headers (HSTS, X-Content-Type-Options,
X-Frame-Options, Referrer-Policy, Permissions-Policy) ARE in place
via `next.config.ts` and meaningfully reduce the attack surface
without needing nonces.

## When we'll come back

Add a real CSP when any of these become true:

1. **The app moves from internal team use to broader exposure**
   (customer self-service, partner access, etc.). Internal-only with
   trusted user accounts is a different threat model.
2. **A dependency adds a known XSS sink we can't audit ourselves.**
3. **A compliance requirement (PCI, SOC 2, etc.) calls for it.**

## How we'll implement it when we do

Path of least resistance:

1. Add nonce generation in `src/proxy.ts` — read or generate a
   `nonce` value per request and forward it via a request header
   that the layout reads.
2. Read the header in `src/app/layout.tsx` via `headers()` and pass
   it down to any inline `<script>`/`<Script strategy="afterInteractive">`
   element we own.
3. Configure `next.config.ts` to emit a CSP with
   `script-src 'self' 'nonce-…'; style-src 'self' 'unsafe-inline';
   img-src 'self' data: blob:; …`.
4. Walk the app in `report-only` mode for a sprint, collect
   violations from real users, then enforce.

Estimated cost: 4–8 hours of careful work plus a week of
`Content-Security-Policy-Report-Only` observation. Worth it for
external exposure; overkill for the current internal-team scope.

## Consequences

- Browsers without HSTS preload will still respect the HSTS header
  on second visit; CSP would have stopped XSS on first visit too.
  We accept the gap for now.
- The audit finding remains "Low" severity until external exposure
  arrives.

## Alternatives considered

- **`unsafe-inline` everywhere.** A meaningless CSP. Worse than no
  CSP because it gives false confidence. Rejected.
- **Strict CSP with nonces shipped now.** Right answer eventually,
  too much yak-shaving for the current scope. Deferred, not
  rejected.
- **A static CSP that only allows `'self'` for scripts.** Breaks
  Next's hydration. Rejected.
