'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createClienteSchema, updateClienteSchema } from '@/lib/clientes/schemas';
import { normalizeRut } from '@/lib/rut/rut';

export type ClienteActionResult = { error?: string; success?: string };

function readFormFields(formData: FormData) {
  return {
    rut: formData.get('rut'),
    razon_social: formData.get('razon_social'),
    persona: formData.get('persona'),
    direccion_despacho: formData.get('direccion_despacho'),
    condicion_de_pago: formData.get('condicion_de_pago'),
    ciudad: formData.get('ciudad'),
    contacto: formData.get('contacto'),
    email: formData.get('email'),
    giro: formData.get('giro'),
  };
}

export async function createClienteAction(
  _previousState: ClienteActionResult,
  formData: FormData,
): Promise<ClienteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Inicia sesión nuevamente.' };

  const parsed = createClienteSchema.safeParse(readFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { error } = await supabase.from('clientes').insert({
    rut: parsed.data.rut,
    razon_social: parsed.data.razon_social,
    persona: parsed.data.persona,
    direccion_despacho: parsed.data.direccion_despacho,
    condicion_de_pago: parsed.data.condicion_de_pago,
    ciudad: parsed.data.ciudad,
    contacto: parsed.data.contacto,
    email: parsed.data.email,
    giro: parsed.data.giro,
  });

  if (error) {
    // 23505 = unique_violation (duplicate primary key)
    if (error.code === '23505') {
      return { error: `Ya existe un cliente con RUT ${parsed.data.rut}.` };
    }
    return { error: error.message };
  }

  revalidatePath('/clientes');
  revalidatePath('/cotizaciones/nueva');
  return { success: `Cliente ${parsed.data.razon_social} creado.` };
}

export async function updateClienteAction(
  _previousState: ClienteActionResult,
  formData: FormData,
): Promise<ClienteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Inicia sesión nuevamente.' };

  // Catalog edits are admin-only as of migration 0005. RLS enforces this at
  // the DB, but we surface a friendly message app-side instead of letting
  // the update silently affect zero rows.
  const { data: viewer } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!viewer?.is_admin) {
    return { error: 'Sólo administradores pueden editar clientes.' };
  }

  const rawRut = formData.get('rut');
  if (typeof rawRut !== 'string' || rawRut === '') {
    return { error: 'Falta el RUT del cliente a editar' };
  }
  // Normalise the lookup RUT so a row stored as "76092011-8" matches even
  // if the form hidden field comes in formatted "76.092.011-8".
  const rut = normalizeRut(rawRut);

  // The RUT is immutable; updateClienteSchema doesn't accept it.
  const parsed = updateClienteSchema.safeParse(readFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { error, count } = await supabase
    .from('clientes')
    .update(
      {
        razon_social: parsed.data.razon_social,
        persona: parsed.data.persona,
        direccion_despacho: parsed.data.direccion_despacho,
        condicion_de_pago: parsed.data.condicion_de_pago,
        ciudad: parsed.data.ciudad,
        contacto: parsed.data.contacto,
        email: parsed.data.email,
        giro: parsed.data.giro,
        // updated_at is set by the trigger; updated_by is set here so it
        // reflects the human caller, not the database role.
        updated_by: user.id,
      },
      { count: 'exact' },
    )
    .eq('rut', rut);

  if (error) return { error: 'No se pudo guardar el cliente.' };
  if (count === 0) return { error: 'No se encontró el cliente o no tienes permiso.' };

  revalidatePath('/clientes');
  revalidatePath('/cotizaciones/nueva');
  return { success: `Cliente actualizado.` };
}

export async function toggleClienteActivoAction(
  _previousState: ClienteActionResult,
  formData: FormData,
): Promise<ClienteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Inicia sesión nuevamente.' };

  const { data: viewer } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!viewer?.is_admin) {
    return { error: 'Sólo administradores pueden archivar clientes.' };
  }

  const rawRut = formData.get('rut');
  const next = formData.get('activo');
  if (typeof rawRut !== 'string' || rawRut === '') {
    return { error: 'Falta el RUT del cliente' };
  }
  const activo = next === 'true';

  const { error, count } = await supabase
    .from('clientes')
    .update({ activo, updated_by: user.id }, { count: 'exact' })
    .eq('rut', normalizeRut(rawRut));

  if (error) return { error: 'No se pudo actualizar el cliente.' };
  if (count === 0) return { error: 'Cliente no encontrado.' };

  revalidatePath('/clientes');
  revalidatePath('/cotizaciones/nueva');
  return { success: activo ? 'Cliente restaurado.' : 'Cliente archivado.' };
}
