/* Audita el copy real del proyecto contra las reglas duras de lib/tokens.ts.
 *
 *   node --experimental-strip-types scripts/eval-content.ts
 *
 * Este fichero llevaba tiempo documentado en la cabecera de `lib/eval.ts` como uno de sus
 * consumidores — "scripts/eval-content.ts (CI / manual self-validation)" — y NO EXISTÍA. Quien
 * leyera el motor daba por hecho que había una red automática que no estaba: ningún test tocaba el
 * copy, y `GET /api/eval/manual` está detrás del gate de sesión, no corre en CI y no mira
 * `content/`. Que sea justo en `content/forms/` donde estaban las dos únicas infracciones duras
 * reales del sitio (dos `¡Gracias!` publicados para un cliente) dice bastante.
 *
 * Diferencias deliberadas con /api/eval/manual:
 *
 *  1. Cubre TAMBIÉN `content/forms/*.md`, que es lo que se sirve a clientes.
 *  2. Las exclusiones son por clave exacta, no por prefijo. El endpoint excluye `tonoMarca.red`,
 *     que barre de golpe los `red*Word` (citas legítimas: el manual nombra la palabra para
 *     prohibirla) y los `red*Rule` (prosa normal, donde la palabra NO debería aparecer). Aquí solo
 *     se perdonan las citas.
 *  3. Separa reglas duras de blandas con `hardFailFor`, la misma regla que `lib/eval.ts`.
 *
 * 2026-11-20 · documento «Identidad verbal»: se retiraron la lista roja y la regla de elipsis, y la
 * exclamación pasó a «aconsejable, no requerimiento estricto». Hoy ninguna regla es dura, así que
 * este script informa y no bloquea. Si algún día vuelve una regla dura, se declara en
 * `hardFailFor` y este script vuelve a fallar solo.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { evalText, hardFailFor, type EvalViolation } from '../lib/eval.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Claves que CITAN la regla para enseñarla (el prompt copiable lleva la exclamación de ejemplo).
   Exactas, no prefijos. */
const QUOTES_RULE = new Set(['tonoMarca.copyPrompt', 'universoVisual.copyPrompt']);

/* Baseline de decisiones pendientes. Las cuatro que había (lista roja y elipsis) se resolvieron el
   2026-11-20 al retirar esas reglas. Se mantiene el mecanismo para la próxima. */
const PENDIENTE_DECISION = new Map<string, string>();

/* Claves de frontmatter que son identificadores de máquina, no copy: no se leen, no se pintan y
   no tiene sentido auditarlas. `name: personas_impacto` disparaba la lista roja por el nombre de
   un campo de formulario. */
const MACHINE_KEYS = new Set([
  'id', 'name', 'slug', 'accent', 'status', 'client', 'logo', 'background',
  'version', 'type', 'theme', 'redirect', 'webhook', 'indexable', 'ai_crawlers',
]);

/** Claves cuyo valor no es prosa: etiquetas, botones, specs técnicas. Solo eximen de LONGITUD. */
const NOT_PROSE = /^(menu\.|chrome\.|ui\.|meta\.|prompts\.|.*\.(label|title|cta|hint|placeholder|alt)$)/;

type Finding = { source: string; key: string; rule: string; detail: string };

function flatten(obj: unknown, prefix = ''): [string, string][] {
  const out: [string, string][] = [];
  if (typeof obj === 'string') return [[prefix, obj]];
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      out.push(...flatten(v, prefix ? `${prefix}.${k}` : k));
    }
  }
  return out;
}

function describe(v: EvalViolation): string {
  if (v.rule === 'length:under_min' || v.rule === 'length:over_max') {
    return `frase ${v.sentence}: ${v.count} palabras (límite ${v.limit})`;
  }
  return 'signo de exclamación (aconsejable evitarlo)';
}

const hard: Finding[] = [];
const soft: Finding[] = [];
const advisory: Finding[] = [];
const pendientes: Finding[] = [];

