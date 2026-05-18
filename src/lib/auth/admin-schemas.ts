import { z } from 'zod';

// HTML checkboxes submit `"on"` when checked and nothing at all when not,
// so accept either a boolean (from JSON callers) or `"on"`/undefined (from
// a native form submission).
const checkbox = z
  .union([z.boolean(), z.literal('on'), z.literal(''), z.undefined(), z.null()])
  .transform((v) => v === true || v === 'on')
  .optional()
  .default(false);

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  nombre_completo: z
    .string()
    .trim()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(80, { message: 'Máximo 80 caracteres' }),
  is_admin: checkbox,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Optional password: empty string means "do not change". When provided it must
// still meet the 8-char minimum.
const optionalPassword = z
  .union([z.string(), z.undefined()])
  .transform((v) => (typeof v === 'string' && v.length > 0 ? v : undefined))
  .pipe(
    z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
      .optional(),
  );

export const updateUserSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(80, { message: 'Máximo 80 caracteres' }),
  is_admin: checkbox,
  password: optionalPassword,
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
