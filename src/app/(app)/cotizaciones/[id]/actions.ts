'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { updateEstadoSchema } from '@/lib/cotizaciones/estado-schema';

export type UpdateEstadoResult = { error?: string; success?: string };

export async function updateEstadoAction(
  _previousState: UpdateEstadoResult,
  formData: FormData,
): Promise<UpdateEstadoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada.' };

  const parsed = updateEstadoSchema.safeParse({
    cotizacion_id: formData.get('cotizacion_id'),
    estado: formData.get('estado'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  // RLS enforces "vendedor_id = auth.uid() OR caller is admin" — see
  // migration 0004. If the update touches zero rows we surface a friendly
  // error instead of letting the UI look stuck.
  const { error, count } = await supabase
    .from('cotizaciones')
    .update({ estado: parsed.data.estado }, { count: 'exact' })
    .eq('id', parsed.data.cotizacion_id);

  if (error) return { error: error.message };
  if (count === 0) {
    return {
      error:
        'No se actualizó la cotización. Sólo el vendedor que la creó o un administrador pueden cambiar el estado.',
    };
  }

  revalidatePath(`/cotizaciones/${parsed.data.cotizacion_id}`);
  revalidatePath('/cotizaciones');
  revalidatePath('/dashboard');
  return { success: `Estado cambiado a ${parsed.data.estado}.` };
}
