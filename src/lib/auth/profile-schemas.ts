import { z } from 'zod';

export const updateProfileSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(80, { message: 'Máximo 80 caracteres' }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
