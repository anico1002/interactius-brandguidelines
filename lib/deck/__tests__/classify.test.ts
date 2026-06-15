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

test('generic caps eyebrow + heading → statement', () => {
  const s = one('NUESTRA MIRADA\n# Incrementar la conversión') as any;
  assert.equal(s.kind, 'statement');
  assert.equal(s.eyebrow, 'NUESTRA MIRADA');
  assert.equal(s.title, 'Incrementar la conversión');
});

test('EL RETO keyword → elreto; CONTEXTO → contexto; OBJETIVOS → objetivos; ROADMAP → roadmapPhases; PRESUPUESTO → budget', () => {
  assert.equal((one('EL RETO\n# Incrementar la conversión') as any).kind, 'elreto');
  assert.equal((one('CONTEXTO\nUn párrafo corto de contexto.') as any).kind, 'contexto');
  assert.equal((one('## Objetivos\n- a\n- b') as any).kind, 'objetivos');
  assert.equal((one('## Roadmap\n### Diagnóstico\nx\n- y') as any).kind, 'roadmapPhases');
  assert.equal((one('## Presupuesto') as any).kind, 'budget');
});

test('budget: line items + total auto-summed from the .md', () => {
  const s = one('## Presupuesto\n- Análisis: 3.315 €\n- Benchmark: 3.770 €\n- Inmersión: 3.991 €') as any;
  assert.equal(s.kind, 'budget');
  assert.deepEqual(s.items, [
    { label: 'Análisis', amount: '3.315 €' },
    { label: 'Benchmark', amount: '3.770 €' },
    { label: 'Inmersión', amount: '3.991 €' },
  ]);
  assert.equal(s.total, '11.076 €');
});

test('budget: explicit Total row wins over auto-sum', () => {
  const s = one('## Presupuesto\n- Fase 1: 1.000 €\n- Fase 2: 2.000 €\n- Total: 3.500 €') as any;
  assert.equal(s.items.length, 2);
  assert.equal(s.total, '3.500 €');
});

test('budget: conditions overridable via "### Condiciones" list', () => {
  const s = one('## Presupuesto\n- Fase 1: 1.000 €\n### Condiciones\n- Pago a 30 días.\n- IVA aparte.') as any;
  assert.deepEqual(s.items, [{ label: 'Fase 1', amount: '1.000 €' }]);
  assert.deepEqual(s.conditions, ['Pago a 30 días.', 'IVA aparte.']);
});

test('budget: empty block falls back to the reference example', () => {
  const s = one('## Presupuesto') as any;
  assert.equal(s.items.length, 3);
  assert.equal(s.total, '11.076 €');
  assert.equal(s.conditions.length, 5);
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
