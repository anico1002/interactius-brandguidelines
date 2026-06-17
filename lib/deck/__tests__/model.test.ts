import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../parse.ts';
import { parseBlock } from '../model.ts';

const model = (md: string) => parseBlock(parse(md)[0].tokens, 0, 1);

test('heading rule: # is title; ## after # is subtitle', () => {
  const m = model('# Título grande\n## Subtítulo\nCuerpo.');
  assert.equal(m.title, 'Título grande');
  assert.equal(m.subtitle, 'Subtítulo');
});

test('heading rule: a lone ## still acts as the title (backward compatible)', () => {
  const m = model('## Objetivos\n- a');
  assert.equal(m.title, 'Objetivos');
  assert.equal(m.subtitle, undefined);
});

test('heading rule: a stray higher-level heading mid-content never hijacks the title', () => {
  const m = model('## Roadmap\nIntro.\n### Fase 1\nx\n# Què farem?\n- a');
  assert.equal(m.title, 'Roadmap');     // first heading wins
  assert.equal(m.subtitle, undefined);  // ### is a section, # comes after it
});

test('### headings become sections (heading + body + items), never the subtitle', () => {
  const m = model('## T\n### Uno\nx\n- a\n- b\n### Dos\ny');
  assert.equal(m.subtitle, undefined);
  assert.equal(m.sections.length, 2);
  assert.deepEqual(m.sections[0], { heading: 'Uno', level: 3, body: ['x'], items: ['a', 'b'] });
});

test('lists, quotes, eyebrow, meta and client are captured uniformly', () => {
  const m = model('NUESTRA MIRADA\n# T\n- uno\n- dos\n> una cita\n> cliente: Naturgy\nnombre: Ana');
  assert.equal(m.eyebrow, 'NUESTRA MIRADA');
  assert.deepEqual(m.items, ['uno', 'dos']);
  assert.ok(m.quotes.includes('una cita'));
  assert.equal(m.client, 'Naturgy');
  assert.equal(m.meta['nombre'], 'Ana');
});

test('no silent drops: every image and every fence is captured', () => {
  const m = model('# T\n![a](1.jpg)\n![b](2.jpg)\n```python\nprint(1)\n```');
  assert.equal(m.images.length, 2);
  assert.equal(m.images[1].src, '2.jpg');
  assert.equal(m.fences.length, 1);
  assert.equal(m.fences[0].lang, 'python');
});

test('theme override on the title heading is parsed and stripped', () => {
  const m = model('# Una afirmación {oscuro}');
  assert.equal(m.title, 'Una afirmación');
  assert.equal(m.themeOverride, 'dark');
});
