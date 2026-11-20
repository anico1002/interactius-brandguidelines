/* Formatos de fecha del workspace de Deliv_r: «12 nov 2026», siempre en hora de Madrid. */
const FECHA = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid',
});

/* «18 de noviembre de 2026»: la fecha larga de las galerías de DeckMak_r y FormMak_r. */
const FECHA_LARGA = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid',
});

export function fechaLarga(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : FECHA_LARGA.format(d);
}

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
