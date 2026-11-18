import { claveStorage } from './clave-storage.ts'
import { SLUGS_RESERVADOS, slugDesdeNombre, validarSlugCliente } from './slug.ts'

const MB = 1024 * 1024

/** `3,1 MB`, `120 KB`, `0 KB`: el peso como lo lee una persona. */
export function pesoLegible(bytes: number): string {
  if (bytes >= MB / 10) return `${(bytes / MB).toFixed(1).replace('.', ',')} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export interface ClienteExistente {
  slug: string
  nombre: string
}

export interface InfoCliente {
  /** Texto tal cual lo escribió la persona, recortado. */
  crudo: string
  slug: string
  /** Motivo por el que el slug no sirve, o null. */
  error: string | null
  /** El slug es un nombre reservado de la zona de clientes. */
  reservado: boolean
  existente: ClienteExistente | null
  /** Nombre que se envía: el del cliente existente si lo hay. */
  nombre: string
  /** Clientes existentes que encajan con lo escrito (sin el ya elegido). */
  sugerencias: ClienteExistente[]
}

function plegar(t: string): string {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function infoCliente(texto: string, existentes: ClienteExistente[]): InfoCliente {
  const crudo = texto.trim()
  const slug = slugDesdeNombre(crudo)
  const error = crudo && !slug ? 'Escribe un nombre con letras o números.' : slug ? validarSlugCliente(slug) : null
  const existente = existentes.find((c) => c.slug === slug) ?? null
  const q = plegar(crudo)
  const sugerencias = existentes.filter(
    (c) => c.slug !== slug && (!crudo || plegar(c.nombre).includes(q) || c.slug.includes(slug)),
  )
  const reservado = (SLUGS_RESERVADOS as readonly string[]).includes(slug)
  return { crudo, slug, error, reservado, existente, nombre: existente ? existente.nombre : crudo, sugerencias }
}

/** Clave del objeto en el bucket: `<id>/v<version>/<clave>` (espejo de rutaObjeto del servidor). */
export function rutaEnBucket(id: string, version: number, ruta: string): string {
  return `${id}/v${version}/${claveStorage(ruta)}`
}

/** Rutas que aún no se han subido, en el orden original. */
export function pendientes(rutas: string[], hechas: ReadonlySet<string>): string[] {
  return rutas.filter((r) => !hechas.has(r))
}

/** Qué se ha hecho con un archivo, a partir de su fila de peso. */
export function tratamiento(f: { ruta: string; original: number; final: number }): string {
  const m = /\.([^./]+)$/.exec(f.ruta)
  const ext = m ? m[1].toLowerCase() : ''
  if (f.final < f.original) {
    if (ext === 'html' || ext === 'htm') return 'imágenes incrustadas extraídas'
    if (ext === 'webp') return 'WebP'
    return ''
  }
  if (['pdf', 'mp4', 'webm', 'mp3', 'm4a'].includes(ext)) return 'sin recompresión'
  return ''
}
