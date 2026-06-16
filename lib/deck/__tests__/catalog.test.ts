import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LAYOUT_CATALOG, LAYOUT_MAP } from '../catalog.ts';
import { parse } from '../parse.ts';
import { classify } from '../classify.ts';

test('every catalog marker compiles to its declared kind', () => {
  for (const entry of LAYOUT_CATALOG) {
    const slide = classify(parse(`[ly: ${entry.marker}]`)[0], 0, 1);
    assert.equal(slide.kind, entry.kind, `marker ${entry.marker}`);
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
