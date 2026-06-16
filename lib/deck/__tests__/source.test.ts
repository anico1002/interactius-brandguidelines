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

test('provenance is 1:1 with source blocks when nothing is injected', () => {
  const deck = compileDeck(md, 'generica');
  assert.deepEqual(deck.provenance, [0, 1, 2, 3, 4, 5]);
});

test('injected slides get null provenance, content slides keep their source index', () => {
  const deck = compileDeck(md, 'comercial');
  // cover (src 0), then 3 injected (null,null,null), then the rest of the sources
  assert.equal(deck.provenance?.[0], 0);
  assert.deepEqual(deck.provenance?.slice(1, 4), [null, null, null]);
  // every injected slide aligns with a null, every content slide with a number
  deck.slides.forEach((s, i) => {
    const injected = ['manifesto', 'team', 'clients', 'acceptance'].includes(s.kind);
    assert.equal(deck.provenance?.[i] === null, injected, `slide ${i} (${s.kind})`);
  });
});
