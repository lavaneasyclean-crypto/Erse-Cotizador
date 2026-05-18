import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

/**
 * Service-role Supabase client. Bypasses RLS, so it must ONLY be used
 * inside server actions / route handlers — never imported from a
 * Client Component or exposed to the browser.
 *
 * `server-only` enforces this at build time.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Paste it from Supabase Dashboard → ' +
        'Project Settings → API → service_role into .env.local and restart the dev server.',
    );
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
