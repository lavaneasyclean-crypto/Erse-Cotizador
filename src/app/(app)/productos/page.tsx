import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

import { NewProductoButton } from './new-producto-button';
import { ProductosTable } from './productos-table';

export const metadata = {
  title: 'Productos — ERSE Cotizaciones',
};

export default async function ProductosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: productos, error } = await supabase
    .from('productos')
    .select('codigo_sku, descripcion, precio_neto')
    .order('descripcion', { ascending: true });

  if (error) throw new Error(`No pudimos cargar productos: ${error.message}`);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Catálogo disponible al cotizar.
          </p>
        </div>
        <NewProductoButton />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            El código SKU funciona como llave única; una vez creado sólo se pueden editar
            descripción y precio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductosTable productos={productos ?? []} />
        </CardContent>
      </Card>
    </main>
  );
}
