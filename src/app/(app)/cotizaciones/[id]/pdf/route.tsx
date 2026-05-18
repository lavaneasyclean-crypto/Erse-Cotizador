import { renderToBuffer } from '@react-pdf/renderer';

import { createClient } from '@/lib/supabase/server';
import { CotizacionPdf, type CotizacionPdfData } from '@/lib/pdf/cotizacion-pdf';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: cotizacion, error } = await supabase
    .from('cotizaciones')
    .select(
      'id, numero, fecha, vencimiento, condicion_pago, notas, vendedor_id, clientes(rut, razon_social, persona, direccion_despacho, ciudad, contacto), cotizacion_items(posicion, codigo_sku, descripcion, precio_unitario, cantidad, descuento_porcentaje)',
    )
    .eq('id', id)
    .order('posicion', { foreignTable: 'cotizacion_items', ascending: true })
    .maybeSingle();

  if (error) return new Response(error.message, { status: 500 });
  if (!cotizacion || !cotizacion.clientes) return new Response('Not found', { status: 404 });

  const { data: vendedor } = await supabase
    .from('profiles')
    .select('nombre_completo')
    .eq('id', cotizacion.vendedor_id)
    .maybeSingle();

  const pdfData: CotizacionPdfData = {
    numero: cotizacion.numero,
    fecha: cotizacion.fecha,
    vencimiento: cotizacion.vencimiento,
    condicion_pago: cotizacion.condicion_pago,
    notas: cotizacion.notas,
    cliente: {
      rut: cotizacion.clientes.rut,
      razon_social: cotizacion.clientes.razon_social,
      persona: cotizacion.clientes.persona,
      direccion_despacho: cotizacion.clientes.direccion_despacho,
      ciudad: cotizacion.clientes.ciudad,
      contacto: cotizacion.clientes.contacto,
    },
    vendedor: vendedor?.nombre_completo ?? '—',
    items: cotizacion.cotizacion_items ?? [],
  };

  const buffer = await renderToBuffer(<CotizacionPdf data={pdfData} />);
  const filename = `Cotizacion_${cotizacion.numero}_${cotizacion.clientes.razon_social.replace(/\s+/g, '_')}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
