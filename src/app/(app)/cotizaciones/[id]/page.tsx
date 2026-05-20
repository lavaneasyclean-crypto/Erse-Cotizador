import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';
import { computeTotals, lineTotal } from '@/lib/cotizaciones/totals';
import { formatCantidad, formatCLP, formatFecha } from '@/lib/format/format';

import { EstadoSelector } from './estado-selector';

export default async function CotizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cotizacion, error } = await supabase
    .from('cotizaciones')
    .select(
      'id, numero, fecha, estado, vendedor_id, cliente_rut, vencimiento, condicion_pago, notas, clientes(razon_social, persona, direccion_despacho, ciudad, contacto), cotizacion_items(id, posicion, codigo_sku, descripcion, precio_unitario, cantidad, descuento_porcentaje)',
    )
    .eq('id', id)
    .order('posicion', { foreignTable: 'cotizacion_items', ascending: true })
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!cotizacion) notFound();

  const [{ data: vendedor }, { data: viewerProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre_completo')
      .eq('id', cotizacion.vendedor_id)
      .maybeSingle(),
    supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
  ]);

  const viewerIsAdmin = viewerProfile?.is_admin ?? false;
  const canEditEstado = cotizacion.vendedor_id === user.id || viewerIsAdmin;

  const items = cotizacion.cotizacion_items ?? [];
  const totals = computeTotals(
    items.map((item) => ({
      precioUnitario: item.precio_unitario,
      cantidad: item.cantidad,
      descuentoPorcentaje: item.descuento_porcentaje,
    })),
  );

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link href="/cotizaciones" className={buttonVariants({ variant: 'outline' })}>
          ← Volver al listado
        </Link>
        <div className="flex items-center gap-2">
          <EstadoSelector
            cotizacionId={cotizacion.id}
            current={cotizacion.estado}
            canEdit={canEditEstado}
          />
          <Link
            href={`/cotizaciones/nueva?from=${cotizacion.id}`}
            className={buttonVariants({ variant: 'outline' })}
            title="Crea una cotización nueva con los mismos datos. La original se conserva intacta."
          >
            Usar como referencia
          </Link>
          <a
            href={`/cotizaciones/${cotizacion.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            Descargar PDF
          </a>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-xl font-semibold">ERSE ELECTRIC SPA</h1>
              <p className="text-sm text-muted-foreground">RUT: 77.638.085-7</p>
              <p className="text-sm text-muted-foreground">ventas@erse.cl · www.erse.cl</p>
              <p className="text-sm text-muted-foreground">+56 9 4805 4581</p>
            </div>
            <div className="rounded-lg border-2 border-amber-500 px-6 py-3 text-center">
              <p className="text-xs font-semibold">R.U.T.: 77.638.085-7</p>
              <p className="text-lg font-bold">COTIZACIÓN</p>
              <p className="text-sm">
                Nº <span className="font-mono">{cotizacion.numero}</span>
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 text-sm md:grid-cols-2">
            <Field label="SEÑOR(ES)" value={cotizacion.clientes?.razon_social ?? '—'} />
            <Field label="FECHA" value={formatFecha(cotizacion.fecha)} />
            <Field label="R.U.T." value={cotizacion.cliente_rut} />
            <Field label="VENCIMIENTO" value={cotizacion.vencimiento} />
            <Field
              label="DIRECCIÓN DESPACHO"
              value={cotizacion.clientes?.direccion_despacho ?? '—'}
            />
            <Field label="CONDICIÓN DE PAGO" value={cotizacion.condicion_pago ?? '—'} />
            <Field label="CIUDAD" value={cotizacion.clientes?.ciudad ?? '—'} />
            <Field label="VENDEDOR(a)" value={vendedor?.nombre_completo ?? '—'} />
            <Field
              label="CONTACTO"
              value={
                [cotizacion.clientes?.persona, cotizacion.clientes?.contacto]
                  .filter(Boolean)
                  .join(', ') || '—'
              }
            />
          </div>

          <Separator />

          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                <TableHead className="w-[60px] text-primary-foreground">#</TableHead>
                <TableHead className="text-primary-foreground">CÓDIGO</TableHead>
                <TableHead className="text-primary-foreground">DETALLE</TableHead>
                <TableHead className="text-right text-primary-foreground">Cantidad</TableHead>
                <TableHead className="text-right text-primary-foreground">PRECIO</TableHead>
                <TableHead className="text-right text-primary-foreground">Dcto %</TableHead>
                <TableHead className="text-right text-primary-foreground">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.posicion}</TableCell>
                  <TableCell className="font-mono text-xs">{item.codigo_sku}</TableCell>
                  <TableCell>{item.descripcion}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCantidad(item.cantidad)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCLP(item.precio_unitario)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCLP(
                      lineTotal({
                        precioUnitario: item.precio_unitario,
                        cantidad: item.cantidad,
                        descuentoPorcentaje: item.descuento_porcentaje,
                      }),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="text-xs text-muted-foreground">
            La columna <strong>Dcto %</strong> es interna — no aparece en el PDF que se le envía
            al cliente. En el PDF la columna <strong>PRECIO</strong> ya viene con el descuento
            aplicado.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">Notas / Observaciones</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {cotizacion.notas || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3 text-xs">
                <p className="font-semibold">Datos Bancarios</p>
                <p>Razón Social: ERSE ELECTRIC SPA · RUT: 77.638.085-7</p>
                <p>Cta Cte: 88413903 · Banco: Santander</p>
                <p>Correo: ventas@erse.cl</p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">${formatCLP(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span className="font-mono">${formatCLP(totals.iva)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between py-1 text-base font-semibold">
                <span>Total</span>
                <span className="font-mono">${formatCLP(totals.total)}</span>
              </div>
            </div>
          </div>

          <Separator />

          <p className="rounded-lg border border-border bg-muted/40 p-3 text-center text-sm font-medium">
            Forma de Pago: Contado, Transferencia Bancaria, Link de pago, Tarjeta de Crédito
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold">{label}:</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}
