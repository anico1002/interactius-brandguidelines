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

test('no slides are injected: slides are 1:1 with the markdown blocks', () => {
  // commercial no longer differs from generica — nothing is auto-inserted.
  const deck = compileDeck(md, 'comercial');
  assert.deepEqual(
    deck.slides.map((s) => s.kind),
    ['cover', 'elreto', 'bullets', 'columns', 'gantt', 'closing'],
  );
  assert.deepEqual(deck.provenance, [0, 1, 2, 3, 4, 5]);
});

test('a Presupuesto section is NOT followed by an auto acceptance page', () => {
  const deck = compileDeck('# P\n> cliente: X\n\n---\n\n## Presupuesto\n\n---\n\n# Gracias', 'comercial');
  const kinds = deck.slides.map((s) => s.kind);
  assert.deepEqual(kinds, ['cover', 'budget', 'closing']);
});

test('brand pages are produced by explicit [ly: …] markers', () => {
  const md2 = '[ly: manifiesto]\n# Hola\n\n---\n\n[ly: equipo]\nUn párrafo.\n\n---\n\n[ly: clientes]\n\n---\n\n[ly: aceptacion]\nnombre: Ana';
  const deck = compileDeck(md2, 'comercial');
  assert.deepEqual(deck.slides.map((s) => s.kind), ['manifesto', 'team', 'clients', 'acceptance']);
});
