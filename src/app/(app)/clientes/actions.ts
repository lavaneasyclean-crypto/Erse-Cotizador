'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createClienteSchema, updateClienteSchema } from '@/lib/clientes/schemas';

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

  const rut = formData.get('rut');
  if (typeof rut !== 'string' || rut === '') {
    return { error: 'Falta el RUT del cliente a editar' };
  }

  // The RUT is immutable; updateClienteSchema doesn't accept it.
  const parsed = updateClienteSchema.safeParse(readFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { error } = await supabase
    .from('clientes')
    .update({
      razon_social: parsed.data.razon_social,
      persona: parsed.data.persona,
      direccion_despacho: parsed.data.direccion_despacho,
      condicion_de_pago: parsed.data.condicion_de_pago,
      ciudad: parsed.data.ciudad,
      contacto: parsed.data.contacto,
      email: parsed.data.email,
      giro: parsed.data.giro,
    })
    .eq('rut', rut);

  if (error) return { error: error.message };

  revalidatePath('/clientes');
  revalidatePath('/cotizaciones/nueva');
  return { success: `Cliente actualizado.` };
}
