import { cuerpoJson, equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { enlaceDe, texto, validarId } from '@/lib/deliv/api-util'
import { ErrorDeliv, darAcceso } from '@/lib/deliv/operaciones'
import { repoServicio } from '@/lib/deliv/servidor'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/* POST /api/deliv_r/artefactos/:id/accesos { email } — crea la persona si no existe (la
   contrasena sale una sola vez) y le da acceso. Toca usuarios: repositorio de servicio, solo
   despues de comprobar al equipo. */
export async function POST(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const id = validarId((await params).id)
    const b = await cuerpoJson(req)
    const email = texto(b.email, 'el correo') as string
    const repo = repoServicio()
    const r = await darAcceso(repo, id, email, equipo, Date.now())
    const a = await repo.leerArtefacto(id)
    if (!a) throw new ErrorDeliv('El artefacto no existe.')
    return json({ ok: true, ...r, enlace: enlaceDe(a), titulo: a.titulo })
  } catch (e) {
    return responderError(e, 'acceso')
  }
}
