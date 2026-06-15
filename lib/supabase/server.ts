import { createClient } from '@supabase/supabase-js';

/* Server-side Supabase client for Route Handlers.
   MVP: open access via the public (anon) key, no session — RLS policies are permissive.
   When team login lands, swap to a cookie-aware client and tighten RLS with auth.uid(). */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
