/*
 * Fail-closed. Sin secretos, Deliv_r no funciona a medias: las rutas capturan
 * DelivNoDisponible y responden «Servicio no disponible.» / 503.
 *
 * Aqui NO hay ningun repositorio: el de la service role se pide explicitamente
 * a servidor.ts (repoServicio()), para que se vea en cada fichero que la usa.
 */

export class DelivNoDisponible extends Error {
  constructor(motivo: string) {
    super(`Deliv_r no disponible: ${motivo}`)
    this.name = 'DelivNoDisponible'
  }
}

export const LONGITUD_MINIMA_SECRETO = 32

export function secretoSesion(): string {
  const s = process.env.DELIV_SESSION_SECRET
  if (!s || s.length < LONGITUD_MINIMA_SECRETO) {
    throw new DelivNoDisponible(`DELIV_SESSION_SECRET ausente o de menos de ${LONGITUD_MINIMA_SECRETO} caracteres`)
  }
  return s
}
