import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';
import { computeTotals } from '@/lib/cotizaciones/totals';
import { formatCLP, formatFecha } from '@/lib/format/format';
import type { EstadoCotizacion } from '@/lib/supabase/types';

export const metadata = {
  title: 'Cotizaciones — ERSE',
};

const ESTADO_LABEL: Record<EstadoCotizacion, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

// Status colours include dark: variants per AGENTS.md §9.
const ESTADO_CLASSES: Record<EstadoCotizacion, string> = {
  borrador:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
  enviada:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300',
  aprobada:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  rechazada:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
};

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cotizaciones, error } = await supabase
    .from('cotizaciones')
    .select(
      'id, numero, fecha, estado, vendedor_id, cliente_rut, clientes(razon_social), cotizacion_items(precio_unitario, cantidad, descuento_porcentaje)',
    )
    .order('numero', { ascending: false });

  if (error) {
    throw new Error(`No pudimos cargar cotizaciones: ${error.message}`);
  }

  const vendedorIds = Array.from(new Set((cotizaciones ?? []).map((c) => c.vendedor_id)));
  const vendedorNames = new Map<string, string>();
  if (vendedorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nombre_completo')
      .in('id', vendedorIds);
    profiles?.forEach((p) => vendedorNames.set(p.id, p.nombre_completo));
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones</h1>
          <p className="text-muted-foreground">
            Listado de todas las cotizaciones de la empresa.
          </p>
        </div>
        <Link href="/cotizaciones/nueva" className={buttonVariants()}>
          Nueva cotización
        </Link>
      </header>

      {!cotizaciones || cotizaciones.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin cotizaciones todavía</CardTitle>
            <CardDescription>
              Cuando crees la primera, aparecerá aquí con su número correlativo (parte en 5527).
            </CardDescription>
            <CardAction>
              <Link href="/cotizaciones/nueva" className={buttonVariants()}>
                Crear la primera
              </Link>
            </CardAction>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizaciones.map((c) => {
                  const { total } = computeTotals(
                    (c.cotizacion_items ?? []).map((item) => ({
                      precioUnitario: item.precio_unitario,
                      cantidad: item.cantidad,
                      descuentoPorcentaje: item.descuento_porcentaje,
                    })),
                  );
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.numero}</TableCell>
                      <TableCell>
                        <Link
                          href={`/cotizaciones/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.clientes?.razon_social ?? c.cliente_rut}
                        </Link>
                      </TableCell>
                      <TableCell>{formatFecha(c.fecha)}</TableCell>
                      <TableCell>{vendedorNames.get(c.vendedor_id) ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ESTADO_CLASSES[c.estado]}>
                          {ESTADO_LABEL[c.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">${formatCLP(total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
