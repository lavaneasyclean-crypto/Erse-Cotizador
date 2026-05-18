import 'server-only';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

/**
 * Server-only guard. Throws via `redirect()` if the caller is not signed in
 * or not an admin. Bounces non-admins to /dashboard (instead of /login or
 * 404) so the existence of /admin/* pages is not leaked to regular users.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, nombre_completo')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect('/dashboard');

  return { user, profile };
}
