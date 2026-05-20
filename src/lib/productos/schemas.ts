import { z } from 'zod';

// Accept number or numeric string (from FormData), coerce, round to CLP.
const precio = z
  .union([z.number(), z.string()])
  .transform((v, ctx) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: 'custom', message: 'Precio debe ser un número' });
      return z.NEVER;
    }
    if (n < 0) {
      ctx.addIssue({ code: 'custom', message: 'El precio no puede ser negativo' });
      return z.NEVER;
    }
    return Math.round(n);
  });

export const createProductoSchema = z.object({
  codigo_sku: z.string().trim().min(1, { message: 'El código SKU es obligatorio' }),
  descripcion: z.string().trim().min(1, { message: 'La descripción es obligatoria' }),
  precio_neto: precio,
});

export type CreateProductoInput = z.infer<typeof createProductoSchema>;

// On update the SKU (primary key) is immutable.
export const updateProductoSchema = createProductoSchema.omit({ codigo_sku: true });

export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;
