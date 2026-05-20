import { z } from 'zod';

// Optional free-text field: trims, then converts empty string to null so the
// DB stores SQL NULL instead of an empty string. `nullish()` makes the key
// itself optional in the object — missing/null/undefined all map to null.
const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    if (v == null) return null;
    const trimmed = v.trim();
    return trimmed === '' ? null : trimmed;
  });

// Optional email: empty string → null; non-empty must validate.
const optionalEmail = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    if (v == null) return null;
    const trimmed = v.trim();
    if (trimmed === '') return null;
    const parsed = z.string().email().safeParse(trimmed);
    if (!parsed.success) {
      ctx.addIssue({ code: 'custom', message: 'Email inválido' });
      return z.NEVER;
    }
    return parsed.data;
  });

export const createClienteSchema = z.object({
  rut: z.string().trim().min(1, { message: 'El RUT es obligatorio' }),
  razon_social: z
    .string()
    .trim()
    .min(1, { message: 'La razón social es obligatoria' }),
  persona: optionalText,
  direccion_despacho: optionalText,
  condicion_de_pago: optionalText,
  ciudad: optionalText,
  contacto: optionalText,
  email: optionalEmail,
  giro: optionalText,
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;

// Same shape as create but the RUT (primary key) is omitted — it's immutable
// because cotizaciones FK references it.
export const updateClienteSchema = createClienteSchema.omit({ rut: true });

export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
