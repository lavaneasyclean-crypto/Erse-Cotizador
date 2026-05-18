import { z } from 'zod';

const numberLike = z.union([z.number(), z.string()]).transform((v, ctx) => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) {
    ctx.addIssue({ code: 'custom', message: 'Debe ser un número' });
    return z.NEVER;
  }
  return n;
});

const itemSchema = z.object({
  codigo_sku: z.string().min(1, 'Código requerido'),
  descripcion: z.string().min(1, 'Descripción requerida'),
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
  cliente_rut: z.string().trim().min(1, 'Selecciona un cliente'),
  vencimiento: z.string().trim().optional().default('2 días hábiles'),
  condicion_pago: z.string().trim().optional().default(''),
  notas: z.string().trim().optional().default(''),
  items: z.array(itemSchema).min(1, 'Agrega al menos un item'),
});

export type CreateCotizacionInput = z.input<typeof createCotizacionSchema>;
export type CreateCotizacionParsed = z.output<typeof createCotizacionSchema>;
