import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../parse.ts';

test('splits slides on horizontal rule', () => {
  const md = `# A\n\n---\n\n# B`;
  const src = parse(md);
  assert.equal(src.length, 2);
  assert.deepEqual(src[0].tokens[0], { t: 'h', level: 1, text: 'A' });
  assert.deepEqual(src[1].tokens[0], { t: 'h', level: 1, text: 'B' });
});

test('detects all-caps eyebrow vs paragraph', () => {
  const [s] = parse(`EL RETO\n# Incrementar la conversión`);
  assert.deepEqual(s.tokens[0], { t: 'caps', text: 'EL RETO' });
  assert.deepEqual(s.tokens[1], { t: 'h', level: 1, text: 'Incrementar la conversión' });
});

test('parses bullet list, blockquote and image', () => {
  const [s] = parse(`## T\n- one\n- two\n> lead\n![alt](u.jpg)`);
  assert.deepEqual(s.tokens[1], { t: 'ul', items: ['one', 'two'] });
  assert.deepEqual(s.tokens[2], { t: 'quote', text: 'lead' });
  assert.deepEqual(s.tokens[3], { t: 'image', alt: 'alt', src: 'u.jpg' });
});

test('captures fenced data block with language', () => {
  const [s] = parse('## Roadmap\n```gantt\nsemanas: 8\nDiagnóstico: 1\n```');
  assert.deepEqual(s.tokens[1], { t: 'fence', lang: 'gantt', body: 'semanas: 8\nDiagnóstico: 1' });
});