function check(source: string, key: string, text: string, isProse: boolean, baselineId?: string) {
  if (!text.trim()) return;
  for (const v of evalText(text).violations) {
    const isLength = v.rule === 'length:under_min' || v.rule === 'length:over_max';
    if (isLength) {
      if (isProse) soft.push({ source, key, rule: v.rule, detail: describe(v) });
      continue;
    }
    if (QUOTES_RULE.has(key)) continue; // el manual cita la regla para enseñarla
    const f = { source, key, rule: v.rule, detail: describe(v) };
    if (!hardFailFor([v])) advisory.push(f);
    else if (baselineId && PENDIENTE_DECISION.has(baselineId)) pendientes.push(f);
    else hard.push(f);
  }
}

// ── 1. Los tres ficheros de mensajes ─────────────────────────────────────────
for (const locale of ['es', 'en', 'ca']) {
  const file = join(ROOT, 'messages', `${locale}.json`);
  const json: unknown = JSON.parse(readFileSync(file, 'utf8'));
  for (const [key, value] of flatten(json)) {
    // El baseline es por clave, no por idioma: la misma frase traducida es la misma decisión.
    check(`messages/${locale}.json`, key, value, !NOT_PROSE.test(key), `messages:${key}`);
  }
}

// ── 2. Los formularios, que es lo que ve un cliente ──────────────────────────
const formsDir = join(ROOT, 'content', 'forms');
for (const name of readdirSync(formsDir).filter((f) => f.endsWith('.md'))) {
  const raw = readFileSync(join(formsDir, name), 'utf8');
  /* El frontmatter y el cuerpo se auditan igual: `success_title: ¡Gracias!` vivía en el
     frontmatter, y es lo último que un cliente ve de la marca. */
  for (const [i, line] of raw.split('\n').entries()) {
    const m = /^([a-z_]+):\s*(.+)$/.exec(line.trim());
    if (m && MACHINE_KEYS.has(m[1])) continue; // identificador, no copy
    const text = m ? m[2] : line;
    check(`content/forms/${name}`, `L${i + 1}`, text, false, `content/forms/${name}:${i + 1}`);
  }
}

// ── Informe ──────────────────────────────────────────────────────────────────
const pad = (s: string, n: number) => s.padEnd(n);

if (soft.length) {
  console.log(`\n${soft.length} avisos de longitud de frase (regla blanda, no bloquea):`);
  for (const f of soft.slice(0, 12)) {
    console.log(`  ${pad(f.source, 22)} ${pad(f.key, 34)} ${f.detail}`);
  }
  if (soft.length > 12) console.log(`  … y ${soft.length - 12} más`);
}

if (advisory.length) {
  console.log(`\n${advisory.length} avisos de puntuación (aconsejable, no bloquea):`);
  for (const f of advisory) console.log(`  ${pad(f.source, 26)} ${pad(f.key, 34)} ${f.detail}`);
}

if (pendientes.length) {
  console.log(`\n${pendientes.length} incumplimientos CONOCIDOS, pendientes de decisión de marca:`);
  const vistos = new Set<string>();
  for (const f of pendientes) {
    const id = f.source.startsWith('messages') ? `messages:${f.key}` : `${f.source}:${f.key.slice(1)}`;
    if (vistos.has(id)) continue;
    vistos.add(id);
    console.log(`  ${pad(f.source, 26)} ${pad(f.key, 22)} ${f.detail}`);
    console.log(`      → ${PENDIENTE_DECISION.get(id) ?? ''}`);
  }
  console.log('  Ver audit/INFORME.md §4. No bloquean; uno nuevo sí lo haría.');
}

if (hard.length) {
  console.error(`\n✖ ${hard.length} incumplimientos de reglas DURAS de lib/tokens.ts:\n`);
  for (const f of hard) {
    console.error(`  ${pad(f.source, 26)} ${pad(f.key, 34)} ${pad(f.rule, 26)} ${f.detail}`);
  }
  console.error('\nSon reglas no negociables (ver hardFailFor en lib/eval.ts).');
  process.exit(1);
}

console.log(
  pendientes.length
    ? `\n✔ Sin incumplimientos nuevos. Quedan ${PENDIENTE_DECISION.size} pendientes de decisión (arriba).`
    : `\n✔ Sin incumplimientos de reglas duras.`,
);
