import { redirect } from 'next/navigation';

import { AppNav } from '@/components/app-nav';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.nombre_completo ?? user.email ?? 'Vendedor(a)';
  const isAdmin = profile?.is_admin ?? false;

  return (
    <div className="min-h-svh bg-background">
      <AppNav displayName={displayName} isAdmin={isAdmin} />
      {children}
    </div>
  );
}
