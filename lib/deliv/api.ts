import { isTeamEmail } from '../auth/team.ts'
import { getUser } from '../supabase/server.ts'
import { errorARespuesta, objetoJson } from './api-util.ts'
import { ErrorDeliv } from './operaciones.ts'
import { CABECERAS_PRIVADAS, origenValido } from './http.ts'

/** JSON privado: sin caché, sin referrer, sin indexar. */
export function json(cuerpo: unknown, status = 200): Response {
  return Response.json(cuerpo, { status, headers: CABECERAS_PRIVADAS })
}

/**
 * Origin valido + sesion de equipo. Devuelve el correo del equipo o la
 * Response de rechazo (403 / 401).
 */
export async function equipoDeLaPeticion(req: Request): Promise<string | Response> {
  if (!origenValido(req)) return json({ ok: false, mensaje: 'Origen no permitido.' }, 403)
  const user = await getUser()
  const email = user?.email
  if (!email || !isTeamEmail(email)) return json({ ok: false, mensaje: 'No autenticado.' }, 401)
  return email.trim().toLowerCase()
}

/** Cuerpo JSON como objeto; ErrorDeliv si no lo es. */
export async function cuerpoJson(req: Request): Promise<Record<string, unknown>> {
  let v: unknown
  try {
    v = await req.json()
  } catch {
    throw new ErrorDeliv('La petición no es válida.')
  }
  return objetoJson(v)
}

/** Como cuerpoJson, pero un cuerpo vacío vale {}. */
export async function cuerpoJsonOpcional(req: Request): Promise<Record<string, unknown>> {
  const t = await req.text()
  if (!t.trim()) return {}
  let v: unknown
  try {
    v = JSON.parse(t)
  } catch {
    throw new ErrorDeliv('La petición no es válida.')
  }
  return objetoJson(v)
}

/** ErrorDeliv a 400; lo demas a 503 generico con el detalle solo en el log. */
export function responderError(e: unknown, ambito: string): Response {
  const r = errorARespuesta(e)
  if (r.log) console.error(`[deliv_r:${ambito}]`, r.log)
  return json(r.cuerpo, r.status)
}
