import Link from 'next/link';
import { redirect } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Dashboard — ERSE Cotizaciones',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { count: cotizacionesCount }] = await Promise.all([
    supabase.from('profiles').select('nombre_completo').eq('id', user.id).maybeSingle(),
    supabase.from('cotizaciones').select('id', { count: 'exact', head: true }),
  ]);

  const displayName = profile?.nombre_completo ?? user.email ?? 'Vendedor(a)';
  const total = cotizacionesCount ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {displayName}</h1>
        <p className="text-muted-foreground">Bienvenido al cotizador de ERSE Electric.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Cotizaciones</CardTitle>
          <CardDescription>
            {total === 0
              ? 'Aún no has creado ninguna cotización. La numeración parte en 5527.'
              : `${total} ${total === 1 ? 'cotización registrada' : 'cotizaciones registradas'}.`}
          </CardDescription>
          <CardAction>
            <Link href="/cotizaciones" className={buttonVariants({ variant: 'outline' })}>
              Ver listado
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Link href="/cotizaciones/nueva" className={buttonVariants()}>
            Nueva cotización
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
