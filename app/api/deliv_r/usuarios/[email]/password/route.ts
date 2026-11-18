import { equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { decodificarParametro } from '@/lib/deliv/api-util'
import { regenerarPassword } from '@/lib/deliv/operaciones'
import { repoServicio } from '@/lib/deliv/servidor'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ email: string }> }

/* POST /api/deliv_r/usuarios/:email/password — contrasena nueva; sale una sola vez. */
export async function POST(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const email = decodificarParametro((await params).email)
    return json({ password: await regenerarPassword(repoServicio(), email, Date.now()) })
  } catch (e) {
    return responderError(e, 'password')
  }
}
