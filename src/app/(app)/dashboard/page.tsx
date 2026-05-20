import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ChevronRight, FileText, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
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
import { cn } from '@/lib/utils';
import type { EstadoCotizacion } from '@/lib/supabase/types';

export const metadata = {
  title: 'Dashboard — ERSE Cotizaciones',
};

const ESTADO_LABEL: Record<EstadoCotizacion, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

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

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const monthStart = startOfMonthISO();

  const [{ data: profile }, { data: cotizaciones, error }] = await Promise.all([
    supabase.from('profiles').select('nombre_completo').eq('id', user.id).maybeSingle(),
    supabase
      .from('cotizaciones')
      .select(
        'id, numero, fecha, estado, vendedor_id, cliente_rut, clientes(razon_social), cotizacion_items(precio_unitario, cantidad, descuento_porcentaje)',
      )
      .order('numero', { ascending: false }),
  ]);

  if (error) throw new Error(`No pudimos cargar el dashboard: ${error.message}`);

  const displayName = profile?.nombre_completo ?? user.email ?? 'Vendedor(a)';
  const rows = cotizaciones ?? [];

  // KPIs derived in JS — the list is small enough that filtering here beats
  // adding 4 separate count queries.
  const totalCount = rows.length;
  const myDrafts = rows.filter((c) => c.estado === 'borrador' && c.vendedor_id === user.id).length;
  const approvedThisMonth = rows.filter(
    (c) => c.estado === 'aprobada' && c.fecha >= monthStart,
  );
  const approvedThisMonthCount = approvedThisMonth.length;
  const approvedThisMonthAmount = approvedThisMonth.reduce((acc, c) => {
    const { total } = computeTotals(
      (c.cotizacion_items ?? []).map((item) => ({
        precioUnitario: item.precio_unitario,
        cantidad: item.cantidad,
        descuentoPorcentaje: item.descuento_porcentaje,
      })),
    );
    return acc + total;
  }, 0);
  const quotedThisMonthAmount = rows
    .filter((c) => c.fecha >= monthStart)
    .reduce((acc, c) => {
      const { total } = computeTotals(
        (c.cotizacion_items ?? []).map((item) => ({
          precioUnitario: item.precio_unitario,
          cantidad: item.cantidad,
          descuentoPorcentaje: item.descuento_porcentaje,
        })),
      );
      return acc + total;
    }, 0);

  const estadoCounts: Record<EstadoCotizacion, number> = {
    borrador: 0,
    enviada: 0,
    aprobada: 0,
    rechazada: 0,
  };
  rows.forEach((c) => {
    estadoCounts[c.estado] += 1;
  });

  const recent = rows.slice(0, 5);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hola, {displayName}</h1>
          <p className="text-muted-foreground">Resumen de la actividad en ERSE Cotizaciones.</p>
        </div>
        <Link href="/cotizaciones/nueva" className={buttonVariants()}>
          <Plus />
          Nueva cotización
        </Link>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total cotizaciones"
          value={totalCount.toLocaleString('es-CL')}
          hint="Histórico"
          accent="primary"
        />
        <KpiCard
          label="Mis borradores"
          value={myDrafts.toLocaleString('es-CL')}
          hint="Pendientes por enviar"
          accent="slate"
        />
        <KpiCard
          label="Aprobadas este mes"
          value={approvedThisMonthCount.toLocaleString('es-CL')}
          hint={`$${formatCLP(approvedThisMonthAmount)} CLP`}
          accent="emerald"
        />
        <KpiCard
          label="Cotizado este mes"
          value={`$${formatCLP(quotedThisMonthAmount)}`}
          hint="Suma de todas las nuevas cotizaciones"
          accent="sky"
        />
      </section>

      {/* Pipeline + recent */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pipeline por estado</CardTitle>
            <CardDescription>Distribución histórica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(estadoCounts) as EstadoCotizacion[]).map((estado) => {
              const count = estadoCounts[estado];
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={estado} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className={ESTADO_CLASSES[estado]}>
                      {ESTADO_LABEL[estado]}
                    </Badge>
                    <span className="font-mono text-muted-foreground">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all',
                        estado === 'borrador' && 'bg-slate-400',
                        estado === 'enviada' && 'bg-sky-500',
                        estado === 'aprobada' && 'bg-emerald-500',
                        estado === 'rechazada' && 'bg-rose-500',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <Link
              href="/cotizaciones"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver listado completo
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Cotizaciones recientes</CardTitle>
              <CardDescription>Últimas 5 emitidas</CardDescription>
            </div>
            <Link
              href="/cotizaciones"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todas →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-muted-foreground">
                Aún no has creado cotizaciones. La numeración parte en 5527.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((c) => {
                    const { total } = computeTotals(
                      (c.cotizacion_items ?? []).map((item) => ({
                        precioUnitario: item.precio_unitario,
                        cantidad: item.cantidad,
                        descuentoPorcentaje: item.descuento_porcentaje,
                      })),
                    );
                    return (
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
                        <TableCell>
                          <Badge variant="outline" className={ESTADO_CLASSES[c.estado]}>
                            {ESTADO_LABEL[c.estado]}
                          </Badge>
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
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          href="/cotizaciones/nueva"
          icon={Plus}
          title="Nueva cotización"
          description="Crear una cotización desde cero o duplicando una anterior."
        />
        <QuickAction
          href="/clientes"
          icon={FileText}
          title="Gestionar clientes"
          description="Agregar, editar y consultar la cartera de clientes."
        />
        <QuickAction
          href="/productos"
          icon={FileText}
          title="Catálogo de productos"
          description="Mantener al día el catálogo y los precios netos."
        />
      </section>
    </main>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: 'primary' | 'slate' | 'emerald' | 'sky';
}) {
  const accentBar = {
    primary: 'bg-primary',
    slate: 'bg-slate-400',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
  }[accent];

  return (
    <Card className="relative overflow-hidden">
      <span className={cn('absolute inset-x-0 top-0 h-1', accentBar)} aria-hidden />
      <CardContent className="space-y-1 pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="rounded-md bg-primary/10 p-2 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}
