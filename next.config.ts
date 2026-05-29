import type { NextConfig } from 'next';

/**
 * Conservative security headers applied to every response. Set here so they
 * survive any future host migration (currently Netlify, could be anywhere).
 *
 * Notably absent: a strict CSP. Next.js App Router emits inline scripts for
 * hydration and Server Component streaming; a meaningful CSP requires
 * per-request nonces, which is a non-trivial change and deserves its own ADR.
 * Tracked as a future hardening item.
 */
const securityHeaders = [
  // Force HTTPS for a year, opt-in to the preload list. Netlify already does
  // HSTS but documenting it explicitly avoids drift if we move hosts.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Block content-type sniffing — prevents browsers from re-interpreting a
  // PDF response as HTML and executing scripts inside it.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Disallow this app from being framed by anyone — kills clickjacking.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Send referrer to same-origin only; strip path/query when crossing origin.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // No sensor APIs are used. Lock them down so a dependency cannot opt in.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  // The PDF routes read public/ERSE_7.png at runtime via a *dynamic* path
  // (loadLogo loops over candidate filenames). Next's static file tracer
  // can't see a dynamic readFile, so on serverless hosts (Netlify) the file
  // wouldn't be bundled into the function and the logo would silently fall
  // back to the text brand. Force-include the logo in those functions.
  outputFileTracingIncludes: {
    '/cotizaciones/[id]/pdf': ['./public/ERSE_7.png'],
    '/manual': ['./public/ERSE_7.png'],
  },
  async headers() {
    return [
      {
        // Apply to every route. PDF and image routes inherit the same set —
        // none of them benefit from less restrictive headers.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
