import type { SupabaseClient } from '@supabase/supabase-js'

import { claveStorage, rutaDesdeClave } from './clave-storage.ts'
import { mapConLimite } from './concurrencia.ts'
import { carpetaPortadas, rutaPortada } from './portada.ts'
import type { RepoDeliv } from './repo.ts'
import { rutaArchivoSegura, tipoMime } from './subida.ts'
import type { Acceso, Artefacto, EstadoArtefacto, TipoArtefacto, UsuarioCliente } from './tipos.ts'

/*
 * RepoDeliv sobre Supabase. Sin secretos: recibe el cliente. Con la sesion del
 * equipo (supabaseAuthServer()) sirve para artefactos, accesos y Storage; las
 * funciones de usuario piden la columna `hash`, que `authenticated` no puede
 * leer ni escribir (migracion 20261118120000), asi que con esa sesion FALLAN
 * con error de permiso a proposito: lo que toca usuarios va por la service
 * role (servidor.ts, en esta carpeta). Fallar es mejor que devolver hash null y dar a
 * todo el mundo por desactivado.
 */

// ── Filas y mapeo ────────────────────────────────────────────────────────────

export interface FilaArtefacto {
  id: string
  public_id: string
  cliente: string
  cliente_nombre: string
  titulo: string
  tipo: string
  entrada: string
  version: number
  estado: string
  avisos: string[] | null
  creado_por: string
  publicado_en: string | null
  created_at: string
}

export interface FilaUsuario {
  email: string
  hash: string | null
  creado_por: string
  credenciales_en: string
  fallos: number
  bloqueado_hasta: string | null
  created_at: string
}

export interface FilaAcceso {
  artefacto_id: string
  email: string
  concedido_por: string
  concedido_en: string
  ultimo_acceso: string | null
}

export const COLUMNAS_ARTEFACTO =
  'id,public_id,cliente,cliente_nombre,titulo,tipo,entrada,version,estado,avisos,creado_por,publicado_en,created_at'
export const COLUMNAS_USUARIO = 'email,hash,creado_por,credenciales_en,fallos,bloqueado_hasta,created_at'
export const COLUMNAS_ACCESO = 'artefacto_id,email,concedido_por,concedido_en,ultimo_acceso'

/** Postgres devuelve `2026-11-18T12:00:00.123456+00:00`; el resto del codigo usa toISOString(). */
export function iso(v: string): string
export function iso(v: string | null): string | null
export function iso(v: string | null): string | null {
  if (v === null) return null
  const ms = Date.parse(v)
  if (Number.isNaN(ms)) throw new Error(`deliv_r: fecha no valida: ${v}`)
  return new Date(ms).toISOString()
}

export function artefactoDesdeFila(f: FilaArtefacto): Artefacto {
  return {
    id: f.id,
    publicId: f.public_id,
    cliente: f.cliente,
    clienteNombre: f.cliente_nombre,
    titulo: f.titulo,
    tipo: f.tipo as TipoArtefacto,
    entrada: f.entrada,
    version: f.version,
    estado: f.estado as EstadoArtefacto,
    avisos: [...(f.avisos ?? [])],
    creadoPor: f.creado_por,
    creadoEn: iso(f.created_at),
    publicadoEn: iso(f.publicado_en),
  }
}

export function filaDesdeArtefacto(a: Artefacto): FilaArtefacto {
  return {
    id: a.id,
    public_id: a.publicId,
    cliente: a.cliente,
    cliente_nombre: a.clienteNombre,
    titulo: a.titulo,
    tipo: a.tipo,
    entrada: a.entrada,
    version: a.version,
    estado: a.estado,
    avisos: [...a.avisos],
    creado_por: a.creadoPor,
    publicado_en: a.publicadoEn,
    created_at: a.creadoEn,
  }
}

export function usuarioDesdeFila(f: FilaUsuario): UsuarioCliente {
  return {
    email: f.email,
    hash: f.hash,
    creadoPor: f.creado_por,
    creadoEn: iso(f.created_at),
    credencialesEn: iso(f.credenciales_en),
    fallos: f.fallos,
    bloqueadoHasta: iso(f.bloqueado_hasta),
  }
}

export function filaDesdeUsuario(u: UsuarioCliente): FilaUsuario {
  return {
    email: u.email,
    hash: u.hash,
    creado_por: u.creadoPor,
    credenciales_en: u.credencialesEn,
    fallos: u.fallos,
    bloqueado_hasta: u.bloqueadoHasta,
    created_at: u.creadoEn,
  }
}

export function accesoDesdeFila(f: FilaAcceso): Acceso {
  return {
    artefactoId: f.artefacto_id,
    email: f.email,
    concedidoPor: f.concedido_por,
    concedidoEn: iso(f.concedido_en),
    ultimoAcceso: iso(f.ultimo_acceso),
  }
}

