/*
 * Supabase Storage solo acepta claves ASCII de un juego corto de caracteres: «Diseño – propuesta.pdf»
 * da «InvalidKey». La ruta lógica (la que ve el equipo y la que pide el HTML del cliente) no cambia;
 * solo se codifica la clave del objeto en el bucket.
 *
 * Se deja tal cual [A-Za-z0-9 _ . - /]; cualquier otro byte UTF-8, incluida la propia «@», pasa a
 * «@xx» (hex en minúsculas). Como «@» siempre se escapa, la codificación es inyectiva y reversible.
 */
const LIBRE = /^[A-Za-z0-9 _.\-/]$/

export function claveStorage(ruta: string): string {
  let out = ''
  for (const ch of ruta) {
    if (LIBRE.test(ch)) { out += ch; continue }
    for (const b of new TextEncoder().encode(ch)) out += '@' + b.toString(16).padStart(2, '0')
  }
  return out
}

export function rutaDesdeClave(clave: string): string {
  const bytes: number[] = []
  for (let i = 0; i < clave.length; ) {
    if (clave[i] === '@') { bytes.push(parseInt(clave.slice(i + 1, i + 3), 16)); i += 3 }
    else { bytes.push(clave.charCodeAt(i)); i += 1 }
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}
