import { describe, it, expect } from 'vitest';

import { contentDispositionInline } from '@/lib/pdf/filename';

describe('contentDispositionInline', () => {
  it('produces an inline header with sanitised ASCII filename', () => {
    const header = contentDispositionInline('Cotizacion_5530_ABM ELECTRICIDAD SPA');
    expect(header).toContain('inline; filename="Cotizacion_5530_ABM_ELECTRICIDAD_SPA.pdf"');
    expect(header).toContain("filename*=UTF-8''");
  });

  it('strips dangerous header characters (CR, LF, raw double-quote, colon)', () => {
    // Without escaping, "evil\r\nSet-Cookie:" would inject a header. The
    // ASCII filename inside filename="…" must not contain CR, LF, raw
    // quotes, or colons — those are the actual header-splitting risks.
    const header = contentDispositionInline('evil"\r\nSet-Cookie: pwn=1');
    expect(header).not.toContain('\r');
    expect(header).not.toContain('\n');

    const ascii = /filename="([^"]*)"/.exec(header)?.[1] ?? '';
    expect(ascii).not.toContain('"');
    expect(ascii).not.toContain(':');
    expect(ascii).not.toContain(';');
    expect(ascii).toMatch(/^[\w.\-]+\.pdf$/);
  });

  it('preserves the original UTF-8 name in filename*', () => {
    const header = contentDispositionInline('Cotización_ñoño');
    expect(header).toContain('filename*=UTF-8');
    // Encoded fragment should include the percent-encoded UTF-8 bytes.
    expect(header).toMatch(/Cotizaci%C3%B3n.*%C3%B1o%C3%B1o/);
  });

  it('falls back to a placeholder if the sanitised name is empty', () => {
    const header = contentDispositionInline('***');
    expect(header).toContain('filename="documento.pdf"');
  });

  it('caps the ASCII filename length so the header stays bounded', () => {
    const longName = 'A'.repeat(500);
    const header = contentDispositionInline(longName);
    const match = /filename="([^"]+)"/.exec(header);
    expect(match).not.toBeNull();
    expect(match![1].length).toBeLessThanOrEqual(80 + '.pdf'.length);
  });
});
