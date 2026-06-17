// One-off generator: snapshots the CURRENT compileDeck output as the regression oracle
// for the parser-unification refactor. Run: node --experimental-strip-types lib/deck/__tests__/gen-golden.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileDeck } from '../index.ts';
import { TEMPLATES } from '../templates.ts';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const saved = (n: string) => readFileSync(here(`./fixtures/saved/${n}.md`), 'utf8');

const sources: Record<string, string> = {
  'tpl-comercial': TEMPLATES.comercial,
  'tpl-informe': TEMPLATES.informe,
  'tpl-generica': TEMPLATES.generica,
  'saved-tmb': saved('tmb'),
  'saved-qualitahub': saved('qualitahub'),
  'saved-catala': saved('catala'),
};

const golden: Record<string, unknown> = {};
for (const [name, md] of Object.entries(sources)) {
  // JSON round-trip normalizes (drops undefined) so deepEqual is stable across refactors.
  golden[name] = JSON.parse(JSON.stringify(compileDeck(md)));
}
writeFileSync(here('./fixtures/golden-slides.json'), JSON.stringify(golden, null, 2) + '\n');
console.log('wrote golden for:', Object.keys(golden).join(', '));
