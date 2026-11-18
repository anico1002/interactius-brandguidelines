import { unzipSync } from 'fflate'

import type { TipoArtefacto } from './tipos.ts'

export const LIMITE_TOTAL = 100 * 1024 * 1024
/** Límite de Supabase Storage por archivo en el plan Free. Si se pasa a Pro, subirlo aquí. */
export const LIMITE_ARCHIVO = 50 * 1024 * 1024

/** Mensaje para el primer archivo que supera LIMITE_ARCHIVO, o null si todos caben. */
export function archivoDemasiadoGrande(archivos: { ruta: string; bytes: number }[]): string | null {
  const g = archivos.find((a) => a.bytes > LIMITE_ARCHIVO)
  if (!g) return null
  const mb = (g.bytes / (1024 * 1024)).toFixed(1).replace('.', ',')
  return `«${g.ruta}» pesa ${mb} MB y el límite por archivo es de 50 MB. Comprímelo o divídelo antes de subirlo.`
}

export interface ArchivoSubida {
  ruta: string
  datos: Uint8Array
  tipoMime: string
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
}

export function extension(ruta: string): string {
  const base = ruta.slice(ruta.lastIndexOf('/') + 1)
  const i = base.lastIndexOf('.')
  return i <= 0 ? '' : base.slice(i).toLowerCase()
}

/*
 * Cómo se entrega cada archivo de un artefacto HTML que no se pinta dentro de la página.
 * · 'descarga': PDF, documentos, audio. El iframe del artefacto tiene origen opaco, así que el
 *   atributo `download` del enlace no se respeta y el archivo se abriría dentro del marco. Se
 *   redirige a una URL firmada de Storage con Content-Disposition: attachment.
 * · 'directo': vídeo. Puede pasar del límite de respuesta de las funciones de Netlify (~20 MB) y
 *   necesita peticiones por rangos; se redirige a la URL firmada sin forzar la descarga.
 * · null: todo lo demás (HTML, CSS, JS, imágenes, fuentes) se sirve desde nuestro dominio.
 */
const DESCARGA = new Set(['.pdf', '.md', '.txt', '.csv', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.mp3', '.m4a', '.wav'])
const DIRECTO = new Set(['.mp4', '.webm', '.mov'])

export function entregaExterna(ruta: string): 'descarga' | 'directo' | null {
  const ext = extension(ruta)
  if (DESCARGA.has(ext)) return 'descarga'
  if (DIRECTO.has(ext)) return 'directo'
  return null
}

export function tipoMime(ruta: string): string {
  return MIME[extension(ruta)] ?? 'application/octet-stream'
}

/** Ruta relativa con '/' sin segmentos vacios, '.', '..', '\' ni caracteres de control. */
export function rutaArchivoSegura(ruta: string): string | null {
  if (!ruta || ruta.includes('\\') || /[\x00-\x1f]/.test(ruta)) return null
  const partes = ruta.split('/')
  if (partes.some((p) => !p || p === '.' || p === '..')) return null
  return ruta
}

const EXTENSIONES_TEXTO = /\.(html?|m?js|css|svg|json|txt)$/i

function mb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',')
}

function errorTotal(total: number): { ok: false; error: string } {
  return {
    ok: false,
    error: `El archivo pesa ${mb(total)} MB y el límite es ${mb(LIMITE_TOTAL)} MB por artefacto.`,
  }
}

export function clasificar(
  nombre: string,
  datos: Uint8Array,
):
  | { ok: true; tipo: TipoArtefacto; entrada: string; archivos: ArchivoSubida[] }
  | { ok: false; error: string } {
  if (datos.length > LIMITE_TOTAL) return errorTotal(datos.length)
  const base = nombre.split(/[\\/]/).pop() ?? ''
  const ext = extension(base)

  if (ext === '.html' || ext === '.htm' || ext === '.pdf') {
    const ruta = rutaArchivoSegura(base.replace(/[\x00-\x1f]/g, '').trim())
    if (!ruta) return { ok: false, error: 'El nombre del archivo no es válido.' }
    return {
      ok: true,
      tipo: ext === '.pdf' ? 'pdf' : 'html',
      entrada: ruta,
      archivos: [{ ruta, datos, tipoMime: tipoMime(ruta) }],
    }
  }

  if (ext !== '.zip') {
    return { ok: false, error: 'Solo se admiten archivos .html, .pdf o .zip.' }
  }

  let total = 0
  let excedido = false
  let crudo: Record<string, Uint8Array>
  try {
    crudo = unzipSync(datos, {
      filter(f) {
        total += f.originalSize
        if (total > LIMITE_TOTAL) excedido = true
        return !excedido
      },
    })
  } catch {
    return { ok: false, error: 'No se ha podido leer el ZIP.' }
  }
  if (excedido) return errorTotal(total)

  const entradas: { ruta: string; datos: Uint8Array }[] = []
  for (const [nombreEntrada, d] of Object.entries(crudo)) {
    if (nombreEntrada.endsWith('/')) continue
    const segmentos = nombreEntrada.split('/')
    if (segmentos[0] === '__MACOSX' || segmentos.some((s) => s.startsWith('.') && s !== '.' && s !== '..')) continue
    if (!rutaArchivoSegura(nombreEntrada)) {
      return { ok: false, error: `El ZIP contiene una ruta no válida: ${nombreEntrada}.` }
    }
    entradas.push({ ruta: nombreEntrada, datos: d })
  }

  if (entradas.length && entradas.every((e) => e.ruta.includes('/'))) {
    const raiz = entradas[0].ruta.split('/')[0]
    if (entradas.every((e) => e.ruta.split('/')[0] === raiz)) {
      for (const e of entradas) e.ruta = e.ruta.slice(raiz.length + 1)
    }
  }

  if (!entradas.some((e) => e.ruta === 'index.html')) {
    return { ok: false, error: 'El ZIP debe incluir un index.html en la raíz o en una única carpeta raíz.' }
  }
  return {
    ok: true,
    tipo: 'html',
    entrada: 'index.html',
    archivos: entradas.map((e) => ({ ruta: e.ruta, datos: e.datos, tipoMime: tipoMime(e.ruta) })),
  }
}

/** Señales de que el artefacto usa funciones que solo existen en claude.ai. */
/** Los archivos que detectarAvisos lee. */
export function esTextoEscaneable(ruta: string): boolean {
  return EXTENSIONES_TEXTO.test(ruta)
}

export function detectarAvisos(archivos: ArchivoSubida[]): string[] {
  const avisos = new Set<string>()
  const decoder = new TextDecoder()
  for (const f of archivos) {
    if (!esTextoEscaneable(f.ruta)) continue
    if (/window\.claude\b/.test(decoder.decode(f.datos))) {
      avisos.add('Usa funciones de Claude (window.claude): esas partes no funcionarán fuera de claude.ai.')
    }
  }
  return [...avisos]
}
