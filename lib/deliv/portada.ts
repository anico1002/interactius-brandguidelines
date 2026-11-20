/*
 * Portada de un artefacto en la galería del equipo: un JPEG de 1280×720 con la primera pantalla.
 *
 * Quién la hace. El navegador del equipo, la primera vez que la galería ve un artefacto sin
 * portada para su versión actual:
 * - HTML: lo abre en un iframe con el MISMO sandbox que el visor del cliente, pidiendo el archivo
 *   de entrada con `?captura=1`. La ruta de archivos le añade dos scripts propios
 *   (public/deliv/html-to-image.js y public/deliv/captura.js) que fotografían la página desde
 *   dentro y devuelven solo la imagen por postMessage. Nada sale del aislamiento salvo esa imagen.
 * - PDF: pdf.js pinta la primera página en el navegador del equipo.
 * Luego la sube a POST /api/deliv_r/artefactos/:id/portada.
 *
 * Dónde vive. `deliv-r/<uuid>/portadas/v<version>.jpg`: fuera de las carpetas `v<n>/` (no se
 * mezcla con los archivos del artefacto ni se sirve por su ruta) y dentro del prefijo del
 * artefacto, así que borrarlo la borra. Una versión nueva no tiene portada y se vuelve a generar.
 */

export const ANCHO_PORTADA = 1280
export const ALTO_PORTADA = 720
/** Un JPEG de 1280×720 a calidad 0,8 ronda los 100-300 KB; el tope deja margen. */
export const LIMITE_PORTADA = 2 * 1024 * 1024

export function carpetaPortadas(id: string): string {
  return `${id}/portadas`
}

export function rutaPortada(id: string, version: number): string {
  return `${carpetaPortadas(id)}/v${version}.jpg`
}

/** Cabecera JPEG (FF D8 FF). */
export function esJpeg(b: Uint8Array): boolean {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
}

/** Motivo de rechazo, o null si vale. */
export function validarPortada(b: Uint8Array): string | null {
  if (!b.length) return 'La portada está vacía.'
  if (b.length > LIMITE_PORTADA) return 'La portada pesa demasiado.'
  if (!esJpeg(b)) return 'La portada no es un JPEG.'
  return null
}

export const SCRIPTS_CAPTURA =
  '<script src="/deliv/html-to-image.js"></script><script src="/deliv/captura.js"></script>'

/** Añade los scripts de captura al final del documento (antes del último </body>, si lo hay). */
export function inyectarCaptura(html: string): string {
  const i = html.toLowerCase().lastIndexOf('</body>')
  return i === -1 ? html + SCRIPTS_CAPTURA : html.slice(0, i) + SCRIPTS_CAPTURA + html.slice(i)
}
