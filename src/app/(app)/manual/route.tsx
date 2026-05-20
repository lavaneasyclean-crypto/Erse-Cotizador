import { renderToBuffer } from '@react-pdf/renderer';

import { createClient } from '@/lib/supabase/server';
import { ManualPdf } from '@/lib/pdf/manual';
import { contentDispositionInline } from '@/lib/pdf/filename';
import { loadLogo } from '@/lib/pdf/load-logo';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const logo = await loadLogo();
  const buffer = await renderToBuffer(
    <ManualPdf data={{ generatedAt: new Date().toISOString(), logo }} />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDispositionInline('Manual_ERSE_Cotizaciones'),
      'Cache-Control': 'no-store',
    },
  });
}
