import { equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { validarId } from '@/lib/deliv/api-util'
import { borrar } from '@/lib/deliv/operaciones'
import { borrarTodo, crearRepoSupabase } from '@/lib/deliv/supabase-repo'
import { supabaseAuthServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/* DELETE /api/deliv_r/artefactos/:id — borra la ficha (y sus accesos) y todos sus archivos. */
export async function DELETE(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const id = validarId((await params).id)
    const sb = await supabaseAuthServer()
    await borrar(crearRepoSupabase(sb), id)
    await borrarTodo(sb, id)
    return json({ ok: true })
  } catch (e) {
    return responderError(e, 'borrar')
  }
}
