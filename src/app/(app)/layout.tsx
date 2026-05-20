import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/app-sidebar';
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
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <AppSidebar displayName={displayName} isAdmin={isAdmin} />
      <div className="flex-1 bg-muted/30 lg:min-w-0">{children}</div>
    </div>
  );
}
