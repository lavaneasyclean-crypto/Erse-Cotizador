'use server';

import { revalidatePath } from 'next/cache';

import { createAdminClient } from '@/lib/supabase/admin';
import { createUserSchema, updateUserSchema } from '@/lib/auth/admin-schemas';
import { requireAdmin } from '@/lib/auth/require-admin';

export type CreateUserResult = { error?: string; success?: string };

export async function createUserAction(
  _previousState: CreateUserResult,
  formData: FormData,
): Promise<CreateUserResult> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    nombre_completo: formData.get('nombre_completo'),
    is_admin: formData.get('is_admin'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { nombre_completo: parsed.data.nombre_completo },
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? 'No se pudo crear el usuario' };
  }

  if (parsed.data.is_admin) {
    const { error: roleError } = await admin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', created.user.id);

    if (roleError) {
      return {
        error: `Usuario creado, pero no se pudo marcar como admin: ${roleError.message}`,
      };
    }
  }

  revalidatePath('/admin/usuarios');
  return { success: `Usuario ${parsed.data.email} creado correctamente.` };
}

export async function deleteUserAction(
  _previousState: CreateUserResult,
  formData: FormData,
): Promise<CreateUserResult> {
  const { user: admin } = await requireAdmin();

  const userId = formData.get('user_id');
  if (typeof userId !== 'string' || userId === '') {
    return { error: 'Falta el id del usuario a eliminar' };
  }

  if (userId === admin.id) {
    return { error: 'No puedes eliminar tu propio usuario desde aquí.' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath('/admin/usuarios');
  return { success: 'Usuario eliminado.' };
}

export async function updateUserAction(
  _previousState: CreateUserResult,
  formData: FormData,
): Promise<CreateUserResult> {
  const { user: currentAdmin } = await requireAdmin();

  const userId = formData.get('user_id');
  if (typeof userId !== 'string' || userId === '') {
    return { error: 'Falta el id del usuario a editar' };
  }

  const parsed = updateUserSchema.safeParse({
    nombre_completo: formData.get('nombre_completo'),
    is_admin: formData.get('is_admin'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  // Don't let the only admin demote themselves into a vendor and lock everyone
  // out of /admin/usuarios. Demoting other admins is fine.
  if (userId === currentAdmin.id && !parsed.data.is_admin) {
    return { error: 'No puedes quitarte el rol de administrador a ti mismo.' };
  }

  const admin = createAdminClient();

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      nombre_completo: parsed.data.nombre_completo,
      is_admin: parsed.data.is_admin,
    })
    .eq('id', userId);

  if (profileError) return { error: profileError.message };

  if (parsed.data.password) {
    const { error: passError } = await admin.auth.admin.updateUserById(userId, {
      password: parsed.data.password,
    });
    if (passError) {
      return {
        error: `Datos actualizados, pero la contraseña no se pudo cambiar: ${passError.message}`,
      };
    }
  }

  revalidatePath('/admin/usuarios');
  revalidatePath('/dashboard');
  return { success: 'Usuario actualizado correctamente.' };
}
