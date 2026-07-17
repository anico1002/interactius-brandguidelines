import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepCompounds } from '../typeset.ts';

const NB = '‑'; // non-breaking hyphen

test('a hyphenated compound is kept whole', () => {
  assert.equal(keepCompounds('Co-crear el Experience Hub'), `Co${NB}crear el Experience Hub`);
});

test('every compound in the headline is covered, not just the first', () => {
  assert.equal(keepCompounds('Co-crear y co-diseñar'), `Co${NB}crear y co${NB}diseñar`);
});

test('accented and non-ASCII words count as words', () => {
  assert.equal(keepCompounds('anàlisi-diagnòstic'), `anàlisi${NB}diagnòstic`);
});

/* A range or a numbered code has a real reason to break; only compounds are held together. */
test('hyphens that do not join two words are left alone', () => {
  assert.equal(keepCompounds('2026-2027'), '2026-2027');
  assert.equal(keepCompounds('Fase 1 - Discovery'), 'Fase 1 - Discovery');
  assert.equal(keepCompounds('— guion largo —'), '— guion largo —');
});

test('text without hyphens comes back untouched', () => {
  assert.equal(keepCompounds('Propuesta de colaboración'), 'Propuesta de colaboración');
});
