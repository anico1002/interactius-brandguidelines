import { equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { decodificarParametro } from '@/lib/deliv/api-util'
import { desactivar } from '@/lib/deliv/operaciones'
import { repoServicio } from '@/lib/deliv/servidor'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ email: string }> }

/* POST /api/deliv_r/usuarios/:email/desactivar — sin contrasena no entra; conserva sus accesos. */
export async function POST(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const email = decodificarParametro((await params).email)
    await desactivar(repoServicio(), email, Date.now())
    return json({ ok: true })
  } catch (e) {
    return responderError(e, 'desactivar')
  }
}
