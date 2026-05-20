import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';

/**
 * Load the ERSE logo from `public/` once per process and reuse the buffer.
 * `cache()` deduplicates concurrent reads inside a single request; the
 * module-level memo handles the cross-request reuse.
 *
 * Multiple filenames are tried so contributors can drop the file with any
 * common name. Returns `null` if no candidate exists — both PDF renderers
 * gracefully fall back to a text brand.
 */
const LOGO_CANDIDATES = ['logo-erse.png', 'ERSE_7.png', 'erse-logo.png', 'logo.png'];

let cached: Buffer | null | undefined;

export const loadLogo = cache(async (): Promise<Buffer | null> => {
  if (cached !== undefined) return cached;
  for (const name of LOGO_CANDIDATES) {
    try {
      cached = await readFile(path.join(process.cwd(), 'public', name));
      return cached;
    } catch {
      // try next candidate
    }
  }
  cached = null;
  return null;
});
