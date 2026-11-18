import { DelivNoDisponible } from './config.ts'
import { ErrorDeliv } from './operaciones.ts'
import { LIMITE_TOTAL, rutaArchivoSegura } from './subida.ts'
import type { Artefacto, TipoArtefacto } from './tipos.ts'

/*
 * Piezas puras de las APIs del equipo (sin next ni supabase, para poder
 * probarlas con node:test). El helper con la sesion esta en api.ts.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_ARCHIVOS = 2000
const MAX_TEXTO = 200

export const MENSAJE_NO_DISPONIBLE = 'Servicio no disponible.'

export interface RespuestaError {
  status: number
  cuerpo: { ok: false; mensaje: string }
  /** Solo se registra en el servidor; nunca viaja al cliente. */
  log: unknown
}

/** ErrorDeliv es 400 con su mensaje; todo lo demas es 503 generico. */
export function errorARespuesta(e: unknown): RespuestaError {
  if (e instanceof ErrorDeliv) {
    return { status: 400, cuerpo: { ok: false, mensaje: e.message }, log: null }
  }
  return {
    status: 503,
    cuerpo: { ok: false, mensaje: MENSAJE_NO_DISPONIBLE },
    log: e instanceof DelivNoDisponible ? e.message : e,
  }
}

export function esUuid(id: string): boolean {
  return UUID.test(id)
}

export function validarId(id: string): string {
  if (!esUuid(id)) throw new ErrorDeliv('El identificador no es válido.')
  return id
}

export function decodificarParametro(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    throw new ErrorDeliv('La dirección no es válida.')
  }
}

/** El cuerpo ha de ser un objeto JSON. */
export function objetoJson(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    throw new ErrorDeliv('La petición no es válida.')
  }
  return v as Record<string, unknown>
}

export function texto(v: unknown, campo: string, opcional = false): string | undefined {
  if (v === undefined || v === null || v === '') {
    if (opcional) return undefined
    throw new ErrorDeliv(`Falta ${campo}.`)
  }
  if (typeof v !== 'string' || !v.trim() || v.length > MAX_TEXTO || /[\x00-\x1f]/.test(v)) {
    throw new ErrorDeliv(`${campo[0].toUpperCase()}${campo.slice(1)} no es válido.`)
  }
  return v
}

export function tipoValido(v: unknown): TipoArtefacto {
  if (v !== 'html' && v !== 'pdf') throw new ErrorDeliv('El tipo debe ser html o pdf.')
  return v
}

/**
 * `rutas` (cada una por rutaArchivoSegura, sin repetidas) y, si llegan,
 * `tamanos` en paralelo con el total dentro de LIMITE_TOTAL.
 */
export function validarRutas(rutas: unknown, tamanos?: unknown): string[] {
  if (!Array.isArray(rutas) || !rutas.length) throw new ErrorDeliv('Faltan los archivos.')
  if (rutas.length > MAX_ARCHIVOS) throw new ErrorDeliv('Hay demasiados archivos.')
  const vistas = new Set<string>()
  for (const r of rutas) {
    if (typeof r !== 'string' || !rutaArchivoSegura(r)) throw new ErrorDeliv('Hay una ruta de archivo no válida.')
    if (vistas.has(r)) throw new ErrorDeliv('Hay rutas de archivo repetidas.')
    vistas.add(r)
  }
  if (tamanos !== undefined) {
    if (!Array.isArray(tamanos) || tamanos.length !== rutas.length) throw new ErrorDeliv('Los tamaños no coinciden con los archivos.')
    let total = 0
    for (const t of tamanos) {
      if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) throw new ErrorDeliv('Hay un tamaño no válido.')
      total += t
    }
    if (total > LIMITE_TOTAL) throw new ErrorDeliv('El contenido supera el límite de 100 MB por artefacto.')
  }
  return rutas as string[]
}

export function validarEntrada(entrada: unknown, rutas: string[]): string {
  if (typeof entrada !== 'string' || !rutas.includes(entrada)) {
    throw new ErrorDeliv('El archivo de entrada no está entre los archivos.')
  }
  return entrada
}

export function validarVersion(v: unknown): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) throw new ErrorDeliv('La versión no es válida.')
  return v
}

/** Lo declarado que aun no esta en el bucket. */
export function faltantes(rutas: string[], subidas: Set<string>): string[] {
  return rutas.filter((r) => !subidas.has(r))
}

export function enlaceDe(a: { cliente: string; publicId: string }): string {
  return `/clientes/${a.cliente}/${a.publicId}`
}

export type DecisionPublicar =
  | { accion: 'rechazar'; mensaje: string }
  | { accion: 'faltan'; faltan: string[] }
  | { accion: 'confirmar'; avisos: string[] }
  | {
      accion: 'publicar'
      version: number
      tipo: TipoArtefacto
      entrada: string
      avisos: string[]
      /** Solo en un reemplazo: se borra despues de guardar. */
      versionAnteriorABorrar?: number
    }

/**
 * Decide que hacer con una peticion de publicar, sin IO. `leerAvisos` recibe
 * TODOS los archivos presentes en el prefijo de la version (no solo los
 * declarados) y devuelve los avisos; solo se llama si todo lo declarado esta.
 */
export async function decidirPublicacion(d: {
  ficha: Artefacto
  version: number
  rutas: string[]
  subidos: Set<string>
  tipo?: TipoArtefacto
  entrada?: string
  aceptarAvisos: boolean
  leerAvisos: (presentes: string[]) => Promise<string[]>
}): Promise<DecisionPublicar> {
  const { ficha, version } = d
  const nueva = ficha.estado === 'publicado' && version === ficha.version + 1
  const primera = ficha.estado === 'subiendo' && version === ficha.version
  if (!nueva && !primera) {
    const mensaje =
      ficha.estado === 'publicado' && version <= ficha.version
        ? 'Esa versión ya está publicada.'
        : 'Esa versión no se puede publicar.'
    return { accion: 'rechazar', mensaje }
  }
  const tipo = nueva ? d.tipo : ficha.tipo
  if (tipo !== 'html' && tipo !== 'pdf') return { accion: 'rechazar', mensaje: 'El tipo debe ser html o pdf.' }
  const entrada = nueva ? d.entrada : ficha.entrada
  if (typeof entrada !== 'string' || !d.rutas.includes(entrada)) {
    return { accion: 'rechazar', mensaje: 'El archivo de entrada no está entre los archivos.' }
  }
  const faltan = faltantes(d.rutas, d.subidos)
  if (faltan.length) return { accion: 'faltan', faltan }
  const avisos = await d.leerAvisos([...d.subidos])
  if (avisos.length && !d.aceptarAvisos) return { accion: 'confirmar', avisos }
  return {
    accion: 'publicar',
    version,
    tipo,
    entrada,
    avisos,
    ...(nueva ? { versionAnteriorABorrar: ficha.version } : {}),
  }
}
