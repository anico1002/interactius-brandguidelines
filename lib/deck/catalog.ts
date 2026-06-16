import type { Slide } from './types.ts';

/* Single source of truth for the available layouts. Drives:
   - LAYOUT_MAP (marker → kind) in classify.ts
   - the "Galería de layouts" popup (thumbnail + marker + name + slots)
   - the developer docs (docs/features/deck-layouts-sistema.md)
   Add a layout here and it shows up everywhere. */
export type LayoutCatalogEntry = {
  marker: string;        // the `[ly: marker]` token name
  kind: Slide['kind'];   // the compiled slide kind
  name: string;          // human label
  slots: string;         // what the content fills
};

export const LAYOUT_CATALOG: LayoutCatalogEntry[] = [
  { marker: 'portada',     kind: 'cover',         name: 'Portada',         slots: 'título, subtítulo, cliente, imagen de fondo' },
  { marker: 'enunciado',   kind: 'statement',     name: 'Enunciado',       slots: 'antetítulo (MAYÚS) + título grande' },
  { marker: 'texto',       kind: 'paragraph',     name: 'Texto',           slots: 'antetítulo + párrafo' },
  { marker: 'lista',       kind: 'bullets',       name: 'Lista',           slots: 'título + viñetas' },
  { marker: 'columnas',    kind: 'columns',       name: 'Columnas',        slots: 'título + columnas (### subtítulo + cuerpo)' },
  { marker: 'split-izq',   kind: 'split',         name: 'Split · img izq.', slots: 'antetítulo, título, párrafo, imagen (izquierda)' },
  { marker: 'split-der',   kind: 'split',         name: 'Split · img der.', slots: 'antetítulo, título, párrafo, imagen (derecha)' },
  { marker: 'contexto',    kind: 'contexto',      name: 'Contexto',        slots: 'un párrafo' },
  { marker: 'reto',        kind: 'elreto',        name: 'El reto',         slots: 'título + imagen' },
  { marker: 'objetivos',   kind: 'objetivos',     name: 'Objetivos',       slots: 'título + lista numerada + imagen' },
  { marker: 'roadmap',     kind: 'roadmapPhases', name: 'Roadmap · fases', slots: 'título, subtítulo, fases (### + tareas)' },
  { marker: 'gantt',       kind: 'gantt',         name: 'Gantt',           slots: 'líneas «clave: valor» (semanas/meses/días…)' },
  { marker: 'presupuesto', kind: 'budget',        name: 'Presupuesto',     slots: 'partidas (- Partida: importe), total, ### Condiciones' },
  { marker: 'manifiesto',  kind: 'manifesto',     name: 'Manifiesto',      slots: 'título + subtítulo (opcional; default de marca)' },
  { marker: 'equipo',      kind: 'team',          name: 'Equipo',          slots: 'párrafos + imagen (opcional; default de marca)' },
  { marker: 'clientes',    kind: 'clients',       name: 'Clientes',        slots: 'imagen (opcional; default de marca)' },
  { marker: 'aceptacion',  kind: 'acceptance',    name: 'Aceptación',      slots: 'título, firmante (nombre/cargo/…), aviso, CTA, firma' },
  { marker: 'cierre',      kind: 'closing',       name: 'Cierre',          slots: 'título + url' },
];

/* marker → kind, derived so there is a single list to maintain. */
export const LAYOUT_MAP: Record<string, Slide['kind']> = Object.fromEntries(
  LAYOUT_CATALOG.map((c) => [c.marker, c.kind]),
);
