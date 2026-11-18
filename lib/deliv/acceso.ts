import type { RepoDeliv } from './repo.ts'
import { leerTokenSesion } from './session.ts'
import type { Artefacto, UsuarioCliente } from './tipos.ts'

/**
 * Se llama en CADA peticion: ademas de la firma, comprueba que el usuario
 * existe, esta activo y que la sesion es posterior a su ultima regeneracion
 * de contrasena. Revocar o regenerar surte efecto al momento.
 */
export async function clienteDeSesion(
  repo: RepoDeliv,
  token: string | undefined,
  ahora: number,
  secreto: string,
): Promise<UsuarioCliente | null> {
  const sesion = leerTokenSesion(token, ahora, secreto)
  if (!sesion) return null
  const usuario = await repo.leerUsuario(sesion.email)
  if (!usuario || !usuario.hash) return null
  if (sesion.emitidaEn < Date.parse(usuario.credencialesEn)) return null
  return usuario
}

export async function puedeVerCliente(
  repo: RepoDeliv,
  email: string,
  artefacto: Artefacto,
): Promise<boolean> {
  if (artefacto.estado !== 'publicado') return false
  return (await repo.leerAcceso(artefacto.id, email)) !== null
}
