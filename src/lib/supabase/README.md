# Supabase clients

Three entry points for talking to Supabase, all typed against `types.ts`.

| File | Where you use it | What it does |
|------|------------------|--------------|
| `client.ts` | Client Components, `'use client'` hooks | Browser client via `createBrowserClient` from `@supabase/ssr`. Reads the anon key from `NEXT_PUBLIC_*` env vars. |
| `server.ts` | Server Components, Route Handlers, Server Actions | Server client that reads/writes the auth cookie through Next's `cookies()`. The `setAll` swallows errors thrown from RSCs because Next disallows cookie mutation there — the middleware does the actual refresh. |
| `proxy.ts` | Imported by `src/proxy.ts` | Refreshes the Supabase session cookie on every request. Do not insert logic between `createServerClient` and `getUser()` — race conditions cause random logouts. Renamed from `middleware.ts` because Next.js 16 deprecated that convention in favour of `proxy.ts`. |

`types.ts` is hand-written for now (covers `clientes` and `productos`). Regenerate once the schema stabilises:

```
supabase gen types typescript --project-id fpvvbitexaspktkinfxv > src/lib/supabase/types.ts
```

ADR: see `docs/ADR/001-supabase-ssr.md`.
