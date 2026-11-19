import type { RepoDeliv } from './repo.ts'
import type { Acceso, Artefacto, UsuarioCliente } from './tipos.ts'

const clave = (artefactoId: string, email: string) => `${artefactoId}|${email}`

function copiaArtefacto(a: Artefacto): Artefacto {
  return { ...a, avisos: [...a.avisos] }
}

export function crearRepoEnMemoria(): RepoDeliv {
  const artefactos = new Map<string, Artefacto>()
  const usuarios = new Map<string, UsuarioCliente>()
  const accesos = new Map<string, Acceso>()

  return {
    async leerArtefacto(id) {
      const a = artefactos.get(id)
      return a ? copiaArtefacto(a) : null
    },
    async leerArtefactoPublico(publicId) {
      for (const a of artefactos.values()) {
        if (a.publicId === publicId) return copiaArtefacto(a)
      }
      return null
    },
    async listarArtefactos() {
      return [...artefactos.values()]
        .sort(
          (x, y) =>
            x.cliente.localeCompare(y.cliente) ||
            (x.creadoEn < y.creadoEn ? 1 : x.creadoEn > y.creadoEn ? -1 : 0),
        )
        .map(copiaArtefacto)
    },
    async guardarArtefacto(a) {
      artefactos.set(a.id, copiaArtefacto(a))
    },
    async renombrarArtefacto(id, titulo) {
      const a = artefactos.get(id)
      if (!a) return false
      artefactos.set(id, { ...a, titulo })
      return true
    },
    async borrarArtefacto(id) {
      artefactos.delete(id)
      for (const [k, v] of accesos) if (v.artefactoId === id) accesos.delete(k)
    },
    async leerUsuario(email) {
      const u = usuarios.get(email)
      return u ? { ...u } : null
    },
    async listarUsuarios() {
      return [...usuarios.values()].map((u) => ({ ...u }))
    },
    async guardarUsuario(u) {
      usuarios.set(u.email, { ...u })
    },
    async leerAcceso(artefactoId, email) {
      const a = accesos.get(clave(artefactoId, email))
      return a ? { ...a } : null
    },
    async accesosDeArtefacto(artefactoId) {
      return [...accesos.values()].filter((a) => a.artefactoId === artefactoId).map((a) => ({ ...a }))
    },
    async accesosDeUsuario(email) {
      return [...accesos.values()].filter((a) => a.email === email).map((a) => ({ ...a }))
    },
    async concederAcceso(a) {
      const k = clave(a.artefactoId, a.email)
      if (!accesos.has(k)) accesos.set(k, { ...a })
    },
    async revocarAcceso(artefactoId, email) {
      return accesos.delete(clave(artefactoId, email))
    },
    async registrarUltimoAcceso(artefactoId, email, en) {
      const k = clave(artefactoId, email)
      const a = accesos.get(k)
      if (a) accesos.set(k, { ...a, ultimoAcceso: en })
    },
  }
}
