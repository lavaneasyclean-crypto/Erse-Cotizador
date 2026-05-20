import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

import { ClientesTable } from './clientes-table';
import { NewClienteButton } from './new-cliente-button';

export const metadata = {
  title: 'Clientes — ERSE Cotizaciones',
};

export default async function ClientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: clientes, error }, { data: profile }] = await Promise.all([
    supabase
      .from('clientes')
      .select(
        'rut, razon_social, persona, direccion_despacho, condicion_de_pago, ciudad, contacto, email, giro, activo',
      )
      .order('razon_social', { ascending: true }),
    supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
  ]);

  if (error) throw new Error('No pudimos cargar los clientes.');
  const isAdmin = profile?.is_admin ?? false;

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Cartera de clientes disponibles al cotizar.
          </p>
        </div>
        <NewClienteButton />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'El RUT funciona como llave única; una vez creado, sólo los demás campos son editables.'
              : 'Los vendedores pueden agregar nuevos clientes. Sólo administradores pueden editar los existentes.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientesTable clientes={clientes ?? []} canEdit={isAdmin} />
        </CardContent>
      </Card>
    </main>
  );
}
