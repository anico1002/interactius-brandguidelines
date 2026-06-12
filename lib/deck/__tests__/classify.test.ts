import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../parse.ts';
import { classify } from '../classify.ts';

const one = (md: string) => classify(parse(md)[0], 0, 1);

test('first slide with title+subtitle+client → cover', () => {
  const s = classify(parse('# Propuesta\nSub.\n> cliente: Naturgy')[0], 0, 3) as any;
  assert.equal(s.kind, 'cover');
  assert.equal(s.title, 'Propuesta');
  assert.equal(s.subtitle, 'Sub.');
  assert.equal(s.client, 'Naturgy');
  assert.equal(s.theme, 'dark');
});

test('caps + heading → statement', () => {
  const s = one('EL RETO\n# Incrementar la conversión') as any;
  assert.equal(s.kind, 'statement');
  assert.equal(s.eyebrow, 'EL RETO');
  assert.equal(s.title, 'Incrementar la conversión');
});

test('heading + list → bullets', () => {
  const s = one('## Cómo\n- a\n- b') as any;
  assert.equal(s.kind, 'bullets');
  assert.deepEqual(s.items, ['a', 'b']);
});

test('heading + three subheads → columns', () => {
  const s = one('## Enfoque\n### Uno\nx\n### Dos\ny\n### Tres\nz') as any;
  assert.equal(s.kind, 'columns');
  assert.equal(s.columns.length, 3);
  assert.deepEqual(s.columns[0], { label: '01', heading: 'Uno', body: 'x' });
});

test('heading + image + paragraph → split', () => {
  const s = one('## Contexto\n![a](u.jpg)\nTexto.') as any;
  assert.equal(s.kind, 'split');
  assert.equal(s.image.src, 'u.jpg');
});

test('gantt fence → gantt', () => {
  const s = one('## Roadmap\n```gantt\nsemanas: 8\nDiagnóstico: 1\n```') as any;
  assert.equal(s.kind, 'gantt');
  assert.equal(s.weeks, 8);
  assert.equal(s.rows[0].label, 'Diagnóstico');
});

test('last slide titled Gracias → closing', () => {
  const s = classify(parse('# Gracias\nwww.interactius.com')[0], 2, 3) as any;
  assert.equal(s.kind, 'closing');
  assert.equal(s.url, 'www.interactius.com');
});

test('unknown shape (heading + paragraph only) → paragraph fallback', () => {
  const s = one('## Notas\nSolo un párrafo suelto.') as any;
  assert.equal(s.kind, 'paragraph');
});
