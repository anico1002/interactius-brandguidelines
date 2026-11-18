import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { DelivNoDisponible } from './config.ts'
import type { RepoDeliv } from './repo.ts'
import { crearRepoSupabase } from './supabase-repo.ts'

/*
 * EL UNICO modulo con la service role, que salta la RLS entera. Solo lo
 * importan los ficheros que permite lib/deliv/__tests__/guardas.test.ts
 * (Global Constraints). 'server-only' rompe el build si un componente cliente
 * lo importa, aunque sea de forma indirecta.
 */

export function clienteServicio(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY
  // DelivNoDisponible: las rutas lo traducen a 503 «Servicio no disponible.».
  if (!url || !clave) throw new DelivNoDisponible('faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** El repositorio con la service role. Quien lo llama tiene que estar en la lista de guardas.test.ts. */
export function repoServicio(): RepoDeliv {
  return crearRepoSupabase(clienteServicio())
}
