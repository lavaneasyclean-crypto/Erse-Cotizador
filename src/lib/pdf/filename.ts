/**
 * Build a safe `Content-Disposition` header value for a downloadable PDF.
 *
 * Raw cliente names ("VINA VENTISQUERO S.A." or worse: anything a vendor
 * types into the razón social) cannot land directly inside the header — `"`,
 * `\r`, or `\n` would let an attacker inject extra headers. We sanitise to
 * an ASCII-safe subset and emit the modern RFC 5987 `filename*` form too so
 * UTF-8 names survive when the browser supports it.
 */
export function contentDispositionInline(rawName: string): string {
  const safeAscii =
    rawName
      .normalize('NFKD')
      .replace(/[^\w.\- ]+/g, '_') // strip anything that isn't alnum/underscore/dot/dash/space
      .replace(/\s+/g, '_') // collapse whitespace runs
      .replace(/_+/g, '_') // collapse stacked underscores
      .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
      .slice(0, 80) || 'documento';

  const utf8 = encodeURIComponent(rawName).slice(0, 200);

  return `inline; filename="${safeAscii}.pdf"; filename*=UTF-8''${utf8}.pdf`;
}
