'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { createCotizacionSchema } from '@/lib/cotizaciones/schemas';

export type CreateCotizacionResult = { error: string } | undefined;

export async function createCotizacionAction(
  _previousState: CreateCotizacionResult,
  formData: FormData,
): Promise<CreateCotizacionResult> {
  const rawItems = formData.get('items');
  const parsed = createCotizacionSchema.safeParse({
    cliente_rut: formData.get('cliente_rut'),
    vencimiento: formData.get('vencimiento') ?? undefined,
    condicion_pago: formData.get('condicion_pago') ?? undefined,
    notas: formData.get('notas') ?? undefined,
    items: typeof rawItems === 'string' ? JSON.parse(rawItems) : [],
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Inicia sesión nuevamente.' };

  const { data: header, error: headerError } = await supabase
    .from('cotizaciones')
    .insert({
      cliente_rut: parsed.data.cliente_rut,
      vendedor_id: user.id,
      vencimiento: parsed.data.vencimiento || '2 días hábiles',
      condicion_pago: parsed.data.condicion_pago || null,
      notas: parsed.data.notas || null,
    })
    .select('id')
    .single();

  if (headerError || !header) {
    return { error: headerError?.message ?? 'No se pudo crear la cotización' };
  }

  const itemsToInsert = parsed.data.items.map((item, index) => ({
    cotizacion_id: header.id,
    posicion: index + 1,
    codigo_sku: item.codigo_sku,
    descripcion: item.descripcion,
    precio_unitario: item.precio_unitario,
    cantidad: item.cantidad,
    descuento_porcentaje: item.descuento_porcentaje,
  }));

  const { error: itemsError } = await supabase.from('cotizacion_items').insert(itemsToInsert);

  if (itemsError) {
    // Best-effort rollback: delete the orphan header. If this fails too, the
    // user will see the empty quote in the listing and can edit/delete manually.
    await supabase.from('cotizaciones').delete().eq('id', header.id);
    return { error: `No se pudieron guardar los items: ${itemsError.message}` };
  }

  redirect(`/cotizaciones/${header.id}`);
}
