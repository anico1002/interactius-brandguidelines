/* Formatos de fecha del workspace de Deliv_r: «12 nov 2026», siempre en hora de Madrid. */
const FECHA = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid',
});

export const NO_DISPONIBLE = 'Servicio no disponible.';

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return 'nunca';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'nunca';
  return FECHA.format(d).replace(/\./g, '');
}

export function personas(n: number): string {
  return `${n} ${n === 1 ? 'persona' : 'personas'}`;
}

/* Sin acentos ni mayúsculas, para el buscador. */
export function plegar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
