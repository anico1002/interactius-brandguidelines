import { extension } from './subida.ts'
import type { ArchivoSubida } from './subida.ts'

export interface FilaPeso {
  ruta: string
  original: number
  final: number
  consejo: string | null
}

export const CONSEJOS: Record<'video' | 'pdf' | 'imagen', string> = {
  video: 'Si es solo audio, expórtalo como M4A o MP3. Si es vídeo, expórtalo a 720p.',
  pdf: 'Expórtalo con la opción de reducir tamaño. En Mac: Vista Previa › Exportar › Filtro Quartz › Reducir tamaño de archivo.',
  imagen: 'Usa imágenes de 2400 px como máximo.',
}

const UMBRAL_AVISO = 5 * 1024 * 1024
const EXT_DE_MIME: Record<string, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  gif: 'gif',
  'svg+xml': 'svg',
}
const MIME_DE_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

function decodificarBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function extraerImagenesIncrustadas(
  html: string,
  inicio = 0,
  ocupados: ReadonlySet<string> = new Set(),
): { html: string; imagenes: { ruta: string; datos: Uint8Array; tipoMime: string }[] } {
  const imagenes: { ruta: string; datos: Uint8Array; tipoMime: string }[] = []
  let n = inicio
  const out = html.replace(
    /data:image\/(png|jpeg|webp|gif|svg\+xml);base64,([A-Za-z0-9+/=]+(?:\s+[A-Za-z0-9+/=]+)*)/g,
    (_m, sub: string, b64: string) => {
      let datos: Uint8Array
      try {
        datos = decodificarBase64(b64.replace(/\s+/g, ''))
      } catch {
        return _m
      }
      const ext = EXT_DE_MIME[sub]
      let ruta: string
      do {
        n++
        ruta = `assets/img-${n}.${ext}`
      } while (ocupados.has(ruta))
      imagenes.push({ ruta, datos, tipoMime: MIME_DE_EXT[ext] })
      return ruta
    },
  )
  return { html: out, imagenes }
}

