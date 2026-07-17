import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileDeck } from '../index.ts';
import { TEMPLATES } from '../templates.ts';

/* Regression oracle for the parser-unification refactor. golden-slides.json is a snapshot of
   the CURRENT compileDeck output for the 3 starter templates + the 3 saved Supabase decks.
   Phase 1 (unified parser) MUST keep these byte-identical (JSON round-trip → key-order/undefined
   insensitive deepEqual). Regenerate intentionally with gen-golden.ts only when output is meant
   to change. */

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const saved = (n: string) => readFileSync(here(`./fixtures/saved/${n}.md`), 'utf8');
const golden: Record<string, unknown> = JSON.parse(readFileSync(here('./fixtures/golden-slides.json'), 'utf8'));

const sources: Record<string, string> = {
  'tpl-comercial': TEMPLATES.comercial,
  'tpl-informe': TEMPLATES.informe,
  'tpl-generica': TEMPLATES.generica,
  'saved-tmb': saved('tmb'),
  'saved-qualitahub': saved('qualitahub'),
  'saved-catala': saved('catala'),
};

for (const [name, md] of Object.entries(sources)) {
  test(`compileDeck output is unchanged for ${name}`, () => {
    const fresh = JSON.parse(JSON.stringify(compileDeck(md)));
    assert.deepEqual(fresh, golden[name]);
  });
}
