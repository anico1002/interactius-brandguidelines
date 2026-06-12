import { parse } from './parse.ts';
import { compile as classifyAll } from './classify.ts';
import type { Deck } from './types.ts';

export * from './types.ts';

export function compileDeck(md: string): Deck {
  const sources = parse(md);
  return { slides: classifyAll(md, sources) };
}
