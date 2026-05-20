import { z } from 'zod';

const numberLike = z.union([z.number(), z.string()]).transform((v, ctx) => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) {
    ctx.addIssue({ code: 'custom', message: 'Debe ser un número' });
    return z.NEVER;
  }
  return n;
});

// Length caps prevent a malicious payload from filling up the DB and breaking
// the PDF renderer, which loads everything in memory. The DB types are TEXT
// (no implicit limit) so this is the only line of defence.
const itemSchema = z.object({
  codigo_sku: z.string().min(1, 'Código requerido').max(80, 'Código demasiado largo'),
  descripcion: z
    .string()
    .min(1, 'Descripción requerida')
    .max(500, 'Descripción demasiado larga'),
  precio_unitario: numberLike.refine((n) => n >= 0, {
    message: 'El precio no puede ser negativo',
  }),
  cantidad: numberLike.refine((n) => n > 0, { message: 'La cantidad debe ser mayor a 0' }),
  descuento_porcentaje: numberLike
    .refine((n) => n >= 0 && n <= 100, { message: 'El descuento debe estar entre 0 y 100' })
    .optional()
    .default(0),
});

export const createCotizacionSchema = z.object({
  cliente_rut: z.string().trim().min(1, 'Selecciona un cliente').max(20, 'RUT demasiado largo'),
  vencimiento: z
    .string()
    .trim()
    .max(120, 'Vencimiento demasiado largo')
    .optional()
    .default('2 días hábiles'),
  condicion_pago: z
    .string()
    .trim()
    .max(80, 'Condición de pago demasiado larga')
    .optional()
    .default(''),
  notas: z.string().trim().max(2000, 'Notas demasiado largas').optional().default(''),
  // Hard cap on number of items so a 10.000-row payload can't OOM the PDF
  // renderer. Real quotes have a handful of lines.
  items: z
    .array(itemSchema)
    .min(1, 'Agrega al menos un item')
    .max(200, 'Demasiados items en una sola cotización'),
});

export type CreateCotizacionInput = z.input<typeof createCotizacionSchema>;
export type CreateCotizacionParsed = z.output<typeof createCotizacionSchema>;
