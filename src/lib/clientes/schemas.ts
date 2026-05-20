import { z } from 'zod';

import { isValidRut, normalizeRut } from '@/lib/rut/rut';

// Chilean RUT — validated against the modulo-11 check-digit algorithm and
// normalised before storage (no dots, dash kept, uppercase K).
const rut = z
  .string()
  .trim()
  .min(1, { message: 'El RUT es obligatorio' })
  .max(20, { message: 'RUT demasiado largo' })
  .refine((value) => isValidRut(value), {
    message: 'RUT inválido (verifica el dígito verificador)',
  })
  .transform((value) => normalizeRut(value));

// Optional free-text field: trims, converts empty string to null so the DB
// stores SQL NULL instead of an empty string, and caps the length so a
// malicious or accidental megabyte string can't reach the database.
function optionalText(max: number) {
  return z
    .string()
    .max(max, { message: `Máximo ${max} caracteres` })
    .nullish()
    .transform((v) => {
      if (v == null) return null;
      const trimmed = v.trim();
      return trimmed === '' ? null : trimmed;
    });
}

// Optional email: empty string → null; non-empty must validate.
const optionalEmail = z
  .string()
  .max(160, { message: 'Email demasiado largo' })
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
  rut,
  razon_social: z
    .string()
    .trim()
    .min(1, { message: 'La razón social es obligatoria' })
    .max(200, { message: 'Máximo 200 caracteres' }),
  persona: optionalText(120),
  direccion_despacho: optionalText(300),
  condicion_de_pago: optionalText(80),
  ciudad: optionalText(80),
  contacto: optionalText(80),
  email: optionalEmail,
  giro: optionalText(200),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;

// Same shape as create but the RUT (primary key) is omitted — it's immutable
// because cotizaciones FK references it.
export const updateClienteSchema = createClienteSchema.omit({ rut: true });

export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
