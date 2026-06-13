import { parse } from './parse.ts';
import { compile as classifyAll } from './classify.ts';
import type { Deck, DeckType, Slide } from './types.ts';

export * from './types.ts';

/* Fixed brand pages for commercial proposals: 3 after the cover, 2 before the closing. */
const COMMERCIAL_INTRO: Slide[] = [
  { kind: 'manifesto', theme: 'light' },
  { kind: 'team', theme: 'light' },
  { kind: 'clients', theme: 'light' },
];

export function compileDeck(md: string, type: DeckType = 'comercial'): Deck {
  const sources = parse(md);
  const slides = classifyAll(md, sources);

  if (type === 'comercial') {
    const introAt = slides[0]?.kind === 'cover' ? 1 : 0;
    slides.splice(introAt, 0, ...COMMERCIAL_INTRO.map((s) => ({ ...s })));

    // Always append the approval page right after every budget page.
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].kind === 'budget') {
        slides.splice(i + 1, 0, { kind: 'acceptance', theme: 'light' });
        i++;
      }
    }
  }

  return { slides };
}
