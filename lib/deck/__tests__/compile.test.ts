import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileDeck } from '../index.ts';

const md = readFileSync(fileURLToPath(new URL('./fixtures/sample.md', import.meta.url)), 'utf8');

test('compiles the sample deck to the expected slide kinds', () => {
  const deck = compileDeck(md);
  assert.deepEqual(
    deck.slides.map((s) => s.kind),
    ['cover', 'statement', 'bullets', 'columns', 'gantt', 'closing'],
  );
  assert.equal(deck.slides[0].theme, 'dark'); // cover
  assert.equal(deck.slides[2].theme, 'light'); // bullets
});
