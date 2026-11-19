import { randomUUID } from 'node:crypto'

import {
  esEmailValido,
  idAleatorio,
  normalizarEmail,
  slugDesdeNombre,
  validarSlugCliente,
} from './ids.ts'
import { generarPassword, hashPassword } from './passwords.ts'
import type { RepoDeliv } from './repo.ts'
import type { Acceso, Artefacto, TipoArtefacto } from './tipos.ts'

export class ErrorDeliv extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorDeliv'
  }
}

const iso = (ms: number) => new Date(ms).toISOString()

async function artefactoExistente(repo: RepoDeliv, id: string): Promise<Artefacto> {
  const a = await repo.leerArtefacto(id)
  if (!a) throw new ErrorDeliv('El artefacto no existe.')
  return a
}

async function publicIdLibre(repo: RepoDeliv): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const p = idAleatorio(10)
    if (!(await repo.leerArtefactoPublico(p))) return p
  }
  throw new ErrorDeliv('No se pudo generar un identificador único.')
}

export async function crearBorrador(
  repo: RepoDeliv,
  d: { clienteNombre: string; cliente?: string; titulo: string; tipo: TipoArtefacto; entrada: string },
  equipo: string,
  ahora: number,
): Promise<Artefacto> {
  const slug = d.cliente ?? slugDesdeNombre(d.clienteNombre)
  const motivo = validarSlugCliente(slug)
  if (motivo) throw new ErrorDeliv(motivo)
  const a: Artefacto = {
    id: randomUUID(),
    publicId: await publicIdLibre(repo),
    cliente: slug,
    clienteNombre: d.clienteNombre.trim(),
    titulo: d.titulo.trim(),
    tipo: d.tipo,
    entrada: d.entrada,
    version: 1,
    estado: 'subiendo',
    avisos: [],
    creadoPor: equipo,
    creadoEn: iso(ahora),
    publicadoEn: null,
  }
  await repo.guardarArtefacto(a)
  return a
}

/** No guarda: la version solo cambia al publicar. */
export async function nuevaVersion(
  repo: RepoDeliv,
  id: string,
  d: { tipo: TipoArtefacto; entrada: string },
  _equipo: string,
  _ahora: number,
): Promise<{ artefacto: Artefacto; versionAnterior: number }> {
  const a = await artefactoExistente(repo, id)
  return {
    artefacto: { ...a, tipo: d.tipo, entrada: d.entrada, version: a.version + 1 },
    versionAnterior: a.version,
  }
}

export async function publicar(
  repo: RepoDeliv,
  id: string,
  d: { version: number; avisos: string[]; tipo?: TipoArtefacto; entrada?: string },
  ahora: number,
): Promise<Artefacto> {
  const a = await artefactoExistente(repo, id)
  const p: Artefacto = {
    ...a,
    version: d.version,
    avisos: [...d.avisos],
    estado: 'publicado',
    publicadoEn: iso(ahora),
    ...(d.tipo ? { tipo: d.tipo } : {}),
    ...(d.entrada ? { entrada: d.entrada } : {}),
  }
  await repo.guardarArtefacto(p)
  return p
}

/** Cambia el titulo. No toca enlace, version ni accesos. */
export async function renombrar(repo: RepoDeliv, id: string, tituloBruto: string): Promise<string> {
  const titulo = tituloBruto.trim()
  if (!titulo) throw new ErrorDeliv('El título no puede quedar vacío.')
  if (!(await repo.renombrarArtefacto(id, titulo))) throw new ErrorDeliv('El artefacto no existe.')
  return titulo
}

export async function borrar(repo: RepoDeliv, id: string): Promise<void> {
  await repo.borrarArtefacto(id)
}

export async function darAcceso(
  repo: RepoDeliv,
  id: string,
  emailBruto: string,
  equipo: string,
  ahora: number,
): Promise<{ email: string; nuevo: boolean; password: string | null }> {
  const a = await artefactoExistente(repo, id)
  if (a.estado !== 'publicado') {
    throw new ErrorDeliv('El artefacto aún no está publicado.')
  }
  const email = normalizarEmail(emailBruto)
  if (!esEmailValido(email)) throw new ErrorDeliv('El correo no es válido.')

  const existente = await repo.leerUsuario(email)
  if (existente && !existente.hash) {
    throw new ErrorDeliv('Usuario desactivado. Reactívalo antes de darle acceso.')
  }

  let password: string | null = null
  if (!existente) {
    password = generarPassword()
    await repo.guardarUsuario({
      email,
      hash: await hashPassword(password),
      creadoPor: equipo,
      creadoEn: iso(ahora),
      credencialesEn: iso(ahora),
      fallos: 0,
      bloqueadoHasta: null,
    })
  }
  await repo.concederAcceso({
    artefactoId: id,
    email,
    concedidoPor: equipo,
    concedidoEn: iso(ahora),
    ultimoAcceso: null,
  })
  return { email, nuevo: !existente, password }
}

