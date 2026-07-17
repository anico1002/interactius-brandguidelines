/* Typesetting rules for display headlines — the finishing a typographer would do by hand, applied
   deterministically so the same markdown always sets the same way. */

/* A hyphenated compound is one word: "Co-crear" must not come apart across a line. Browsers (and
   InDesign) treat a hyphen as a break opportunity, so swap it for U+2011, the non-breaking hyphen
   — same glyph, no break. Letters only, so a range like "2026-2027" still breaks where it should.
   Headlines only: in a narrow body column, a long compound needs that break. */
const COMPOUND = /(\p{L})-(\p{L})/gu;

export const keepCompounds = (text: string): string => text.replace(COMPOUND, '$1‑$2');

/* No widow: a headline must not end with one short word stranded on a line of its own ("2.0" under
   two full lines). Bind the last word to the one before it with a non-breaking space, so they wrap
   together — the typesetter's rule, and it holds for any text rather than for one title.
   Only tiny tails ("2.0", "App", "EFP"). A word of six or seven letters fills a line honestly and
   reads as a line, not as a leftover; binding it would drag a whole word down for nothing. */
const WIDOW_MAX = 5;

export function bindWidow(text: string): string {
  const at = text.trimEnd().lastIndexOf(' ');
  if (at < 0) return text;
  const last = text.slice(at + 1);
  if (!last || last.length > WIDOW_MAX) return text;
  return text.slice(0, at) + ' ' + last;
}

/* Everything a display headline gets, in order. */
export const typesetHeadline = (text: string): string => bindWidow(keepCompounds(text));
