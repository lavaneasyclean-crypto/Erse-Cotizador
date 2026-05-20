# ERSE Cotizaciones

Cotizador interno de **ERSE Electric SPA** — emisión, seguimiento y
exportación a PDF de cotizaciones eléctricas. Reemplaza el prototipo HTML
legacy con una app Next.js + Supabase para uso del equipo de ventas.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind v4** + **shadcn/ui** (preset `base-nova`) + lucide-react
- **Supabase** — Postgres + Auth (email/password) + RLS
- **`@react-pdf/renderer`** para el PDF descargable
- **Vitest** para los tests unitarios
- **devground** (`@devground/devground`) — ESLint 9, Prettier, Husky,
  commitlint, conventional commits
- Deploy: **Netlify**

## Estructura

```
src/
├── app/
│   ├── (app)/                  ← layout autenticado con sidebar
│   │   ├── dashboard/
│   │   ├── cotizaciones/
│   │   │   ├── [id]/           ← detalle + PDF route + estado-selector
│   │   │   ├── nueva/          ← form (acepta ?from= para duplicar)
│   │   │   └── cotizaciones-filters.tsx
│   │   ├── clientes/
│   │   ├── productos/
│   │   ├── perfil/
│   │   └── admin/usuarios/
│   ├── login/                  ← fuera del layout autenticado
│   ├── globals.css             ← tema ERSE blue + Roboto
│   └── proxy.ts                ← Next 16 proxy (ex-middleware) gatea auth
├── components/
│   ├── ui/                     ← shadcn primitives
│   ├── app-sidebar.tsx         ← nav lateral compartida
│   └── cotizaciones/quote-form.tsx
├── lib/
│   ├── auth/                   ← schemas y guards
│   ├── clientes/               ← schemas (incluye validación de RUT)
│   ├── cotizaciones/           ← totals, schemas, estado workflow
│   ├── format/                 ← formatCLP, formatFecha
│   ├── pdf/                    ← componente de PDF
│   ├── productos/              ← schemas
│   ├── rut/                    ← validación + formato de RUT chileno
│   └── supabase/               ← clients browser/server/proxy/admin
docs/ADR/                       ← decisiones de arquitectura
supabase/migrations/            ← SQL migrations (orden por número)
public/ERSE_7.png               ← logo embedido en el PDF
```

## Setup local

Requisitos: **Node ≥ 20**, una cuenta Supabase con el proyecto creado.

```bash
git clone https://github.com/lavaneasyclean-crypto/Erse-Cotizador.git
cd Erse-Cotizador
npm install
```

Crear `.env.local` con las 3 keys del proyecto Supabase (pedírselo a un
admin del proyecto — `.env*` está gitignoreado a propósito):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` es **muy sensible**. Sólo se usa en
> `src/lib/supabase/admin.ts` (importa `server-only`), nunca llega al
> browser.

Aplicar las migraciones (en orden numérico) en el SQL Editor de Supabase
— ver [`supabase/migrations/README.md`](supabase/migrations/README.md).

Arrancar el dev server:

```bash
npm run dev          # localhost:3000
npm test             # Vitest, 93 tests
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

## Deploy a Netlify

1. Conectar el repo de GitHub en https://app.netlify.com/start
2. Build settings (auto-detectados):
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Environment variables** (Site settings → Environment variables) —
   copiar tal cual desde `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Push a `main` dispara un nuevo deploy automáticamente.

Las migraciones de Supabase se aplican **manualmente** en el SQL Editor
de Supabase — no las corre Netlify.

## Decisiones de diseño (ADRs)

Cada decisión arquitectural no-trivial está documentada como ADR en
`docs/ADR/`:

| # | Decisión |
|---|---|
| [001](docs/ADR/001-supabase-ssr.md) | Usar `@supabase/ssr` para auth + data en App Router |
| [002](docs/ADR/002-cotizaciones-schema.md) | Schema de cotizaciones, correlativo via SEQUENCE, snapshot de precio, append-only history |
| [003](docs/ADR/003-discount-visibility.md) | Descuento oculto en el PDF, visible en la plataforma |
| [004](docs/ADR/004-admin-role.md) | Rol admin via `profiles.is_admin` + service-role client aislado |
| [005](docs/ADR/005-app-shell-and-branding.md) | Route group `(app)`, sidebar layout, tema ERSE blue, Roboto, logo en PDF |
| [006](docs/ADR/006-rut-validation.md) | Validación de RUT chileno (módulo-11) y normalización pre-DB |
| [007](docs/ADR/007-url-driven-filters.md) | Filtros del listado en URL search params |

## Reglas del proyecto

Las reglas obligatorias para humanos y agentes IA están en
[`AGENTS.md`](AGENTS.md) (símlinked en `CLAUDE.md`, `.cursorrules`,
`.github/copilot-instructions.md`, `.gemini/styleguide.md`):

- **TDD estricto**: test primero, código después.
- **Conventional commits**: `feat:`, `fix:`, `refactor:`, etc.
- **ADRs** para cualquier decisión de arquitectura.
- **READMEs** en carpetas con lógica no-obvia.
- **Zero dead code**, tokens semánticos, helper `cn()` obligatorio.

## Soporte

- Issues: https://github.com/lavaneasyclean-crypto/Erse-Cotizador/issues
- Empresa: ERSE Electric SPA · RUT 77.638.085-7 · ventas@erse.cl
