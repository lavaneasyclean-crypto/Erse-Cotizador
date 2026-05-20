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

  // Catalog edits are admin-only as of migration 0005.
  const { data: viewer } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!viewer?.is_admin) {
    return { error: 'Sólo administradores pueden editar productos.' };
  }

  const codigo = formData.get('codigo_sku');
  if (typeof codigo !== 'string' || codigo === '') {
    return { error: 'Falta el código SKU del producto a editar' };
  }

  const parsed = updateProductoSchema.safeParse(readFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { error, count } = await supabase
    .from('productos')
    .update(
      {
        descripcion: parsed.data.descripcion,
        precio_neto: parsed.data.precio_neto,
        // updated_at is set by the trigger; updated_by reflects the human
        // caller for audit. See migration 0006.
        updated_by: user.id,
      },
      { count: 'exact' },
    )
    .eq('codigo_sku', codigo);

  if (error) return { error: 'No se pudo guardar el producto.' };
  if (count === 0) return { error: 'No se encontró el producto o no tienes permiso.' };

  revalidatePath('/productos');
  revalidatePath('/cotizaciones/nueva');
  return { success: 'Producto actualizado.' };
}

export async function toggleProductoActivoAction(
  _previousState: ProductoActionResult,
  formData: FormData,
): Promise<ProductoActionResult> {
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
    return { error: 'Sólo administradores pueden archivar productos.' };
  }

  const codigo = formData.get('codigo_sku');
  const next = formData.get('activo');
  if (typeof codigo !== 'string' || codigo === '') {
    return { error: 'Falta el código SKU' };
  }
  const activo = next === 'true';

  const { error, count } = await supabase
    .from('productos')
    .update({ activo, updated_by: user.id }, { count: 'exact' })
    .eq('codigo_sku', codigo);

  if (error) return { error: 'No se pudo actualizar el producto.' };
  if (count === 0) return { error: 'Producto no encontrado.' };

  revalidatePath('/productos');
  revalidatePath('/cotizaciones/nueva');
  return { success: activo ? 'Producto restaurado.' : 'Producto archivado.' };
}
