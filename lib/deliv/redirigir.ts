/**
 * Redireccion 303 con `Location` RELATIVA.
 *
 * En Netlify, `req.url` dentro de un route handler lleva el host interno del
 * deploy (`<id>--<sitio>.netlify.app`), no el dominio publico. Construir la
 * redireccion con `new URL(ruta, req.url)` manda al usuario a ese host, donde
 * no existe la cookie `__Host-` (ligada al dominio publico) y el login nunca
 * pega. Una Location relativa la resuelve el navegador contra la URL que esta
 * viendo, que siempre es la publica.
 *
 * Devuelve un Response estandar (sin `next/server`) para que los tests de
 * node:test lo importen sin el runtime de Next. `NextResponse` no hace falta:
 * las cookies se anaden con `Set-Cookie` desde la ruta.
 */
export function redirigir(ruta: string): Response {
  if (!ruta.startsWith('/') || ruta.startsWith('//') || ruta.startsWith('/\\')) {
    throw new Error(`Redireccion no interna: ${ruta}`)
  }
  return new Response(null, { status: 303, headers: { Location: ruta } })
}
