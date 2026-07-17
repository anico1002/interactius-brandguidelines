import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepCompounds, bindWidow, typesetHeadline } from '../typeset.ts';

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

const NBSP = ' ';

test('a short last word is bound to the one before it, so it never stands alone', () => {
  assert.equal(bindWidow('Co-crear el Experience Hub 2.0'), `Co-crear el Experience Hub${NBSP}2.0`);
});

test('a long last word fills its own line, so it is left alone', () => {
  assert.equal(bindWidow('Nuevo Ecosistema Digital'), 'Nuevo Ecosistema Digital');
});

test('a single-word headline has nothing to bind', () => {
  assert.equal(bindWidow('Gracias'), 'Gracias');
});

test('the headline gets both rules at once', () => {
  assert.equal(typesetHeadline('Hackatón: Co-crear el Hub 2.0'), `Hackatón: Co‑crear el Hub${NBSP}2.0`);
});
