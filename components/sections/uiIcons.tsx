/* ── Iconos: glifos macizos (ver uiIconRules en lib/ui.ts) ──
   Retícula de 16 con área viva de 12 (2px de aire): cuadrados de 12×12, círculos de 13 de
   diámetro (lo redondo se ve más pequeño a igual medida). Lo que tiene superficie se rellena;
   lo que es línea va a 2px. Remate recto, ángulo recto, sin radio. */
const SOLID = { fill: 'currentColor', 'aria-hidden': true } as const;
const LINE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square', strokeLinejoin: 'miter', 'aria-hidden': true } as const;
export const Ico = {
  grid: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" {...SOLID}>
      <rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" />
    </svg>
  ),
  search: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" {...LINE}>
      <circle cx="6.75" cy="6.75" r="4.25" /><path d="M10 10 13 13" />
    </svg>
  ),
  chevron: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 12 12" {...LINE}>
      <path d="M3 4.5 6 7.5 9 4.5" />
    </svg>
  ),
  check: () => (
    <svg width="10" height="10" viewBox="0 0 10 10" {...LINE}>
      <path d="M1.5 5.2 4 7.5 8.5 2.5" />
    </svg>
  ),
  power: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" {...LINE}>
      <path d="M8 1.5v6" strokeLinecap="butt" /><path d="M4.46 4.96A5 5 0 1 0 11.54 4.96" />
    </svg>
  ),
  plus: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" {...LINE}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  close: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" {...LINE}>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  ),
  info: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" {...SOLID}>
      <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7 7h2v5H7Zm0-3h2v2H7Z" />
    </svg>
  ),
  trash: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" {...SOLID}>
      <path d="M6 2h4v1.5h4v2H2v-2h4Z" />
      <path fillRule="evenodd" d="M3 6.5h10l-.75 7.5h-8.5Zm3 2v3.5h1.5V8.5Zm2.5 0v3.5H10V8.5Z" />
    </svg>
  ),
  copy: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 16 16" {...SOLID}>
      <path d="M2 2h8v2H4v6H2Z" /><path d="M6 6h8v8H6Z" />
    </svg>
  ),
};

