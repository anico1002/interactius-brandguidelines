import { equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { validarId } from '@/lib/deliv/api-util'
import { ErrorDeliv } from '@/lib/deliv/operaciones'
import { LIMITE_PORTADA, validarPortada } from '@/lib/deliv/portada'
import { crearRepoSupabase, guardarPortada } from '@/lib/deliv/supabase-repo'
import { supabaseAuthServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/* POST /api/deliv_r/artefactos/:id/portada?version=N — cuerpo: el JPEG en bruto (image/jpeg).
   Guarda la portada de esa versión (lib/deliv/portada.ts). Si entretanto se ha publicado otra
   versión, la rechaza: la galería la volverá a generar para la nueva. */
export async function POST(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const id = validarId((await params).id)
    const version = Number(new URL(req.url).searchParams.get('version'))
    if (Number(req.headers.get('content-length') ?? 0) > LIMITE_PORTADA) throw new ErrorDeliv('La portada pesa demasiado.')
    const jpeg = new Uint8Array(await req.arrayBuffer())
    const motivo = validarPortada(jpeg)
    if (motivo) throw new ErrorDeliv(motivo)

    const sb = await supabaseAuthServer()
    const a = await crearRepoSupabase(sb).leerArtefacto(id)
    if (!a || a.estado !== 'publicado') throw new ErrorDeliv('El artefacto no existe.')
    if (a.version !== version) throw new ErrorDeliv('La versión ha cambiado.')
    await guardarPortada(sb, id, version, jpeg)
    return json({ ok: true })
  } catch (e) {
    return responderError(e, 'portada')
  }
}