export function filaDesdeAcceso(a: Acceso): FilaAcceso {
  return {
    artefacto_id: a.artefactoId,
    email: a.email,
    concedido_por: a.concedidoPor,
    concedido_en: a.concedidoEn,
    ultimo_acceso: a.ultimoAcceso,
  }
}

/** El mismo orden que repo-memoria: cliente A-Z, mas reciente primero. En JS, no por la collation de Postgres. */
export function ordenarArtefactos(lista: Artefacto[]): Artefacto[] {
  return [...lista].sort(
    (x, y) =>
      x.cliente.localeCompare(y.cliente) ||
      (x.creadoEn < y.creadoEn ? 1 : x.creadoEn > y.creadoEn ? -1 : 0),
  )
}

function fallo(scope: string, e: { message: string; code?: string }): Error {
  return new Error(`deliv_r ${scope}: ${e.code ?? '-'} ${e.message}`)
}

// ── Repositorio ──────────────────────────────────────────────────────────────

export function crearRepoSupabase(sb: SupabaseClient): RepoDeliv {
  const artefactos = () => sb.from('deliv_artefactos')
  const usuarios = () => sb.from('deliv_usuarios')
  const accesos = () => sb.from('deliv_accesos')

  return {
    async leerArtefacto(id) {
      const { data, error } = await artefactos().select(COLUMNAS_ARTEFACTO).eq('id', id).maybeSingle()
      if (error) throw fallo('leerArtefacto', error)
      return data ? artefactoDesdeFila(data as FilaArtefacto) : null
    },
    async leerArtefactoPublico(publicId) {
      const { data, error } = await artefactos().select(COLUMNAS_ARTEFACTO).eq('public_id', publicId).maybeSingle()
      if (error) throw fallo('leerArtefactoPublico', error)
      return data ? artefactoDesdeFila(data as FilaArtefacto) : null
    },
    async listarArtefactos() {
      // Sin paginar: PostgREST corta en max_rows (1000 por defecto). A la escala actual no se llega.
      const { data, error } = await artefactos().select(COLUMNAS_ARTEFACTO)
      if (error) throw fallo('listarArtefactos', error)
      return ordenarArtefactos((data as FilaArtefacto[]).map(artefactoDesdeFila))
    },
    async guardarArtefacto(a) {
      const { error } = await artefactos().upsert(filaDesdeArtefacto(a), { onConflict: 'id' })
      if (error) throw fallo('guardarArtefacto', error)
    },
    async renombrarArtefacto(id, titulo) {
      // Solo la columna titulo: no pisa una publicacion que llegue a la vez (guardarArtefacto es un upsert entero).
      const { data, error } = await artefactos().update({ titulo }).eq('id', id).select('id')
      if (error) throw fallo('renombrarArtefacto', error)
      return (data ?? []).length > 0
    },
    async borrarArtefacto(id) {
      // deliv_accesos.artefacto_id es `on delete cascade`.
      const { error } = await artefactos().delete().eq('id', id)
      if (error) throw fallo('borrarArtefacto', error)
    },
    async leerUsuario(email) {
      const { data, error } = await usuarios().select(COLUMNAS_USUARIO).eq('email', email).maybeSingle()
      if (error) throw fallo('leerUsuario', error)
      return data ? usuarioDesdeFila(data as FilaUsuario) : null
    },
    async listarUsuarios() {
      // Sin paginar: PostgREST corta en max_rows (1000 por defecto). A la escala actual no se llega.
      const { data, error } = await usuarios().select(COLUMNAS_USUARIO).order('email')
      if (error) throw fallo('listarUsuarios', error)
      return (data as FilaUsuario[]).map(usuarioDesdeFila)
    },
    async guardarUsuario(u) {
      const { error } = await usuarios().upsert(filaDesdeUsuario(u), { onConflict: 'email' })
      if (error) throw fallo('guardarUsuario', error)
    },
    async leerAcceso(artefactoId, email) {
      const { data, error } = await accesos()
        .select(COLUMNAS_ACCESO)
        .eq('artefacto_id', artefactoId)
        .eq('email', email)
        .maybeSingle()
      if (error) throw fallo('leerAcceso', error)
      return data ? accesoDesdeFila(data as FilaAcceso) : null
    },
    async accesosDeArtefacto(artefactoId) {
      // Sin paginar: PostgREST corta en max_rows (1000 por defecto). A la escala actual no se llega.
      const { data, error } = await accesos().select(COLUMNAS_ACCESO).eq('artefacto_id', artefactoId)
      if (error) throw fallo('accesosDeArtefacto', error)
      return (data as FilaAcceso[]).map(accesoDesdeFila)
    },
    async accesosDeUsuario(email) {
      // Sin paginar: PostgREST corta en max_rows (1000 por defecto). A la escala actual no se llega.
      const { data, error } = await accesos().select(COLUMNAS_ACCESO).eq('email', email)
      if (error) throw fallo('accesosDeUsuario', error)
      return (data as FilaAcceso[]).map(accesoDesdeFila)
    },
    async concederAcceso(a) {
      // ON CONFLICT DO NOTHING: no pisa concedido_por / concedido_en.
      const { error } = await accesos().upsert(filaDesdeAcceso(a), {
        onConflict: 'artefacto_id,email',
        ignoreDuplicates: true,
      })
      if (error) throw fallo('concederAcceso', error)
    },
    async revocarAcceso(artefactoId, email) {
      const { data, error } = await accesos()
        .delete()
        .eq('artefacto_id', artefactoId)
        .eq('email', email)
        .select('artefacto_id')
      if (error) throw fallo('revocarAcceso', error)
      return (data ?? []).length > 0
    },
    async registrarUltimoAcceso(artefactoId, email, en) {
      const { error } = await accesos()
        .update({ ultimo_acceso: en })
        .eq('artefacto_id', artefactoId)
        .eq('email', email)
      if (error) throw fallo('registrarUltimoAcceso', error)
    },
  }
}

