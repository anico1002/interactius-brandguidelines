import { cuerpoJson, equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { tipoValido, validarEntrada, validarId, validarRutas } from '@/lib/deliv/api-util'
import { ErrorDeliv, nuevaVersion } from '@/lib/deliv/operaciones'
import { borrarVersion, crearRepoSupabase, urlsDeSubida } from '@/lib/deliv/supabase-repo'
import { supabaseAuthServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/* POST /api/deliv_r/artefactos/:id/version — URL firmadas para la version siguiente. No guarda
   nada: la ficha cambia al publicar. El cliente tendra que repetir tipo, entrada y rutas en
   /publicar, porque no se recuerdan entre las dos llamadas. */
export async function POST(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const id = validarId((await params).id)
    const b = await cuerpoJson(req)
    const rutas = validarRutas(b.rutas, b.tamanos)
    const d = { tipo: tipoValido(b.tipo), entrada: validarEntrada(b.entrada, rutas) }
    const sb = await supabaseAuthServer()
    const repo = crearRepoSupabase(sb)
    const actual = await repo.leerArtefacto(id)
    if (actual && actual.estado !== 'publicado') {
      throw new ErrorDeliv('Publica primero la versión actual.')
    }
    const { artefacto } = await nuevaVersion(repo, id, d, equipo, Date.now())
    // Limpia restos de un intento abandonado: no hay upsert y no deben publicarse.
    await borrarVersion(sb, id, artefacto.version)
    const subidas = await urlsDeSubida(sb, id, artefacto.version, rutas)
    return json({ id, version: artefacto.version, subidas })
  } catch (e) {
    return responderError(e, 'version')
  }
}
