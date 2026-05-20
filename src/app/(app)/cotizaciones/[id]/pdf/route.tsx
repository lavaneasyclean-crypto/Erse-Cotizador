import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';

import { createClient } from '@/lib/supabase/server';
import { CotizacionPdf, type CotizacionPdfData } from '@/lib/pdf/cotizacion-pdf';
import { contentDispositionInline } from '@/lib/pdf/filename';

export const runtime = 'nodejs';

/**
 * Load the ERSE logo from disk at request time. We cache the result in module
 * scope so each PDF render skips the disk read. The file is optional — if it
 * doesn't exist the PDF falls back to a text brand. We try a few common
 * filenames in `public/` so the user can drop the file with any of them.
 */
const LOGO_CANDIDATES = ['logo-erse.png', 'ERSE_7.png', 'erse-logo.png', 'logo.png'];
let cachedLogo: Buffer | null | undefined;
async function loadLogo(): Promise<Buffer | null> {
  if (cachedLogo !== undefined) return cachedLogo;
  for (const name of LOGO_CANDIDATES) {
    try {
      const buffer = await readFile(path.join(process.cwd(), 'public', name));
      cachedLogo = buffer;
      return buffer;
    } catch {
      // try next candidate
    }
  }
  cachedLogo = null;
  return null;
}

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

  const [{ data: vendedor }, logo] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre_completo')
      .eq('id', cotizacion.vendedor_id)
      .maybeSingle(),
    loadLogo(),
  ]);

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
    logo,
  };

  const buffer = await renderToBuffer(<CotizacionPdf data={pdfData} />);
  // razón social is user-controlled — never interpolate it into the header
  // directly; use the sanitised RFC 5987 helper.
  const baseName = `Cotizacion_${cotizacion.numero}_${cotizacion.clientes.razon_social}`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDispositionInline(baseName),
      'Cache-Control': 'no-store',
    },
  });
}
