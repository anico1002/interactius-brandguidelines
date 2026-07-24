import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';

/* Labels-free logo wall (2026 design): 1645×880 contained format. The image keeps its rule lines and
   its logos; the category NAMES are drawn on top as translatable text (from the markdown list), so
   they translate with the deck and stay in the type system (`.eyebrow`). */
const DEFAULT_IMG = '/presentaciones/clients-grid.png';

/* Canonical categories, in the arrangement of the default image. A marker-only `[ly: clientes]`
   block (existing decks) carries no list, so these fill in — matching how the other brand pages fall
   back to canonical copy. Authoring the list in the markdown overrides them AND makes them translate. */
const DEFAULT_LABELS = [
  'Productos financieros',
  'Sector público',
  'Retail-moda',
  'Medios/deportes',
  'Seguros',
  'Educación',
  'Otros',
];

/* Where each category NAME sits, in the 2026 arrangement (Productos financieros | Sector público ·
   Retail-moda full-width · Medios/deportes | Seguros | Educación · Otros full-width). Coordinates are
   1280×720 frame px, measured off the labels-free image (rule left-edges) and tuned in /lab.
   labels[i] draws at POSITIONS[i]; order matches DEFAULT_LABELS / the markdown list. Text only — the
   rule lines live in the image. */
const POSITIONS: { left: number; top: number }[] = [
  { left: 109, top: 94 },   // Productos financieros — rule 0→913 @ y55
  { left: 727, top: 94 },   // Sector público — rule 957→1639 @ y55
  { left: 109, top: 211 },  // Retail-moda — rule full @ y236
  { left: 109, top: 329 },  // Medios/deportes — rule 0→628 @ y418
  { left: 545, top: 329 },  // Seguros — rule 676→1183 @ y418
  { left: 902, top: 329 },  // Educación — rule 1227→1640 @ y418
  { left: 109, top: 458 },  // Otros — rule full @ y618
];

/* Brand page (ref p.41): client logo wall with translatable category names over the image. */
export function Clients({ slide, page }: { slide: Extract<Slide, { kind: 'clients' }>; page: number }) {
  const labels = slide.labels.length ? slide.labels : DEFAULT_LABELS;
  return (
    <div className="frame theme-light clients">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logos" src={slide.image?.src ?? DEFAULT_IMG} alt={slide.image?.alt ?? 'Clientes de Interactius'} />
      <Chrome page={page} />
      {labels.slice(0, POSITIONS.length).map((label, i) => (
        <div className="cat eyebrow" key={i} style={{ left: POSITIONS[i].left, top: POSITIONS[i].top }}>
          {label}
        </div>
      ))}
    </div>
  );
}
