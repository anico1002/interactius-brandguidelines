import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return { url, key };
}

/* Session-less data client for Route Handlers and Server Components.
   Uses the public (anon) key with no session — RLS policies are permissive for now.
   Used by the public deck viewer and by the (middleware-gated) editor data routes.
   Hardening step (future): switch data reads to an authenticated client + tighten RLS with auth.uid(). */
export function supabaseServer() {
  const { url, key } = env();
  return createClient(url, key, { auth: { persistSession: false } });
}

/* Cookie-aware server client (Server Components / Route Handlers) — reads and refreshes the
   user's session from cookies. Use it to authorize, NOT (for now) as the data client. */
export async function supabaseAuthServer() {
  const { url, key } = env();
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component (read-only cookies): the middleware refreshes the session instead.
        }
      },
    },
  });
}

/* Convenience: the currently authenticated user, or null. */
export async function getUser(): Promise<User | null> {
  const sb = await supabaseAuthServer();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

/* Route Handler guard: returns a 401 response when there is no session, else null. */
export async function requireUser(): Promise<NextResponse | null> {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return null;
}
