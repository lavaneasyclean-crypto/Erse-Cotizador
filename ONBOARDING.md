# Onboarding — ERSE Cotizaciones

Punto de entrada para continuar el proyecto en otra máquina, o para
poner a un compañero a trabajar en él. Si recién estás llegando al
código, lee este archivo de arriba a abajo. La arquitectura completa
está en el [`README.md`](./README.md) y los ADRs en `docs/ADR/`.

## TL;DR — Lo que hay que saber

- **Cotizador interno** para ERSE Electric SPA. Reemplazó un prototipo
  HTML legacy.
- **Stack**: Next.js 16 (App Router) + TypeScript + Tailwind v4 +
  shadcn/ui + Supabase (Postgres + Auth + RLS) +
  `@react-pdf/renderer`. Tests con Vitest. Reglas en `AGENTS.md`.
- **Repo**: https://github.com/lavaneasyclean-crypto/Erse-Cotizador
- **Supabase**: proyecto `fpvvbitexaspktkinfxv`
- **Deploy objetivo**: Netlify (todavía no conectado)
- **Tests**: 103 pasando, `main` siempre verde (TC + lint + tests).

## Setup en una máquina nueva (5 minutos)

```bash
git clone https://github.com/lavaneasyclean-crypto/Erse-Cotizador.git
cd Erse-Cotizador
npm install
```

Crear `.env.local` con las 3 keys de Supabase (pídelas al admin del
proyecto — no están en el repo a propósito):

```
NEXT_PUBLIC_SUPABASE_URL=https://fpvvbitexaspktkinfxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
```

> ⚠️ La `SERVICE_ROLE_KEY` es muy sensible. Sólo se usa en
> `src/lib/supabase/admin.ts` (con `import 'server-only'`). Nunca la
> compartas ni la subas al repo.

Arrancar:

```bash
npm run dev          # localhost:3000
npm test             # 103 tests
npm run typecheck    # tsc --noEmit
npm run lint
```

Login con la cuenta ERSE que ya existe (ver Supabase Dashboard →
Authentication → Users).

## Estado actual (último commit: `0fea4e4`)

**Features completas:**
- Auth multi-usuario (email + password) + rol admin
- Cotizaciones: crear, listar con filtros, detalle, duplicar
  (`Usar como referencia`), estados (borrador → enviada →
  aprobada/rechazada), PDF descargable con logo
- Clientes CRUD con validación de RUT chileno + soft-delete
- Productos CRUD + soft-delete
- /admin/usuarios (crear, editar, eliminar usuarios)
- Manual de uso PDF descargable (`/manual`)
- Dashboard con KPIs + pipeline + recientes
- Sidebar layout con tema azul ERSE + Roboto

**Auditoría cerrada:** 10 ADRs cubren todas las decisiones.
Tandas 1–4 del audit aplicadas y commiteadas.

## ⚠️ Migraciones SQL pendientes de aplicar

Estas viven en `supabase/migrations/` pero **no se aplican
automáticamente**. Hay que pegarlas en el SQL Editor de Supabase:

https://supabase.com/dashboard/project/fpvvbitexaspktkinfxv/sql/new

Verifica cuáles ya están aplicadas (basta con intentar correrlas; son
idempotentes — `create … if not exists`):

| Archivo | Qué hace | Bloquea |
|---|---|---|
| `0001_cotizaciones.sql` | Crea tablas + RLS inicial | Todo el app |
| `0002_admin_role.sql` | Agrega `is_admin` | `/admin/usuarios` |
| `0003_clientes_rls.sql` | RLS de catálogo a authenticated | Crear/editar clientes/productos |
| `0004_admin_can_update_cotizaciones.sql` | Admin puede cambiar estados | Estado por admins |
| `0005_tighten_catalog_writes.sql` | UPDATE de catálogo a admins | UI lo previene también |
| `0006_catalog_audit.sql` | `updated_at`/`updated_by` en catálogo | Editar cliente/producto crashea sin esto |
| `0007_catalog_soft_delete.sql` | Flag `activo` para archivar | Botón "Archivar" + filtro del picker crashean sin esto |

Si vienes a la app fresh y ves errores tipo "column does not exist",
es probable que falte aplicar 0006 o 0007.

## Deploy a Netlify (pendiente)

1. Conectar el repo en https://app.netlify.com/start
2. Build settings (auto-detectados):
   - Build: `npm run build`
   - Publish: `.next`
3. Site settings → Environment variables → copiar las 3 keys del
   `.env.local`.
4. Push a `main` dispara redeploy automático.

No hay nada de Netlify configurado todavía. El primer push manual
desde el panel de Netlify crea todo.

## Decisiones de arquitectura (ADRs)

Si vas a desafiar alguna decisión, primero lee el ADR que la
documenta:

- **001** Supabase SSR
- **002** Schema cotizaciones + append-only history
- **003** Descuento oculto en PDF
- **004** Rol admin
- **005** Sidebar + branding + logo en PDF
- **006** Validación RUT chileno
- **007** Filtros URL-driven
- **008** RLS de catálogo + sanitización
- **009** Estructura `lib/pdf`
- **010** CSP deferida intencionalmente

## Backlog (audit follow-ups que decidimos no hacer ahora)

- CSP real con nonces (ADR 010 tiene el camino)
- Surface audit columns en UI ("editado por X el Y")
- Email del PDF al cliente (Resend)
- Página de reportes (ranking por vendedor, conversión)
- N+1 en listado de cotizaciones (acceptable hasta ~1000 quotes)
- Tightening de `cotizaciones SELECT` por dueño (decisión de
  negocio actual: equipo chico, todos ven todo)

## Quirks Windows (si trabajas desde Windows)

- En PowerShell, refrescar PATH al inicio:
  ```powershell
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
  ```
- Usar `npm.cmd` / `npx.cmd` (la política de ejecución bloquea los
  shims `.ps1`).
- Git va a quejarse de LF↔CRLF — es ruido, ignora.

## Reglas del proyecto (en serio)

Léelas: [`AGENTS.md`](./AGENTS.md) (symlinked desde `CLAUDE.md`,
`.cursorrules`, etc.).

Resumen:
- TDD estricto (test primero)
- Conventional commits atómicos (`feat:`, `fix:`, `refactor:`…)
- ADRs en `docs/ADR/NNN-name.md` para cada decisión no trivial
- Tokens semánticos (no hardcodear colores)
- `cn()` obligatorio para combinar clases
- Zero dead code

## Contacto del producto

- ERSE Electric SPA · RUT 77.638.085-7
- ventas@erse.cl
- +56 9 4805 4581
