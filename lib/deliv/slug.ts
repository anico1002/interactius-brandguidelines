export const SLUGS_RESERVADOS = ['login', 'logout', 'admin', 'archivos'] as const

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Devuelve el motivo del error o `null` si el slug es válido. */
export function validarSlugCliente(slug: string): string | null {
  if (!SLUG_RE.test(slug)) {
    return 'El cliente debe ir en minúsculas, con letras, números y guiones simples.'
  }
  if ((SLUGS_RESERVADOS as readonly string[]).includes(slug)) {
    return `"${slug}" es un nombre reservado por la zona de clientes.`
  }
  return null
}

/** `Café Ñandú` → `cafe-nandu`. Puede devolver `''` si no queda nada. */
export function slugDesdeNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
