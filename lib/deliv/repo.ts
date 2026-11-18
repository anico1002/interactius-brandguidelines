import type { Acceso, Artefacto, UsuarioCliente } from './tipos.ts'

export interface RepoDeliv {
  /** Por uuid. */
  leerArtefacto(id: string): Promise<Artefacto | null>
  leerArtefactoPublico(publicId: string): Promise<Artefacto | null>
  /** Por cliente A-Z, mas reciente primero. */
  listarArtefactos(): Promise<Artefacto[]>
  /** Upsert. */
  guardarArtefacto(a: Artefacto): Promise<void>
  /** Borra tambien sus accesos. */
  borrarArtefacto(id: string): Promise<void>
  /** Email normalizado. */
  leerUsuario(email: string): Promise<UsuarioCliente | null>
  listarUsuarios(): Promise<UsuarioCliente[]>
  /** Upsert. */
  guardarUsuario(u: UsuarioCliente): Promise<void>
  leerAcceso(artefactoId: string, email: string): Promise<Acceso | null>
  accesosDeArtefacto(artefactoId: string): Promise<Acceso[]>
  accesosDeUsuario(email: string): Promise<Acceso[]>
  /** Inserta si no existe; no pisa concedidoPor/concedidoEn. */
  concederAcceso(a: Acceso): Promise<void>
  revocarAcceso(artefactoId: string, email: string): Promise<boolean>
  registrarUltimoAcceso(artefactoId: string, email: string, en: string): Promise<void>
}
