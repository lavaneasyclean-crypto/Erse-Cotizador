import Link from 'next/link';
import { redirect } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  QuoteForm,
  type PreviousQuote,
  type QuoteFormInitial,
} from '@/components/cotizaciones/quote-form';
import { createClient } from '@/lib/supabase/server';
import { computeTotals } from '@/lib/cotizaciones/totals';

import { createCotizacionAction } from './actions';

export const metadata = {
  title: 'Nueva cotización — ERSE',
};

const DEFAULT_INITIAL: QuoteFormInitial = {
  cliente_rut: '',
  vencimiento: '2 días hábiles',
  condicion_pago: 'Contado',
  notas: '',
  items: [],
};

// Cap the picker list so it stays responsive without paging. When this gets
// uncomfortable we'll add server-side search per the Haulmer pattern memory.
const PICKER_LIMIT = 200;

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: clientes }, { data: productos }, { data: pastQuotes }] = await Promise.all([
    supabase
      .from('clientes')
      .select('rut, razon_social, condicion_de_pago')
      .order('razon_social', { ascending: true }),
    supabase
      .from('productos')
      .select('codigo_sku, descripcion, precio_neto')
      .order('descripcion', { ascending: true }),
    supabase
      .from('cotizaciones')
      .select(
        'id, numero, fecha, clientes(razon_social), cotizacion_items(precio_unitario, cantidad, descuento_porcentaje)',
      )
      .order('numero', { ascending: false })
      .limit(PICKER_LIMIT),
  ]);

  const previousQuotes: PreviousQuote[] = (pastQuotes ?? [])
    .filter((q) => q.id !== from)
    .map((q) => ({
      id: q.id,
      numero: q.numero,
      fecha: q.fecha,
      cliente_razon_social: q.clientes?.razon_social ?? 'Sin cliente',
      total: computeTotals(
        (q.cotizacion_items ?? []).map((item) => ({
          precioUnitario: item.precio_unitario,
          cantidad: item.cantidad,
          descuentoPorcentaje: item.descuento_porcentaje,
        })),
      ).total,
    }));

  let initial: QuoteFormInitial = DEFAULT_INITIAL;
  let sourceNumero: number | null = null;

  if (from) {
    const { data: source } = await supabase
      .from('cotizaciones')
      .select(
        'numero, cliente_rut, vencimiento, condicion_pago, notas, cotizacion_items(posicion, codigo_sku, descripcion, precio_unitario, cantidad, descuento_porcentaje)',
      )
      .eq('id', from)
      .order('posicion', { foreignTable: 'cotizacion_items', ascending: true })
      .maybeSingle();

    if (source) {
      sourceNumero = source.numero;
      initial = {
        cliente_rut: source.cliente_rut,
        vencimiento: source.vencimiento,
        condicion_pago: source.condicion_pago ?? 'Contado',
        notas: source.notas ?? '',
        items: (source.cotizacion_items ?? []).map((item) => ({
          codigo_sku: item.codigo_sku,
          descripcion: item.descripcion,
          precio_unitario: item.precio_unitario,
          cantidad: item.cantidad,
          descuento_porcentaje: item.descuento_porcentaje,
        })),
      };
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva cotización</CardTitle>
          <CardDescription>
            {sourceNumero ? (
              <>
                Basada en la cotización Nº <strong>{sourceNumero}</strong>. Al guardar se crea una
                cotización nueva con su propio correlativo — la original no se modifica.{' '}
                <Link href={`/cotizaciones/${from}`} className="underline">
                  Ver la original
                </Link>
              </>
            ) : (
              'Selecciona cliente, agrega items del catálogo y revisa los totales antes de guardar.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/*
            The `key` forces QuoteForm to unmount + remount when the `?from`
            query changes. Without it, navigating from /nueva to
            /nueva?from=X keeps the same React tree and useState ignores
            the new `initial` prop.
          */}
          <QuoteForm
            key={from ?? 'fresh'}
            clientes={clientes ?? []}
            productos={productos ?? []}
            previousQuotes={previousQuotes}
            action={createCotizacionAction}
            submitLabel={sourceNumero ? 'Guardar nueva cotización' : 'Guardar cotización'}
            initial={initial}
          />
        </CardContent>
      </Card>

      {sourceNumero ? (
        <div className="flex justify-start">
          <Link
            href={`/cotizaciones/${from}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            ← Volver a la cotización original
          </Link>
        </div>
      ) : null}
    </main>
  );
}
