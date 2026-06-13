import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileDeck } from '../index.ts';

const md = readFileSync(fileURLToPath(new URL('./fixtures/sample.md', import.meta.url)), 'utf8');

test('compiles the sample deck to the expected slide kinds (no injection)', () => {
  const deck = compileDeck(md, 'generica');
  assert.deepEqual(
    deck.slides.map((s) => s.kind),
    ['cover', 'elreto', 'bullets', 'columns', 'gantt', 'closing'],
  );
  const cover = deck.slides[0];
  const bullets = deck.slides[2];
  assert.equal('theme' in cover && cover.theme, 'dark');
  assert.equal('theme' in bullets && bullets.theme, 'light');
});

test('commercial type injects the 3 intro pages after the cover', () => {
  const deck = compileDeck(md, 'comercial');
  const kinds = deck.slides.map((s) => s.kind);
  assert.deepEqual(kinds.slice(0, 4), ['cover', 'manifesto', 'team', 'clients']);
  assert.equal(kinds[kinds.length - 1], 'closing');
});

test('a Presupuesto section becomes budget and is always followed by acceptance', () => {
  const deck = compileDeck('# P\n> cliente: X\n\n---\n\n## Presupuesto\n\n---\n\n# Gracias', 'comercial');
  const kinds = deck.slides.map((s) => s.kind);
  const bi = kinds.indexOf('budget');
  assert.ok(bi >= 0);
  assert.equal(kinds[bi + 1], 'acceptance');
});