function normalizar(v: string): string {
  return v.replace(/^\.\//, '')
}

function buscarBase(valor: string, cambios: Map<string, string>): string | null {
  const directo = cambios.get(normalizar(valor))
  if (directo !== undefined) return directo
  let dec: string
  try {
    dec = decodeURIComponent(valor)
  } catch {
    return null
  }
  if (dec === valor) return null
  const nuevo = cambios.get(normalizar(dec))
  return nuevo === undefined ? null : encodeURI(nuevo)
}

/** Reescribe una URL conservando ?query y #hash. */
function buscar(valor: string, cambios: Map<string, string>): string | null {
  const i = valor.search(/[?#]/)
  const base = i < 0 ? valor : valor.slice(0, i)
  const sufijo = i < 0 ? '' : valor.slice(i)
  const n = buscarBase(base, cambios)
  return n === null ? null : n + sufijo
}

function reescribirSrcset(v: string, cambios: Map<string, string>): string {
  return v
    .split(',')
    .map((parte) => {
      const m = /^(\s*)(\S+)(.*)$/s.exec(parte)
      if (!m) return parte
      const n = buscar(m[2], cambios)
      return n === null ? parte : `${m[1]}${n}${m[3]}`
    })
    .join(',')
}

export function reescribirReferencias(texto: string, cambios: Map<string, string>): string {
  return texto
    .replace(/(\bsrcset\s*=\s*)(["'])(.*?)\2/gis, (m, pre: string, q: string, v: string) => {
      const n = reescribirSrcset(v, cambios)
      return n === v ? m : `${pre}${q}${n}${q}`
    })
    .replace(/(\b(?:src|href|poster)\s*=\s*)(["'])(.*?)\2/gi, (m, pre: string, q: string, v: string) => {
      const n = buscar(v, cambios)
      return n === null ? m : `${pre}${q}${n}${q}`
    })
    .replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, (m, q: string, v: string) => {
      const n = buscar(v, cambios)
      return n === null ? m : `url(${q}${n}${q})`
    })
}

export interface OptimizadorImagen {
  optimizar(datos: Uint8Array, tipoMime: string): Promise<{ datos: Uint8Array; tipoMime: string } | null>
}

const EXT_DE_TIPO: Record<string, string> = {
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/avif': '.avif',
}
const EXT_OPTIMIZABLES = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const EXT_IMAGEN = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'])
const EXT_VIDEO = new Set(['.mp4', '.webm', '.mp3', '.m4a'])

function directorio(ruta: string): string {
  const i = ruta.lastIndexOf('/')
  return i < 0 ? '' : ruta.slice(0, i + 1)
}

function relativa(desdeDir: string, a: string): string {
  const d = desdeDir.split('/').filter(Boolean)
  const t = a.split('/')
  let i = 0
  while (i < d.length && i < t.length - 1 && d[i] === t[i]) i++
  return '../'.repeat(d.length - i) + t.slice(i).join('/')
}

function consejoPara(ruta: string, final: number): string | null {
  if (final <= UMBRAL_AVISO) return null
  const ext = extension(ruta)
  if (EXT_VIDEO.has(ext)) return CONSEJOS.video
  if (ext === '.pdf') return CONSEJOS.pdf
  if (EXT_IMAGEN.has(ext)) return CONSEJOS.imagen
  return null
}

export async function optimizarArtefacto(
  archivos: ArchivoSubida[],
  opt: OptimizadorImagen,
): Promise<{ archivos: ArchivoSubida[]; informe: FilaPeso[]; total: { original: number; final: number } }> {
  const dec = new TextDecoder()
  const enc = new TextEncoder()
  const originales = new Map<string, number>()
  const trabajo: ArchivoSubida[] = []
  for (const a of archivos) originales.set(a.ruta, a.datos.length)

  // Nombres ya usados (existentes y asignados en esta pasada).
  const usados = new Set<string>(archivos.map((a) => a.ruta))
  // 1) data: incrustadas
  let contador = 0
  for (const a of archivos) {
    if (!/\.html?$/i.test(a.ruta)) {
      trabajo.push(a)
      continue
    }
    const r = extraerImagenesIncrustadas(
      dec.decode(a.datos),
      contador,
      new Set([...usados].filter((u) => u.startsWith(directorio(a.ruta))).map((u) => u.slice(directorio(a.ruta).length))),
    )
    if (!r.imagenes.length) {
      trabajo.push(a)
      continue
    }
    contador += r.imagenes.length
    for (const i of r.imagenes) usados.add(directorio(a.ruta) + i.ruta)
    trabajo.push({ ...a, datos: enc.encode(r.html) })
    const dir = directorio(a.ruta)
    for (const i of r.imagenes) {
      const ruta = dir + i.ruta
      originales.set(ruta, i.datos.length)
      trabajo.push({ ruta, datos: i.datos, tipoMime: i.tipoMime })
    }
  }

  // 2) optimizar imagenes
  const renombres = new Map<string, string>()
  const optimizados: ArchivoSubida[] = []
  for (const a of trabajo) {
    if (!EXT_OPTIMIZABLES.has(extension(a.ruta))) {
      optimizados.push(a)
      continue
    }
    let r: { datos: Uint8Array; tipoMime: string } | null = null
    try {
      r = await opt.optimizar(a.datos, a.tipoMime)
    } catch {
      r = null
    }
    if (!r || r.datos.length >= a.datos.length) {
      optimizados.push(a)
      continue
    }
    const extNueva = EXT_DE_TIPO[r.tipoMime]
    const nueva = extNueva ? a.ruta.replace(/\.[^./]+$/, '') + extNueva : a.ruta
    if (nueva !== a.ruta) {
      if (usados.has(nueva)) {
        optimizados.push(a)
        continue
      }
      usados.add(nueva)
      renombres.set(a.ruta, nueva)
      const orig = originales.get(a.ruta)
      if (orig !== undefined) originales.set(nueva, orig)
    }
    optimizados.push({ ruta: nueva, datos: r.datos, tipoMime: r.tipoMime })
  }

  // 3) reescribir referencias en .html y .css
  const resultado = optimizados.map((a) => {
    if (!renombres.size || !/\.(html?|css)$/i.test(a.ruta)) return a
    const dir = directorio(a.ruta)
    const mapa = new Map<string, string>()
    for (const [viejo, nuevo] of renombres) mapa.set(relativa(dir, viejo), relativa(dir, nuevo))
    const antes = dec.decode(a.datos)
    const despues = reescribirReferencias(antes, mapa)
    return despues === antes ? a : { ...a, datos: enc.encode(despues) }
  })

  // 4) informe
  const informe: FilaPeso[] = resultado.map((a) => ({
    ruta: a.ruta,
    original: originales.get(a.ruta) ?? a.datos.length,
    final: a.datos.length,
    consejo: consejoPara(a.ruta, a.datos.length),
  }))
  const total = {
    original: archivos.reduce((s, a) => s + a.datos.length, 0),
    final: resultado.reduce((s, a) => s + a.datos.length, 0),
  }
  return { archivos: resultado, informe, total }
}
