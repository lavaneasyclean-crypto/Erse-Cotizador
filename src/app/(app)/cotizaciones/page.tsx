import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

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
import { ESTADOS } from '@/lib/cotizaciones/estado-schema';
import type { EstadoCotizacion } from '@/lib/supabase/types';

import { EstadoSelector } from './[id]/estado-selector';
import { CotizacionesFilters } from './cotizaciones-filters';

export const metadata = {
  title: 'Cotizaciones — ERSE',
};

type FilterParams = {
  estado?: string;
  desde?: string;
  hasta?: string;
  q?: string;
};

function parseEstados(raw: string | undefined): EstadoCotizacion[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is EstadoCotizacion => (ESTADOS as readonly string[]).includes(s));
}

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<FilterParams>;
}) {
  const params = await searchParams;
  const selectedEstados = parseEstados(params.estado);
  const desde = params.desde?.trim() || null;
  const hasta = params.hasta?.trim() || null;
  const q = params.q?.trim() || null;
  const hasFilters =
    selectedEstados.length > 0 || desde !== null || hasta !== null || q !== null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let query = supabase
    .from('cotizaciones')
    .select(
      // !inner switches the embedded clientes to an INNER JOIN so we can
      // filter parent rows by cliente.razon_social.
      'id, numero, fecha, estado, vendedor_id, cliente_rut, clientes!inner(razon_social), cotizacion_items(precio_unitario, cantidad, descuento_porcentaje)',
    )
    .order('numero', { ascending: false });

  if (selectedEstados.length > 0) query = query.in('estado', selectedEstados);
  if (desde) query = query.gte('fecha', desde);
  if (hasta) query = query.lte('fecha', hasta);
  if (q) {
    // Pure-digit input → match the correlative number exactly.
    // Anything else → ILIKE on cliente.razon_social via the inner-joined relation.
    if (/^\d+$/.test(q)) {
      query = query.eq('numero', Number(q));
    } else {
      query = query.ilike('clientes.razon_social', `%${q}%`);
    }
  }

  const [{ data: cotizaciones, error }, { data: profile }] = await Promise.all([
    query,
    supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
  ]);

  if (error) {
    throw new Error(`No pudimos cargar cotizaciones: ${error.message}`);
  }

  const isAdmin = profile?.is_admin ?? false;

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
    <main className="flex w-full flex-col gap-6 p-6">
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

      <CotizacionesFilters />

      {!cotizaciones || cotizaciones.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasFilters ? 'Sin coincidencias' : 'Sin cotizaciones todavía'}
            </CardTitle>
            <CardDescription>
              {hasFilters
                ? 'Ninguna cotización coincide con los filtros activos. Ajusta los criterios o presiona "Limpiar".'
                : 'Cuando crees la primera, aparecerá aquí con su número correlativo (parte en 5527).'}
            </CardDescription>
            {!hasFilters ? (
              <CardAction>
                <Link href="/cotizaciones/nueva" className={buttonVariants()}>
                  Crear la primera
                </Link>
              </CardAction>
            ) : null}
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
                  const canEdit = c.vendedor_id === user.id || isAdmin;
                  return (
                    // `group` + `relative` enable the stretched-link pattern:
                    // a single absolutely-positioned Link covers the whole row
                    // for click navigation. Interactive children (the estado
                    // selector) sit on a higher z-index so they receive their
                    // own clicks instead of triggering the row link.
                    <TableRow
                      key={c.id}
                      className="group relative cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="font-mono">
                        <Link
                          href={`/cotizaciones/${c.id}`}
                          aria-label={`Abrir cotización Nº ${c.numero}`}
                          className="absolute inset-0 z-0"
                        />
                        <span className="relative">{c.numero}</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.clientes?.razon_social ?? c.cliente_rut}
                      </TableCell>
                      <TableCell>{formatFecha(c.fecha)}</TableCell>
                      <TableCell>{vendedorNames.get(c.vendedor_id) ?? '—'}</TableCell>
                      <TableCell>
                        <div className="relative z-10 inline-block">
                          <EstadoSelector
                            cotizacionId={c.id}
                            current={c.estado}
                            canEdit={canEdit}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 font-mono">
                          <span>${formatCLP(total)}</span>
                          <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        {cotizaciones?.length ?? 0}{' '}
        {cotizaciones?.length === 1 ? 'cotización' : 'cotizaciones'}
        {hasFilters ? ' (filtradas)' : ''}
      </p>
    </main>
  );
}
