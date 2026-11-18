import { normalizarEmail } from './ids.ts'
import { HASH_FICTICIO, verificarPassword } from './passwords.ts'
import type { RepoDeliv } from './repo.ts'
import type { UsuarioCliente } from './tipos.ts'

export const MAX_FALLOS = 5
export const BLOQUEO_MS = 15 * 60 * 1000

export type ResultadoLogin =
  | { ok: true; usuario: UsuarioCliente }
  | { ok: false; motivo: 'credenciales' | 'bloqueado' }

export async function autenticar(
  repo: RepoDeliv,
  email: string,
  password: string,
  ahora: number,
  verificar: (pw: string, hash: string) => Promise<boolean> = verificarPassword,
): Promise<ResultadoLogin> {
  const usuario = await repo.leerUsuario(normalizarEmail(email))

  if (!usuario || !usuario.hash) {
    // Mismo coste que una verificacion real: no revelar si el usuario existe.
    await verificar(password, HASH_FICTICIO)
    return { ok: false, motivo: 'credenciales' }
  }

  if (usuario.bloqueadoHasta && Date.parse(usuario.bloqueadoHasta) > ahora) {
    // La cuenta bloqueada no responde mas deprisa que un correo desconocido.
    await verificar(password, HASH_FICTICIO)
    return { ok: false, motivo: 'bloqueado' }
  }

  if (!(await verificar(password, usuario.hash))) {
    const fallos = usuario.fallos + 1
    const bloquear = fallos >= MAX_FALLOS
    await repo.guardarUsuario({
      ...usuario,
      fallos: bloquear ? 0 : fallos,
      bloqueadoHasta: bloquear ? new Date(ahora + BLOQUEO_MS).toISOString() : null,
    })
    return { ok: false, motivo: bloquear ? 'bloqueado' : 'credenciales' }
  }

  if (usuario.fallos !== 0 || usuario.bloqueadoHasta) {
    await repo.guardarUsuario({ ...usuario, fallos: 0, bloqueadoHasta: null })
  }
  return { ok: true, usuario: { ...usuario, fallos: 0, bloqueadoHasta: null } }
}
