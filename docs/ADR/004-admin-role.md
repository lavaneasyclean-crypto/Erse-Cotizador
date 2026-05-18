# ADR 004 — Admin role for user management

## Context

ERSE Cotizaciones is a multi-user internal tool. Each vendor needs an account, but the team is small and trusted, so:

- Signup is **not** public (a `/signup` page would expose the tool to anyone with the URL).
- Users must be created by a person who is responsible for who has access.
- That person needs to do it from the app, not from the Supabase dashboard (which is a separate access surface, easy to misconfigure, and noisy with auth.users columns the team doesn't care about).

We also need a way to mark "this person can create others" without rebuilding the whole RLS surface around roles.

## Decision

Introduce a boolean **`profiles.is_admin`** (migration 0002). Default `false`. Admins gain access to `/admin/usuarios` where they can:

- See every auth user (email, nombre_completo, role, created_at).
- Create a new user with email + nombre_completo + a temporary password they share with the new user out-of-band.
- Mark the new user as admin at creation time.
- Delete a user (except themselves — self-deletion is guarded in the action).

### Server-side admin client

User creation requires Supabase's `auth.admin.createUser`, which only the service-role key can call. We add **`SUPABASE_SERVICE_ROLE_KEY`** to `.env.local` and expose it through `src/lib/supabase/admin.ts` — a module that imports `server-only` so any accidental import from a Client Component fails the build. The key is never sent to the browser and never embedded in `NEXT_PUBLIC_*`.

### Gating

`/admin/*` pages call `requireAdmin()` (`src/lib/auth/require-admin.ts`), a server-only helper that:

1. Reads the user via the regular cookie-bound server client.
2. Looks up `profiles.is_admin` for that user.
3. If not admin, redirects to `/dashboard` (not 404). Bouncing instead of 404-ing avoids leaking that admin pages exist.

The proxy layer (`src/proxy.ts`) is unchanged — it still only checks authentication. We deliberately keep the admin check in the page so the request hits Next.js routing once and only pays the extra DB query on admin paths.

### Why a column on `profiles` instead of `auth.users.app_metadata`

Both work. We picked the column because:

- It joins cleanly with everything else we already query on `profiles`.
- A single query gives us name + role for the dashboard header.
- It's editable through SQL during early development without needing the auth admin API.

`is_admin` cannot be self-elevated: the "profiles update own" RLS policy allows updates where `id = auth.uid()`, and that policy is unchanged. To prevent a user from editing their own row to flip the flag, we don't expose `is_admin` from `/perfil` — and even if someone called the REST endpoint directly, the column update would succeed only because RLS doesn't currently filter columns. **TODO** for a future hardening: add a row-level rule that blocks updating `is_admin` from the user context. For now, the threat model assumes vendors won't try to bypass the UI.

## Consequences

- Bootstrapping: migration 0002 seeds the first admin (`ventas@erse.cl`) directly via SQL. After that, admins beget admins through the UI.
- The service-role key is the most powerful secret in the project. We restrict it to a single module (`src/lib/supabase/admin.ts`) with `import 'server-only'` so misuse is loud and immediate.
- Deletion is hard (Supabase `auth.admin.deleteUser`). Any cotizaciones belonging to the deleted vendor will have a dangling `vendedor_id`. We accept that for now; if it bites, a future change converts deletion into a "deactivated_at" soft-delete that preserves history.

## Alternatives considered

- **Public `/signup` page.** Exposes the tool to the internet. Rejected.
- **Magic-link invitations.** Cleaner onboarding (the new user sets their own password), but requires configuring Supabase SMTP (or paying for it on the hosted plan). Park as a future upgrade.
- **`auth.users.app_metadata.role = 'admin'`.** Equally valid. Picked the profiles column because it co-locates with `nombre_completo` and is one query for everything we need.
- **Multiple roles (admin / vendor / readonly).** Premature — there are two real personas right now. Add when a third actually appears.
