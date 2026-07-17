import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LAYOUT_CATALOG, LAYOUT_MAP, layoutSnippet } from '../catalog.ts';
import { parse } from '../parse.ts';
import { classify } from '../classify.ts';

test('every catalog marker compiles to its declared kind', () => {
  for (const entry of LAYOUT_CATALOG) {
    const slide = classify(parse(`[ly: ${entry.marker}]`)[0], 0, 1);
    assert.equal(slide.kind, entry.kind, `marker ${entry.marker}`);
  }
});

test('every layout carries a skeleton', () => {
  for (const entry of LAYOUT_CATALOG) {
    assert.equal(typeof entry.skeleton, 'string', `marker ${entry.marker} has no skeleton`);
  }
});

/* The snippet the gallery copies must survive the round trip: paste it and you get the layout the
   row promised, not a paragraph fallback. Guards the skeletons against classifier changes. */
test('every copied snippet compiles to its declared kind', () => {
  for (const entry of LAYOUT_CATALOG) {
    const slide = classify(parse(layoutSnippet(entry))[0], 0, 1);
    assert.equal(slide.kind, entry.kind, `snippet ${entry.marker}`);
  }
});

test('the copied snippet opens with the marker and closes the slide with a separator', () => {
  for (const entry of LAYOUT_CATALOG) {
    const snippet = layoutSnippet(entry);
    assert.ok(snippet.startsWith(`[ly: ${entry.marker}]`), `snippet ${entry.marker} lost its marker`);
    assert.ok(snippet.trimEnd().endsWith('---'), `snippet ${entry.marker} lost its separator`);
  }
});

/* The brand pages fall back to canonical copy only while the block is empty (Manifesto.tsx), so a
   skeleton with dummy text would silently replace the brand content it is meant to bring in. */
test('brand pages stay marker-only so their canonical content still renders', () => {
  for (const marker of ['manifiesto', 'equipo', 'clientes']) {
    const entry = LAYOUT_CATALOG.find((e) => e.marker === marker);
    assert.ok(entry, `marker ${marker} missing from the catalog`);
    assert.equal(entry.skeleton, '', `brand page ${marker} must not carry dummy content`);
  }
});

test('LAYOUT_MAP is derived from the catalog (no drift)', () => {
  assert.deepEqual(
    LAYOUT_MAP,
    Object.fromEntries(LAYOUT_CATALOG.map((c) => [c.marker, c.kind])),
  );
});

test('the catalog covers every renderable slide kind', () => {
  const KINDS = [
    'cover', 'statement', 'bullets', 'columns', 'split', 'gantt', 'paragraph', 'closing',
    'manifesto', 'team', 'clients', 'budget', 'acceptance', 'contexto', 'elreto', 'objetivos', 'roadmapPhases',
  ];
  const covered = new Set(LAYOUT_CATALOG.map((c) => c.kind));
  for (const k of KINDS) assert.ok(covered.has(k as never), `kind ${k} missing from the catalog`);
});

import { compileDeck } from '../index.ts';

test('background modifier {…} on the [ly:] line sets the fill, keeping dark text', () => {
  assert.equal(compileDeck('[ly: manifiesto] {blanco}').slides[0].bg, 'white');
  assert.equal(compileDeck('[ly: lista] {warm-dark}\n\n## X\n\n- a').slides[0].bg, 'warm-dark');
});

test('no modifier means the default fill (no bg set)', () => {
  assert.equal(compileDeck('[ly: lista]\n\n## X\n\n- a').slides[0].bg, undefined);
  assert.equal(compileDeck('[ly: lista] {warm-light}\n\n## X\n\n- a').slides[0].bg, undefined); // default → unset
});

test('{oscuro} still flips the theme (back-compat), and works on a heading too', () => {
  assert.equal(compileDeck('[ly: enunciado] {oscuro}\n\nEYEBROW\n\n## T').slides[0].theme, 'dark');
  assert.equal(compileDeck('## Título {blanco}\n\nCuerpo.').slides[0].bg, 'white');
});
