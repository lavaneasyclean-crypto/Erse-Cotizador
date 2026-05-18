'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/auth/schemas';

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Don't leak whether the email exists — show one generic message either way.
    return { error: 'Email o contraseña incorrectos' };
  }

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
