# ADR 001 — Use `@supabase/ssr` for auth and data access in the App Router

## Context

The app uses Next.js 16 (App Router) and Supabase for both database and auth. Multiple users with email + password log in to create quotations; the logged-in user determines the `vendedor` field on each quote, so the server must always know who the caller is.

App Router mixes three execution contexts that need a Supabase client:

- **Server Components** that render under a user's session.
- **Client Components** that subscribe to realtime updates or fire mutations.
- **Proxy** (`src/proxy.ts`, the Next.js 16 replacement for `middleware.ts`) that runs before every request and refreshes the session cookie.

Each context has different cookie semantics, and `@supabase/supabase-js` alone does not bridge them in App Router.

## Decision

Adopt **`@supabase/ssr`** and wire three clients:

- `src/lib/supabase/client.ts` — browser client used in `'use client'` code.
- `src/lib/supabase/server.ts` — server client used in RSCs, Route Handlers, and Server Actions.
- `src/lib/supabase/proxy.ts` — proxy helper called from `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`).

Run `await supabase.auth.getUser()` in the proxy on every request to force a session refresh. Server Components read the user with the same call but never mutate cookies (Next throws if you do); the proxy writes the refreshed cookie back.

## Consequences

- A consistent typed `Database` is imported from `src/lib/supabase/types.ts` by all three clients.
- The proxy matcher excludes static assets to avoid running the auth check on every image.
- Cookie mutation errors inside the server client's `setAll` are deliberately swallowed — they only fire from RSCs and the proxy already refreshed the cookie, so silencing them is safe and documented.
- The browser anon key is exposed under `NEXT_PUBLIC_*`. This is expected for the anon role; RLS policies must enforce per-user access on every table.

## Alternatives considered

- **`@supabase/supabase-js` only.** Works for client-side reads, but has no first-class App Router cookie handling. Would force a hand-rolled session refresh in the proxy. Rejected.
- **`@supabase/auth-helpers-nextjs`** (the predecessor of `@supabase/ssr`). Deprecated by Supabase in favour of `ssr`. Rejected.
- **NextAuth + Supabase as data only.** Adds a second auth surface and an extra DB join to map sessions to Supabase RLS. Heavier than needed for a single-tenant internal tool. Rejected.
