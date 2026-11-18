import { randomBytes } from 'node:crypto'

/** 32 símbolos sin `0/o/1/l`: fáciles de dictar y copiar. */
export const ALFABETO = 'abcdefghijkmnpqrstuvwxyz23456789'

export const ID_ARTEFACTO_RE = /^[abcdefghijkmnpqrstuvwxyz23456789]{10}$/

/** 256 es múltiplo de 32, así que `b & 31` es uniforme. */
export function idAleatorio(longitud: number): string {
  let out = ''
  for (const b of randomBytes(longitud)) out += ALFABETO[b & 31]
  return out
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export { SLUGS_RESERVADOS, slugDesdeNombre, validarSlugCliente } from './slug.ts'
