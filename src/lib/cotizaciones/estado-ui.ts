import type { EstadoCotizacion } from '@/lib/supabase/types';

/**
 * UI mapping for cotización states. Kept separate from `estado-schema.ts` so
 * the schema stays a pure-logic module (no Tailwind classes leaking into
 * server-side validation), while the badge / pill UIs across the app share a
 * single source of truth for labels and colours.
 *
 * Adding a new state? Update both `ESTADOS` in `estado-schema.ts` AND these
 * two maps. TypeScript will fail to compile any consumer that destructures a
 * missing key.
 */

export const ESTADO_LABEL: Record<EstadoCotizacion, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

// Status colours include explicit dark: variants per AGENTS.md §9.
export const ESTADO_CLASSES: Record<EstadoCotizacion, string> = {
  borrador:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
  enviada:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300',
  aprobada:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  rechazada:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
};

/**
 * Background colour for the inline progress bars on the dashboard pipeline.
 * Solid variants of the badge palette.
 */
export const ESTADO_BAR_CLASS: Record<EstadoCotizacion, string> = {
  borrador: 'bg-slate-400',
  enviada: 'bg-sky-500',
  aprobada: 'bg-emerald-500',
  rechazada: 'bg-rose-500',
};
