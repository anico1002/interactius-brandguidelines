/*
 * Concurrencia acotada. Netlify corta las funciones a los pocos segundos: con un
 * ZIP de cientos de archivos, hacer las peticiones a Storage de una en una se
 * pasa del limite, y lanzarlas todas a la vez satura Storage. Aqui van de N en N.
 */

/**
 * Aplica `fn` a cada elemento con como mucho `limite` llamadas en vuelo y
 * devuelve los resultados en el orden de `items`. El primer error rechaza la
 * promesa y deja de lanzar llamadas nuevas.
 *
 * `parar`, si se da, se consulta antes de cada llamada nueva: cuando devuelve
 * true no se lanza ninguna mas (las que estan en vuelo terminan). Los huecos de
 * los elementos no procesados quedan `undefined`.
 */
export async function mapConLimite<T, R>(
  items: readonly T[],
  limite: number,
  fn: (item: T, indice: number) => Promise<R>,
  parar?: () => boolean,
): Promise<R[]> {
  if (!Number.isInteger(limite) || limite < 1) throw new RangeError('limite debe ser un entero >= 1')
  const out = new Array<R>(items.length)
  let siguiente = 0
  let fallo = false
  const trabajador = async () => {
    while (!fallo && siguiente < items.length && !(parar?.() ?? false)) {
      const i = siguiente++
      try {
        out[i] = await fn(items[i], i)
      } catch (e) {
        fallo = true
        throw e
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, items.length) }, trabajador))
  return out
}
