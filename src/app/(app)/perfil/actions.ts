'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { updateProfileSchema } from '@/lib/auth/profile-schemas';

export type UpdateProfileResult = { error?: string; success?: boolean };

export async function updateProfileAction(
  _previousState: UpdateProfileResult,
  formData: FormData,
): Promise<UpdateProfileResult> {
  const parsed = updateProfileSchema.safeParse({
    nombre_completo: formData.get('nombre_completo'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Inicia sesión nuevamente.' };

  const { error } = await supabase
    .from('profiles')
    .update({ nombre_completo: parsed.data.nombre_completo })
    .eq('id', user.id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  // Refresh the dashboard greeting and any quote views that show the vendedor.
  revalidatePath('/dashboard');
  revalidatePath('/cotizaciones');
  revalidatePath('/perfil');

  return { success: true };
}