export async function revocar(repo: RepoDeliv, id: string, email: string): Promise<boolean> {
  return repo.revocarAcceso(id, normalizarEmail(email))
}

async function usuarioExistente(repo: RepoDeliv, emailBruto: string) {
  const u = await repo.leerUsuario(normalizarEmail(emailBruto))
  if (!u) throw new ErrorDeliv('La persona no existe.')
  return u
}

export async function regenerarPassword(
  repo: RepoDeliv,
  email: string,
  ahora: number,
): Promise<string> {
  const u = await usuarioExistente(repo, email)
  if (!u.hash) throw new ErrorDeliv('Usuario desactivado. Reactívalo primero.')
  return nuevaCredencial(repo, u, ahora)
}

async function nuevaCredencial(
  repo: RepoDeliv,
  u: NonNullable<Awaited<ReturnType<RepoDeliv['leerUsuario']>>>,
  ahora: number,
): Promise<string> {
  const password = generarPassword()
  await repo.guardarUsuario({
    ...u,
    hash: await hashPassword(password),
    credencialesEn: iso(ahora),
    fallos: 0,
    bloqueadoHasta: null,
  })
  return password
}

export async function desactivar(repo: RepoDeliv, email: string, ahora: number): Promise<void> {
  const u = await usuarioExistente(repo, email)
  await repo.guardarUsuario({ ...u, hash: null, credencialesEn: iso(ahora) })
}

export async function artefactosQueRecupera(
  repo: RepoDeliv,
  email: string,
): Promise<Artefacto[]> {
  await usuarioExistente(repo, email)
  const accesos = await repo.accesosDeUsuario(normalizarEmail(email))
  const out: Artefacto[] = []
  for (const ac of accesos) {
    const a = await repo.leerArtefacto(ac.artefactoId)
    if (a) out.push(a)
  }
  return out
}

export async function reactivar(repo: RepoDeliv, email: string, ahora: number): Promise<string> {
  const u = await usuarioExistente(repo, email)
  if (u.hash) {
    throw new ErrorDeliv(
      'Este usuario ya está activo. Para una contraseña nueva usa Regenerar contraseña.',
    )
  }
  return nuevaCredencial(repo, u, ahora)
}

export async function resumenEquipo(repo: RepoDeliv): Promise<{
  porCliente: {
    cliente: string
    clienteNombre: string
    artefactos: (Artefacto & { personas: number })[]
  }[]
}> {
  const porCliente: {
    cliente: string
    clienteNombre: string
    artefactos: (Artefacto & { personas: number })[]
  }[] = []
  for (const a of await repo.listarArtefactos()) {
    const personas = (await repo.accesosDeArtefacto(a.id)).length
    let grupo = porCliente.find((g) => g.cliente === a.cliente)
    if (!grupo) {
      grupo = { cliente: a.cliente, clienteNombre: a.clienteNombre, artefactos: [] }
      porCliente.push(grupo)
    }
    grupo.artefactos.push({ ...a, personas })
  }
  return { porCliente }
}

export async function fichaArtefacto(
  repo: RepoDeliv,
  id: string,
): Promise<{ artefacto: Artefacto; accesos: (Acceso & { activo: boolean })[] } | null> {
  const artefacto = await repo.leerArtefacto(id)
  if (!artefacto) return null
  const accesos: (Acceso & { activo: boolean })[] = []
  for (const ac of await repo.accesosDeArtefacto(id)) {
    const u = await repo.leerUsuario(ac.email)
    accesos.push({ ...ac, activo: !!u?.hash })
  }
  return { artefacto, accesos }
}

export async function fichaUsuarios(repo: RepoDeliv): Promise<
  {
    email: string
    activo: boolean
    artefactos: { id: string; titulo: string; ultimoAcceso: string | null }[]
  }[]
> {
  const out = []
  for (const u of await repo.listarUsuarios()) {
    const artefactos: { id: string; titulo: string; ultimoAcceso: string | null }[] = []
    for (const ac of await repo.accesosDeUsuario(u.email)) {
      const a = await repo.leerArtefacto(ac.artefactoId)
      if (a) artefactos.push({ id: a.id, titulo: a.titulo, ultimoAcceso: ac.ultimoAcceso })
    }
    out.push({ email: u.email, activo: !!u.hash, artefactos })
  }
  return out
}
