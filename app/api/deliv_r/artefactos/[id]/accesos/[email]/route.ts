import { decodificarParametro, validarId } from '@/lib/deliv/api-util'
import { equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { revocar } from '@/lib/deliv/operaciones'
import { crearRepoSupabase } from '@/lib/deliv/supabase-repo'
import { supabaseAuthServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; email: string }> }

/* DELETE /api/deliv_r/artefactos/:id/accesos/:email — quita el acceso. Solo toca deliv_accesos,
   asi que basta el cliente del equipo (sin service role). */
export async function DELETE(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const p = await params
    const id = validarId(p.id)
    const repo = crearRepoSupabase(await supabaseAuthServer())
    const revocado = await revocar(repo, id, decodificarParametro(p.email))
    return json({ ok: true, revocado })
  } catch (e) {
    return responderError(e, 'revocar')
  }
}
