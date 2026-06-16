import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { splitSourceBlocks } from '../source.ts';
import { compileDeck } from '../index.ts';

const md = readFileSync(fileURLToPath(new URL('./fixtures/sample.md', import.meta.url)), 'utf8');

test('splitSourceBlocks yields one block per --- section with correct ranges', () => {
  const blocks = splitSourceBlocks(md);
  // sample.md has 6 slides
  assert.equal(blocks.length, 6);
  // each block text round-trips from its range
  for (const b of blocks) assert.equal(md.slice(b.start, b.end), b.text);
  // blocks are ordered and non-overlapping
  for (let i = 1; i < blocks.length; i++) assert.ok(blocks[i].start > blocks[i - 1].end);
});

test('provenance is 1:1 with source blocks (no injection, any type)', () => {
  assert.deepEqual(compileDeck(md, 'generica').provenance, [0, 1, 2, 3, 4, 5]);
  // commercial no longer injects, so provenance is identical and fully non-null.
  const deck = compileDeck(md, 'comercial');
  assert.deepEqual(deck.provenance, [0, 1, 2, 3, 4, 5]);
  assert.ok(deck.provenance?.every((p) => p !== null));
});