// ── Storage ──────────────────────────────────────────────────────────────────

export const BUCKET = 'deliv-r'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const LOTE = 1000

/**
 * Prefijo `<uuid>/` del artefacto. Valida el id porque un id vacio haria que
 * borrarTodo() listara y borrase el bucket entero.
 */
export function prefijoArtefacto(id: string): string {
  if (!UUID.test(id)) throw new Error('deliv_r: id de artefacto no valido')
  return `${id}/`
}

export function prefijoVersion(id: string, version: number): string {
  if (!Number.isInteger(version) || version < 1) throw new Error('deliv_r: version no valida')
  return `${prefijoArtefacto(id)}v${version}/`
}

/** `<uuid>/v<version>/<clave>`: ruta validada como en la subida y codificada con claveStorage(). */
export function rutaObjeto(id: string, version: number, ruta: string): string {
  const segura = rutaArchivoSegura(ruta)
  if (!segura) throw new Error('deliv_r: ruta no valida')
  return prefijoVersion(id, version) + claveStorage(segura)
}

/** Todas las rutas de objeto bajo `prefijo` (que acaba en '/'), recorriendo subcarpetas. */
async function listarRecursivo(sb: SupabaseClient, prefijo: string): Promise<string[]> {
  const out: string[] = []
  const carpeta = prefijo.slice(0, -1)
  for (let offset = 0; ; offset += LOTE) {
    const { data, error } = await sb.storage.from(BUCKET).list(carpeta, { limit: LOTE, offset })
    if (error) throw fallo('storage.list', error)
    for (const e of data) {
      // Las carpetas vienen sin id.
      if (e.id) out.push(prefijo + e.name)
      else out.push(...(await listarRecursivo(sb, `${prefijo}${e.name}/`)))
    }
    if (data.length < LOTE) return out
  }
}

async function borrarRutas(sb: SupabaseClient, rutas: string[]): Promise<void> {
  for (let i = 0; i < rutas.length; i += LOTE) {
    const { error } = await sb.storage.from(BUCKET).remove(rutas.slice(i, i + LOTE))
    if (error) throw fallo('storage.remove', error)
  }
}

/** Peticiones a Storage en vuelo a la vez (URL firmadas, lecturas para los avisos). */
export const CONCURRENCIA_STORAGE = 8

export async function urlsDeSubida(
  sb: SupabaseClient,
  id: string,
  version: number,
  rutas: string[],
): Promise<{ ruta: string; url: string; token: string }[]> {
  // De 8 en 8 y en el orden de `rutas`: en serie, un ZIP grande se pasa del limite de Netlify.
  return mapConLimite(rutas, CONCURRENCIA_STORAGE, async (ruta) => {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(rutaObjeto(id, version, ruta))
    if (error) throw fallo('storage.createSignedUploadUrl', error)
    return { ruta, url: data.signedUrl, token: data.token }
  })
}

/** Rutas relativas a `<id>/v<version>/` que ya estan en el bucket. */
export async function archivosSubidos(sb: SupabaseClient, id: string, version: number): Promise<Set<string>> {
  const prefijo = prefijoVersion(id, version)
  return new Set((await listarRecursivo(sb, prefijo)).map((r) => rutaDesdeClave(r.slice(prefijo.length))))
}

