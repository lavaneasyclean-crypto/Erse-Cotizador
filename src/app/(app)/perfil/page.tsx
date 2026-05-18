import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

import { ProfileForm } from './profile-form';

export const metadata = {
  title: 'Mi perfil — ERSE Cotizaciones',
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos del vendedor</CardTitle>
          <CardDescription>
            Estos datos aparecen en las cotizaciones que creas (campo VENDEDOR(a) del PDF).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialNombre={profile?.nombre_completo ?? ''} email={user.email ?? ''} />
        </CardContent>
      </Card>
    </main>
  );
}
