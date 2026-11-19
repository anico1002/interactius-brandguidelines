import { cuerpoJson, equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { texto, validarId } from '@/lib/deliv/api-util'
import { borrar, renombrar } from '@/lib/deliv/operaciones'
import { borrarTodo, crearRepoSupabase } from '@/lib/deliv/supabase-repo'
import { supabaseAuthServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/* PATCH /api/deliv_r/artefactos/:id — cambia el título. Body: { titulo }. El enlace no cambia. */
export async function PATCH(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const id = validarId((await params).id)
    const titulo = texto((await cuerpoJson(req)).titulo, 'el título') as string
    const nuevo = await renombrar(crearRepoSupabase(await supabaseAuthServer()), id, titulo)
    return json({ titulo: nuevo })
  } catch (e) {
    return responderError(e, 'renombrar')
  }
}

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
