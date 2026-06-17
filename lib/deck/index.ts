import { parse } from './parse.ts';
import { compile as classifyAll, blockKind } from './classify.ts';
import { parseBlock, validateBlock } from './model.ts';
import type { Deck, DeckType } from './types.ts';

export * from './types.ts';

/* Advisory, per-slide warnings about content the chosen layout will NOT render (lists in a
   cover, extra paragraphs, a stray code block, …). Kept separate from compileDeck so the
   compiled Deck shape is untouched; the editor surfaces these so nothing is dropped silently. */
export type SlideWarning = { index: number; kind: string; dropped: string[] };
export function deckWarnings(md: string): SlideWarning[] {
  const sources = parse(md);
  const out: SlideWarning[] = [];
  sources.forEach((src, i) => {
    const m = parseBlock(src.tokens, i, sources.length);
    const dropped = validateBlock(m, blockKind(m));
    if (dropped.length) out.push({ index: i, kind: blockKind(m), dropped });
  });
  return out;
}

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
