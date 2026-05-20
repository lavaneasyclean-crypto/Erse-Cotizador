import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';

import { createClient } from '@/lib/supabase/server';
import { ManualPdf } from '@/lib/pdf/manual';
import { contentDispositionInline } from '@/lib/pdf/filename';

export const runtime = 'nodejs';

const LOGO_CANDIDATES = ['logo-erse.png', 'ERSE_7.png', 'erse-logo.png', 'logo.png'];
let cachedLogo: Buffer | null | undefined;

async function loadLogo(): Promise<Buffer | null> {
  if (cachedLogo !== undefined) return cachedLogo;
  for (const name of LOGO_CANDIDATES) {
    try {
      cachedLogo = await readFile(path.join(process.cwd(), 'public', name));
      return cachedLogo;
    } catch {
      // try next candidate
    }
  }
  cachedLogo = null;
  return null;
}

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
