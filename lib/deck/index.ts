import { parse } from './parse.ts';
import { compile as classifyAll } from './classify.ts';
import type { Deck, DeckType } from './types.ts';

export * from './types.ts';

/* Slides are 1:1 with the markdown blocks — every page (including the brand pages:
   manifiesto/equipo/clientes/aceptación) is declared explicitly via `[ly: …]` markers.
   `type` is kept as metadata; it no longer alters the compiled slides (it only selects
   the starter template in the editor). */
export function compileDeck(md: string, _type: DeckType = 'comercial'): Deck {
  const sources = parse(md);
  const slides = classifyAll(md, sources);
  const provenance = sources.map((_, i) => i); // every slide maps back to its source block
  return { slides, provenance };
}
