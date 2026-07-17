/* Typesetting rules for display headlines — the finishing a typographer would do by hand, applied
   deterministically so the same markdown always sets the same way. */

/* A hyphenated compound is one word: "Co-crear" must not come apart across a line. Browsers (and
   InDesign) treat a hyphen as a break opportunity, so swap it for U+2011, the non-breaking hyphen
   — same glyph, no break. Letters only, so a range like "2026-2027" still breaks where it should.
   Headlines only: in a narrow body column, a long compound needs that break. */
const COMPOUND = /(\p{L})-(\p{L})/gu;

export const keepCompounds = (text: string): string => text.replace(COMPOUND, '$1‑$2');
