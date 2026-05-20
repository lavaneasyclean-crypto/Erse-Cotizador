'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createProductoSchema, updateProductoSchema } from '@/lib/productos/schemas';

export type ProductoActionResult = { error?: string; success?: string };

function readFormFields(formData: FormData) {
  return {
    codigo_sku: formData.get('codigo_sku'),
    descripcion: formData.get('descripcion'),
    precio_neto: formData.get('precio_neto'),
  };
}

export async function createProductoAction(
  _previousState: ProductoActionResult,
  formData: FormData,
): Promise<ProductoActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Inicia sesión nuevamente.' };

  const parsed = createProductoSchema.safeParse(readFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { error } = await supabase.from('productos').insert(parsed.data);

  if (error) {
    if (error.code === '23505') {
      return { error: `Ya existe un producto con SKU ${parsed.data.codigo_sku}.` };
    }
    return { error: error.message };
  }

  revalidatePath('/productos');
  revalidatePath('/cotizaciones/nueva');
  return { success: `Producto ${parsed.data.codigo_sku} creado.` };
}

export async function updateProductoAction(
  _previousState: ProductoActionResult,
  formData: FormData,
): Promise<ProductoActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión expirada. Inicia sesión nuevamente.' };

  const codigo = formData.get('codigo_sku');
  if (typeof codigo !== 'string' || codigo === '') {
    return { error: 'Falta el código SKU del producto a editar' };
  }

  const parsed = updateProductoSchema.safeParse(readFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { error } = await supabase
    .from('productos')
    .update({
      descripcion: parsed.data.descripcion,
      precio_neto: parsed.data.precio_neto,
    })
    .eq('codigo_sku', codigo);

  if (error) return { error: error.message };

  revalidatePath('/productos');
  revalidatePath('/cotizaciones/nueva');
  return { success: 'Producto actualizado.' };
}