/**
 * El objeto no existe. Storage lo dice de dos formas segun version: HTTP 404, o
 * HTTP 400 con `statusCode: '404'` y «Object not found». Todo lo demas (red,
 * permisos, 5xx) NO es «no existe» y tiene que fallar, no servirse como 404.
 */
export function esNoEncontrado(e: { message?: string; status?: number; statusCode?: string }): boolean {
  if (e.status === 404) return true
  if (e.statusCode === '404' || e.statusCode === 'not_found' || e.statusCode === 'NoSuchKey') return true
  return /object not found/i.test(e.message ?? '')
}

/** null solo si no existe; cualquier otro error lanza. El tipo MIME sale de la extension, no de lo que dijo quien subio. */
export async function descargar(
  sb: SupabaseClient,
  id: string,
  version: number,
  ruta: string,
): Promise<{ datos: ArrayBuffer; tipoMime: string } | null> {
  const { data, error } = await sb.storage.from(BUCKET).download(rutaObjeto(id, version, ruta))
  if (error) {
    if (esNoEncontrado(error)) return null
    throw fallo('storage.download', error)
  }
  return { datos: await data.arrayBuffer(), tipoMime: tipoMime(ruta) }
}

/**
 * URL firmada de Storage para un archivo del artefacto, o null si no existe. Con `descargar`, Storage
 * responde con Content-Disposition: attachment y ese nombre. Caduca a los 15 min, como el token de
 * archivo que la autoriza.
 */
export async function urlFirmada(
  sb: SupabaseClient,
  id: string,
  version: number,
  ruta: string,
  descargar: string | null,
): Promise<string | null> {
  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(rutaObjeto(id, version, ruta), 15 * 60, descargar ? { download: descargar } : undefined)
  if (error) {
    if (esNoEncontrado(error)) return null
    throw fallo('storage.createSignedUrl', error)
  }
  return data.signedUrl
}

export async function leerTexto(sb: SupabaseClient, id: string, version: number, ruta: string): Promise<string | null> {
  const d = await descargar(sb, id, version, ruta)
  return d ? new TextDecoder().decode(d.datos) : null
}

export async function borrarVersion(sb: SupabaseClient, id: string, version: number): Promise<void> {
  await borrarRutas(sb, await listarRecursivo(sb, prefijoVersion(id, version)))
}

export async function borrarTodo(sb: SupabaseClient, id: string): Promise<void> {
  await borrarRutas(sb, await listarRecursivo(sb, prefijoArtefacto(id)))
}

/**
 * URL firmada (1 h) de la portada de la versión actual de cada artefacto que la tenga. Una
 * consulta de listado por artefacto, de 8 en 8.
 */
export async function urlsDePortadas(
  sb: SupabaseClient,
  artefactos: { id: string; version: number }[],
): Promise<Map<string, string>> {
  const conPortada = (
    await mapConLimite(artefactos, CONCURRENCIA_STORAGE, async (a) => {
      const { data, error } = await sb.storage.from(BUCKET).list(carpetaPortadas(a.id), { limit: 100 })
      if (error) throw fallo('storage.list portadas', error)
      return data.some((e) => e.name === `v${a.version}.jpg`) ? a : null
    })
  ).filter((a): a is { id: string; version: number } => a !== null)
  const out = new Map<string, string>()
  if (!conPortada.length) return out
  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUrls(conPortada.map((a) => rutaPortada(a.id, a.version)), 60 * 60)
  if (error) throw fallo('storage.createSignedUrls portadas', error)
  data.forEach((d, i) => { if (d.signedUrl) out.set(conPortada[i].id, d.signedUrl) })
  return out
}

/**
 * Guarda la portada de una versión y borra las de versiones anteriores. El equipo no tiene
 * política de UPDATE en el bucket (solo insert, select y delete): por eso se borra antes de subir
 * en lugar de un upsert.
 */
export async function guardarPortada(
  sb: SupabaseClient,
  id: string,
  version: number,
  jpeg: Uint8Array,
): Promise<void> {
  const { data, error } = await sb.storage.from(BUCKET).list(carpetaPortadas(id), { limit: 100 })
  if (error) throw fallo('storage.list portadas', error)
  const previas = data.filter((e) => e.id).map((e) => `${carpetaPortadas(id)}/${e.name}`)
  if (previas.length) await borrarRutas(sb, previas)
  const { error: e2 } = await sb.storage
    .from(BUCKET)
    .upload(rutaPortada(id, version), jpeg, { contentType: 'image/jpeg', upsert: false })
  // Otra persona del equipo la ha subido a la vez: ya está, vale igual.
  if (e2 && !/already exists|duplicate/i.test(e2.message)) throw fallo('storage.upload portada', e2)
}
