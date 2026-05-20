import { z } from 'zod';

import type { EstadoCotizacion } from '@/lib/supabase/types';

/**
 * Workflow order: borrador (draft, default) → enviada (sent to customer) →
 * aprobada / rechazada (customer decision). Exposed as a tuple so the UI can
 * render the dropdown in this exact order without redefining it.
 */
export const ESTADOS = ['borrador', 'enviada', 'aprobada', 'rechazada'] as const;

// Compile-time guard: keep ESTADOS in sync with the EstadoCotizacion union.
const _typeCheck: readonly EstadoCotizacion[] = ESTADOS;
void _typeCheck;

export const updateEstadoSchema = z.object({
  cotizacion_id: z.string().uuid({ message: 'ID inválido' }),
  estado: z.enum(ESTADOS),
});

export type UpdateEstadoInput = z.infer<typeof updateEstadoSchema>;
