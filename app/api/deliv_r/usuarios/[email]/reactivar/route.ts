import { cuerpoJsonOpcional, equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { decodificarParametro } from '@/lib/deliv/api-util'
import { artefactosQueRecupera, reactivar } from '@/lib/deliv/operaciones'
import { repoServicio } from '@/lib/deliv/servidor'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ email: string }> }

/* POST /api/deliv_r/usuarios/:email/reactivar
   Sin { confirmar: true } solo dice que contenidos recupera; con el, reactiva y devuelve la
   contrasena nueva (una sola vez). */
export async function POST(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const email = decodificarParametro((await params).email)
    const b = await cuerpoJsonOpcional(req)
    const repo = repoServicio()
    if (b.confirmar !== true) {
      const lista = await artefactosQueRecupera(repo, email)
      return json({ recupera: lista.map((a) => ({ id: a.id, titulo: a.titulo })) })
    }
    return json({ password: await reactivar(repo, email, Date.now()) })
  } catch (e) {
    return responderError(e, 'reactivar')
  }
}
