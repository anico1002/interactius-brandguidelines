# Presentaciones — Deck Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A client-side, no-runtime-AI feature at `/presentaciones` that compiles a Markdown content file into a brand-locked 16:9 webscroll deck (printable one-slide-per-page) following the Interactius graphic system.

**Architecture:** A deterministic compiler (`parse` → `classify`) turns Markdown into a typed `Deck` model; React layout components (ported from the proven `deck-prototype.html`) render it as a webscroll + print deck. Brand tokens and assets come from the existing SSOT (`lib/tokens.ts`, `public/logo/`). No LLM, no API key, no server route.

**Tech Stack:** Next.js 15 (app router) · React 19 · TypeScript 5.7 · Tailwind 3.4 · `node:test` + Node 24 type-stripping for unit tests (zero new deps) · existing `lib/eval.ts` for tone checks.

**Scope of THIS plan (runnable v1):** compiler core + 7 flagship layouts (cover, split, statement, bullets, columns, gantt, closing) + paragraph fallback + DeckRenderer (webscroll/print) + `/presentaciones` page + tone report. **Follow-up plan:** remaining ~13 layouts and the Phase-2 guided editor (layout-swap, position variants).

**Reference:** the exact CSS/markup for each layout already exists and is committed in `deck-prototype.html` (repo root). Port from it; do not re-derive.

**Test command (no new deps):** `node --test --experimental-strip-types lib/deck/__tests__/` — keep all compiler code **erasable TS** (no `enum`, no parameter properties).

---

### Task 1: Deck model types

**Files:**
- Create: `lib/deck/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type Theme = 'dark' | 'light';
export type Accent = 'opal' | 'bordeaux' | 'emerald';

export type ImageRef = { src?: string; alt?: string; prompt?: string };
export type GanttRow = { label: string; start: number; end: number; accent: Accent };
export type Column = { label: string; heading: string; body: string };

export type Slide =
  | { kind: 'cover'; theme: Theme; title: string; subtitle?: string; eyebrow?: string; client?: string; image?: ImageRef; footer?: string }
  | { kind: 'statement'; theme: Theme; eyebrow?: string; title: string }
  | { kind: 'bullets'; theme: Theme; title: string; items: string[] }
  | { kind: 'columns'; theme: Theme; title: string; columns: Column[] }
  | { kind: 'split'; theme: Theme; eyebrow?: string; title: string; body?: string; image?: ImageRef }
  | { kind: 'gantt'; theme: Theme; title: string; subtitle?: string; weeks: number; rows: GanttRow[]; milestones: number[]; note?: string }
  | { kind: 'paragraph'; theme: Theme; eyebrow?: string; body: string }
  | { kind: 'closing'; theme: Theme; title: string; url?: string };

export type SlideKind = Slide['kind'];
export type Deck = { slides: Slide[] };

// Intermediate produced by parse.ts, consumed by classify.ts
export type Token =
  | { t: 'h'; level: number; text: string }
  | { t: 'caps'; text: string }            // short ALL-CAPS line → eyebrow
  | { t: 'p'; text: string }
  | { t: 'quote'; text: string }           // > line
  | { t: 'ul'; items: string[] }
  | { t: 'image'; alt: string; src: string }
  | { t: 'fence'; lang: string; body: string };
export type SlideSource = { tokens: Token[]; index: number };
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run type-check`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add lib/deck/types.ts
git commit -m "feat(deck): slide model + token types"
```

---

### Task 2: Markdown → SlideSource parser

**Files:**
- Create: `lib/deck/parse.ts`
- Test: `lib/deck/__tests__/parse.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test --experimental-strip-types lib/deck/__tests__/parse.test.ts`
Expected: FAIL (cannot find module `../parse.ts`).

- [ ] **Step 3: Implement the parser**

```ts
import type { SlideSource, Token } from './types.ts';

const isCaps = (l: string) =>
  l.length > 0 && l.length <= 48 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(l) && !/[.;:]/.test(l);

export function parse(md: string): SlideSource[] {
  const chunks = md.replace(/\r\n/g, '\n').split(/\n-{3,}\n/);
  return chunks.map((chunk, index) => ({ index, tokens: tokenize(chunk) }));
}

function tokenize(chunk: string): Token[] {
  const lines = chunk.split('\n');
  const tokens: Token[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    const fence = trimmed.match(/^```(\w+)?\s*$/);
    if (fence) {
      const lang = fence[1] ?? '';
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) { body.push(lines[i]); i++; }
      i++; // closing fence
      tokens.push({ t: 'fence', lang, body: body.join('\n').trim() });
      continue;
    }

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) { tokens.push({ t: 'h', level: h[1].length, text: h[2].trim() }); i++; continue; }

    const img = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (img) { tokens.push({ t: 'image', alt: img[1], src: img[2] }); i++; continue; }

    if (trimmed.startsWith('> ')) { tokens.push({ t: 'quote', text: trimmed.slice(2).trim() }); i++; continue; }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++;
      }
      tokens.push({ t: 'ul', items });
      continue;
    }

    if (isCaps(trimmed)) { tokens.push({ t: 'caps', text: trimmed }); i++; continue; }

    tokens.push({ t: 'p', text: trimmed });
    i++;
  }
  return tokens;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test --experimental-strip-types lib/deck/__tests__/parse.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add lib/deck/parse.ts lib/deck/__tests__/parse.test.ts
git commit -m "feat(deck): markdown→SlideSource parser (TDD)"
```

---

### Task 3: Theme assignment by role

**Files:**
- Create: `lib/deck/theme.ts`
- Test: `lib/deck/__tests__/theme.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themeFor } from '../theme.ts';

test('covers, statements, closings default dark; content default light', () => {
  assert.equal(themeFor('cover', undefined), 'dark');
  assert.equal(themeFor('statement', undefined), 'dark');
  assert.equal(themeFor('closing', undefined), 'dark');
  assert.equal(themeFor('bullets', undefined), 'light');
  assert.equal(themeFor('gantt', undefined), 'light');
});

test('explicit override wins', () => {
  assert.equal(themeFor('bullets', 'dark'), 'dark');
  assert.equal(themeFor('cover', 'light'), 'light');
});
```

- [ ] **Step 2: Run to verify fail**

Run: `node --test --experimental-strip-types lib/deck/__tests__/theme.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
import type { SlideKind, Theme } from './types.ts';

const DARK_BY_ROLE: SlideKind[] = ['cover', 'statement', 'closing'];

export function themeFor(kind: SlideKind, override: Theme | undefined): Theme {
  if (override) return override;
  return DARK_BY_ROLE.includes(kind) ? 'dark' : 'light';
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test --experimental-strip-types lib/deck/__tests__/theme.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add lib/deck/theme.ts lib/deck/__tests__/theme.test.ts
git commit -m "feat(deck): role-based theme assignment (TDD)"
```

---

### Task 4: Gantt data-block parser

**Files:**
- Create: `lib/deck/blocks.ts`
- Test: `lib/deck/__tests__/blocks.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGantt } from '../blocks.ts';

test('parses weeks, rows with ranges, and milestones', () => {
  const g = parseGantt('semanas: 8\nDiagnóstico: 1\nDiscovery: 2-3\nVolumetría: 4-8\nhitos cliente: 1, 3, 5, 8');
  assert.equal(g.weeks, 8);
  assert.deepEqual(g.rows[0], { label: 'Diagnóstico', start: 1, end: 1, accent: 'opal' });
  assert.deepEqual(g.rows[1], { label: 'Discovery', start: 2, end: 3, accent: 'bordeaux' });
  assert.deepEqual(g.rows[2], { label: 'Volumetría', start: 4, end: 8, accent: 'emerald' });
  assert.deepEqual(g.milestones, [1, 3, 5, 8]);
});
```

- [ ] **Step 2: Run to verify fail**

Run: `node --test --experimental-strip-types lib/deck/__tests__/blocks.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { Accent, GanttRow } from './types.ts';

const ACCENTS: Accent[] = ['opal', 'bordeaux', 'emerald'];

export function parseGantt(body: string): { weeks: number; rows: GanttRow[]; milestones: number[] } {
  let weeks = 8;
  const rows: GanttRow[] = [];
  let milestones: number[] = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const [keyPart, valPart] = splitOnce(line, ':');
    const key = keyPart.trim().toLowerCase();
    const val = (valPart ?? '').trim();
    if (key === 'semanas') { weeks = parseInt(val, 10) || weeks; continue; }
    if (key.startsWith('hitos')) { milestones = val.split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n)); continue; }
    const [start, end] = parseRange(val);
    rows.push({ label: keyPart.trim(), start, end, accent: ACCENTS[rows.length % ACCENTS.length] });
  }
  return { weeks, rows, milestones };
}

function splitOnce(s: string, sep: string): [string, string | undefined] {
  const idx = s.indexOf(sep);
  return idx === -1 ? [s, undefined] : [s.slice(0, idx), s.slice(idx + 1)];
}
function parseRange(v: string): [number, number] {
  const m = v.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const n = parseInt(v, 10) || 1;
  return [n, n];
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test --experimental-strip-types lib/deck/__tests__/blocks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/deck/blocks.ts lib/deck/__tests__/blocks.test.ts
git commit -m "feat(deck): gantt data-block parser (TDD)"
```

---

### Task 5: Classifier (SlideSource → Slide)

**Files:**
- Create: `lib/deck/classify.ts`
- Test: `lib/deck/__tests__/classify.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify fail**

Run: `node --test --experimental-strip-types lib/deck/__tests__/classify.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the classifier**

```ts
import type { Slide, SlideSource, Token, Theme, Column } from './types.ts';
import { themeFor } from './theme.ts';
import { parseGantt } from './blocks.ts';

const has = (tokens: Token[], t: Token['t']) => tokens.some((x) => x.t === t);
const find = <T extends Token['t']>(tokens: Token[], t: T) => tokens.find((x) => x.t === t) as Extract<Token, { t: T }> | undefined;
const heading = (tokens: Token[]) => tokens.find((x) => x.t === 'h') as Extract<Token, { t: 'h' }> | undefined;

function overrideTheme(text: string): { clean: string; theme: Theme | undefined } {
  const m = text.match(/\s*\{(oscuro|dark|claro|light)\}\s*$/i);
  if (!m) return { clean: text, theme: undefined };
  const t = m[1].toLowerCase();
  return { clean: text.replace(m[0], '').trim(), theme: t === 'oscuro' || t === 'dark' ? 'dark' : 'light' };
}

export function classify(src: SlideSource, position: number, total: number): Slide {
  const tokens = src.tokens;
  const h = heading(tokens);
  const caps = find(tokens, 'caps');
  const quote = find(tokens, 'quote');
  const image = find(tokens, 'image');
  const fence = find(tokens, 'fence');
  const list = find(tokens, 'ul');
  const subs = tokens.filter((x) => x.t === 'h' && x.level >= 3) as Extract<Token, { t: 'h' }>[];
  const paras = tokens.filter((x) => x.t === 'p') as Extract<Token, { t: 'p' }>[];
  const ov = overrideTheme(h?.text ?? '');
  const title = ov.clean;
  const T = (kind: Slide['kind']) => themeFor(kind, ov.theme);

  // Data blocks first (explicit)
  if (fence && fence.lang === 'gantt') {
    const g = parseGantt(fence.body);
    return { kind: 'gantt', theme: T('gantt'), title: title || 'Roadmap', subtitle: paras[0]?.text, weeks: g.weeks, rows: g.rows, milestones: g.milestones, note: paras[1]?.text };
  }

  const clientLine = quote?.text.match(/^cliente:\s*(.+)$/i);
  const isFirst = position === 0;
  const isLast = position === total - 1;

  // Cover: first slide with an H1 (optionally subtitle/client)
  if (isFirst && h && h.level === 1) {
    return { kind: 'cover', theme: T('cover'), title, subtitle: paras[0]?.text, eyebrow: caps?.text, client: clientLine?.[1]?.trim(), image: image ? { src: image.src, alt: image.alt } : undefined, footer: undefined };
  }

  // Closing: last slide titled Gracias (or H1 with a url-looking paragraph)
  if ((isLast && h && /gracias/i.test(title)) || (isLast && h && paras.some((p) => /www\.|https?:/i.test(p.text)))) {
    const url = paras.find((p) => /www\.|https?:/i.test(p.text))?.text;
    return { kind: 'closing', theme: T('closing'), title: title || 'Gracias', url };
  }

  // Statement: caps eyebrow + heading, no list/image/columns
  if (caps && h && !list && subs.length === 0 && !image) {
    return { kind: 'statement', theme: T('statement'), eyebrow: caps.text, title };
  }

  // Columns: heading + 3+ subheads
  if (h && subs.length >= 2) {
    const columns: Column[] = subs.map((sub, i) => {
      const idx = tokens.indexOf(sub);
      const body = (tokens[idx + 1] && tokens[idx + 1].t === 'p') ? (tokens[idx + 1] as Extract<Token, { t: 'p' }>).text : '';
      return { label: String(i + 1).padStart(2, '0'), heading: sub.text, body };
    });
    return { kind: 'columns', theme: T('columns'), title, columns };
  }

  // Bullets: heading + list
  if (h && list) {
    return { kind: 'bullets', theme: T('bullets'), title, items: list.items };
  }

  // Split: heading + image + paragraph
  if (h && image) {
    return { kind: 'split', theme: T('split'), eyebrow: caps?.text, title, body: paras[0]?.text, image: { src: image.src, alt: image.alt } };
  }

  // Paragraph fallback (also covers contexto: heading + quote/paragraph)
  const body = quote?.text ?? paras[0]?.text ?? title;
  return { kind: 'paragraph', theme: T('paragraph'), eyebrow: caps?.text ?? (h ? undefined : undefined), body };
}

export function compile(md: string, sources: SlideSource[]): Slide[] {
  return sources.map((s, i) => classify(s, i, sources.length));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test --experimental-strip-types lib/deck/__tests__/classify.test.ts`
Expected: PASS (8/8).

- [ ] **Step 5: Commit**

```bash
git add lib/deck/classify.ts lib/deck/__tests__/classify.test.ts
git commit -m "feat(deck): deterministic layout classifier (TDD)"
```

---

### Task 6: Public compile entrypoint + golden fixture

**Files:**
- Create: `lib/deck/index.ts`
- Test: `lib/deck/__tests__/compile.test.ts`
- Create fixture: `lib/deck/__tests__/fixtures/sample.md`

- [ ] **Step 1: Write the entrypoint**

```ts
import { parse } from './parse.ts';
import { compile as classifyAll } from './classify.ts';
import type { Deck } from './types.ts';

export * from './types.ts';

export function compileDeck(md: string): Deck {
  const sources = parse(md);
  return { slides: classifyAll(md, sources) };
}
```

- [ ] **Step 2: Create the fixture** (`lib/deck/__tests__/fixtures/sample.md`)

```markdown
# Propuesta de colaboración
Diagnóstico de criterios y arquitectura de decisión para el ecommerce de la marca.
> cliente: Naturgy

---

EL RETO
# Incrementar la conversión sin añadir más capas al proceso de compra

---

## ¿Cómo lo haremos?
- Auditoría heurística del recorrido completo
- Pruebas con usuarios reales
- Backlog de oportunidades ordenado por criterio

---

## Enfoque
### Tipología
Mystery shopping aplicado a canal online, enfoque mixto.
### Unidad de análisis
El pedido completo, evaluado en dos momentos.
### Momentos
Cuatro semanas de seguimiento y evaluación.

---

## Roadmap
```gantt
semanas: 8
Diagnóstico: 1
Discovery: 2-3
Volumetría: 4-8
hitos cliente: 1, 3, 5, 8
```

---

# Gracias
www.interactius.com
```

- [ ] **Step 3: Write the test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileDeck } from '../index.ts';

const md = readFileSync(fileURLToPath(new URL('./fixtures/sample.md', import.meta.url)), 'utf8');

test('compiles the sample deck to the expected slide kinds', () => {
  const deck = compileDeck(md);
  assert.deepEqual(deck.slides.map((s) => s.kind), ['cover', 'statement', 'bullets', 'columns', 'gantt', 'closing']);
  assert.equal(deck.slides[0].theme, 'dark');   // cover
  assert.equal(deck.slides[2].theme, 'light');  // bullets
});
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test --experimental-strip-types lib/deck/__tests__/compile.test.ts`
Expected: PASS.

- [ ] **Step 5: Full suite + type-check**

Run: `node --test --experimental-strip-types lib/deck/__tests__/ && npm run type-check`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/deck/index.ts lib/deck/__tests__/compile.test.ts lib/deck/__tests__/fixtures/sample.md
git commit -m "feat(deck): compileDeck entrypoint + golden fixture (TDD)"
```

---

### Task 7: Deck CSS module (port from prototype)

**Files:**
- Create: `components/deck/deck.module.css`

- [ ] **Step 1: Port the styles**

Copy every rule from the `<style>` block of `deck-prototype.html` (committed at repo root) into `deck.module.css`, with these adaptations:
- Keep the `:root` custom properties (tokens, `--ml/--mr/--mt/--mb`, `--s`).
- Convert each top-level class to a CSS-module local class (the file already uses plain class names; CSS modules will scope them — reference via `styles.cover`, etc.).
- Keep `.slide`, `.fwrap`, `.frame`, `.theme-dark`, `.theme-light`, all layout classes, `.imgslot`, `#prog` (as `.prog`), and the `@media print` block.
- Remove the inline-only HUD remnants not used by components.

- [ ] **Step 2: Verify it compiles in Next**

Run: `npm run build` (or rely on Task 11 dev-server check)
Expected: no CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add components/deck/deck.module.css
git commit -m "feat(deck): brand-locked deck CSS module (ported from prototype)"
```

---

### Task 8: Shared chrome + ImageSlot components

**Files:**
- Create: `components/deck/Chrome.tsx`
- Create: `components/deck/ImageSlot.tsx`

- [ ] **Step 1: Chrome (persistent brand furniture)**

```tsx
import styles from './deck.module.css';
import type { Theme } from '@/lib/deck/types';

export function Chrome({ theme, page }: { theme: Theme; page: number }) {
  const iso = theme === 'dark' ? '/logo/isotipo-negativo.svg' : '/logo/isotipo-positivo.svg';
  return (
    <>
      <div className={styles.rule} />
      <div className={styles.mark}>
        <img src={iso} alt="" />
        <div className={styles.yr}>2026</div>
      </div>
      <div className={styles.pageno}>{String(page).padStart(2, '0')}</div>
    </>
  );
}
```

- [ ] **Step 2: ImageSlot (editable)**

```tsx
'use client';
import { useState } from 'react';
import styles from './deck.module.css';
import type { ImageRef } from '@/lib/deck/types';

export function ImageSlot({ image, className, style }: { image?: ImageRef; className?: string; style?: React.CSSProperties }) {
  const [src, setSrc] = useState(image?.src);
  const pick = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => { const f = inp.files?.[0]; if (f) setSrc(URL.createObjectURL(f)); };
    inp.click();
  };
  return (
    <div className={`${styles.imgslot} ${className ?? ''}`} style={{ ...style, backgroundImage: src ? `url('${src}')` : undefined }} onClick={pick}>
      {!src && <div className={styles.placeholder}>{image?.prompt ?? 'Imagen · universo visual'}</div>}
      <div className={styles.imghint}>Clic para reemplazar imagen</div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/deck/Chrome.tsx components/deck/ImageSlot.tsx
git commit -m "feat(deck): Chrome + editable ImageSlot components"
```

---

### Task 9: The 7 flagship layout components

**Files:**
- Create: `components/deck/layouts/Cover.tsx`, `Statement.tsx`, `Bullets.tsx`, `Columns.tsx`, `Split.tsx`, `Gantt.tsx`, `Closing.tsx`, `Paragraph.tsx`
- Create: `components/deck/layouts/index.ts`

Each component takes its matching `Slide` variant and renders the exact markup from the corresponding section of `deck-prototype.html`, using `styles` from `deck.module.css`, `<Chrome>` for interiors, and `<ImageSlot>` for images. The wordmark uses `/logo/interactius-negativo.svg` (dark) or `interactius-positivo.svg` (light).

- [ ] **Step 1: Build the 8 components** porting markup 1:1 from the prototype's slides (cover, split, statement, bullets, columns, gantt, closing) plus a `Paragraph` for the fallback (eyebrow + large serif paragraph, mirroring the master's "contexto" slide). Map `slide.kind` props to slots. Example `Statement.tsx`:

```tsx
import styles from '../deck.module.css';
import { Chrome } from '../Chrome';
import type { Slide } from '@/lib/deck/types';

export function Statement({ slide, page }: { slide: Extract<Slide, { kind: 'statement' }>; page: number }) {
  return (
    <div className={`${styles.frame} ${slide.theme === 'dark' ? styles.themeDark : styles.themeLight} ${styles.statement}`}>
      <Chrome theme={slide.theme} page={page} />
      <div className={styles.wrap}>
        {slide.eyebrow && <div className={styles.eyebrow}>{slide.eyebrow}</div>}
        <h2>{slide.title}</h2>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Barrel export** (`components/deck/layouts/index.ts`)

```ts
export { Cover } from './Cover';
export { Statement } from './Statement';
export { Bullets } from './Bullets';
export { Columns } from './Columns';
export { Split } from './Split';
export { Gantt } from './Gantt';
export { Closing } from './Closing';
export { Paragraph } from './Paragraph';
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/deck/layouts
git commit -m "feat(deck): 7 flagship layout components + paragraph fallback"
```

---

### Task 10: DeckRenderer (webscroll + scale + print)

**Files:**
- Create: `components/deck/DeckRenderer.tsx`

- [ ] **Step 1: Build the renderer**

```tsx
'use client';
import { useEffect } from 'react';
import styles from './deck.module.css';
import type { Deck, Slide } from '@/lib/deck/types';
import { Cover, Statement, Bullets, Columns, Split, Gantt, Closing, Paragraph } from './layouts';

function renderSlide(slide: Slide, page: number) {
  switch (slide.kind) {
    case 'cover': return <Cover slide={slide} />;
    case 'statement': return <Statement slide={slide} page={page} />;
    case 'bullets': return <Bullets slide={slide} page={page} />;
    case 'columns': return <Columns slide={slide} page={page} />;
    case 'split': return <Split slide={slide} page={page} />;
    case 'gantt': return <Gantt slide={slide} page={page} />;
    case 'closing': return <Closing slide={slide} />;
    case 'paragraph': return <Paragraph slide={slide} page={page} />;
  }
}

export function DeckRenderer({ deck }: { deck: Deck }) {
  useEffect(() => {
    const fit = () => document.documentElement.style.setProperty('--s', String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div className={styles.deck}>
      {deck.slides.map((slide, i) => (
        <section key={i} className={styles.slide}>
          <div className={styles.fwrap}>{renderSlide(slide, i + 1)}</div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/deck/DeckRenderer.tsx
git commit -m "feat(deck): DeckRenderer (webscroll + responsive scale + print)"
```

---

### Task 11: `/presentaciones` page (input + render + export) and nav

**Files:**
- Create: `app/[locale]/presentaciones/page.tsx`
- Create: `components/deck/DeckStudio.tsx`
- Modify: `lib/sections.ts` (register the section), chrome menu as needed

- [ ] **Step 1: DeckStudio (paste md → compile → render + export)**

```tsx
'use client';
import { useState } from 'react';
import { compileDeck } from '@/lib/deck';
import { DeckRenderer } from './DeckRenderer';
import { ToneReport } from './ToneReport';

const SAMPLE = `# Propuesta de colaboración\nDiagnóstico de criterios para el ecommerce de la marca.\n> cliente: Naturgy\n\n---\n\nEL RETO\n# Incrementar la conversión sin añadir más capas al proceso de compra`;

export function DeckStudio() {
  const [md, setMd] = useState(SAMPLE);
  const [deck, setDeck] = useState(() => compileDeck(SAMPLE));
  return (
    <div>
      <textarea value={md} onChange={(e) => setMd(e.target.value)} aria-label="Contenido markdown" />
      <button onClick={() => setDeck(compileDeck(md))}>Generar</button>
      <button onClick={() => window.print()}>Descargar PDF</button>
      <ToneReport text={md} />
      <DeckRenderer deck={deck} />
    </div>
  );
}
```

- [ ] **Step 2: Page (server component wrapper)**

```tsx
import { DeckStudio } from '@/components/deck/DeckStudio';

export default function Page() {
  return <DeckStudio />;
}
```

- [ ] **Step 3: Register the section** in `lib/sections.ts` following the existing array pattern (id `presentaciones`, label per locale in `messages/*.json`). Match the surrounding code style exactly (read the file first).

- [ ] **Step 4: Run the dev server and screenshot-verify**

Run (background): `npm run dev`
Then with puppeteer-core (already a devDep) + the installed Chrome, navigate to `http://localhost:3000/presentaciones`, screenshot, and confirm the cover + a scrolled interior render on-brand. (Reuse the headless-Chrome screenshot approach from the prototype verification.)
Expected: branded webscroll deck renders; `window.print()` paginates 16:9.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/presentaciones components/deck/DeckStudio.tsx lib/sections.ts messages
git commit -m "feat(presentaciones): /presentaciones page — paste md → branded deck + PDF"
```

---

### Task 12: Tone report (reuse deterministic eval)

**Files:**
- Create: `components/deck/ToneReport.tsx`
- Reference: `lib/eval.ts` (existing — read it first for the exact exported function/shape)

- [ ] **Step 1: Build a client component** that calls the existing eval function over the pasted content and lists violations (red-list term + its `substitutionMatrix` alternative, sentences over 22 words, `!`/`…`). If `lib/eval.ts` exports a server-only or route handler, extract the pure rule function into `lib/eval.ts` exports usable client-side (it is already deterministic/pure). Match its existing types.

- [ ] **Step 2: Type-check + dev render**

Run: `npm run type-check`
Expected: PASS; flags show for a deliberately bad paragraph (e.g. "soluciones innovadoras").

- [ ] **Step 3: Commit**

```bash
git add components/deck/ToneReport.tsx lib/eval.ts
git commit -m "feat(presentaciones): deterministic tone report (reuse eval)"
```

---

### Task 13: End-to-end verification with the master content

**Files:**
- Create: `lib/deck/__tests__/fixtures/master-excerpt.md` (a 10–12 slide excerpt transcribing real master content)

- [ ] **Step 1: Compile-test the excerpt** — extend `compile.test.ts` (or a new test) asserting the slide-kind sequence matches the intended layouts.
- [ ] **Step 2: Dev-server screenshot** of the excerpt rendered, compared side-by-side against the relevant master PDF pages. Fix any grid/margin drift in `deck.module.css`.
- [ ] **Step 3: Print-to-PDF** the excerpt; confirm one 16:9 page per slide.
- [ ] **Step 4: Commit**

```bash
git add lib/deck/__tests__/fixtures/master-excerpt.md lib/deck/__tests__
git commit -m "test(deck): end-to-end master-excerpt verification"
```

---

## Self-review notes

- **Spec coverage:** §2 no-runtime-AI → Tasks 1–6 (pure deterministic). §5 md contract → Tasks 2,4,5. §6 catalog (subset) → Task 9 + Paragraph fallback; remaining layouts = follow-up plan (noted in scope). §7 brand binding → Tasks 7–9 (tokens/assets/logo system). §8 grid → Task 7 vars + Task 13 audit. §9 output webscroll/print → Tasks 7,10. §10 images → Task 8. §11 tone → Task 12. §12 iteration Phase 1 (image upload, paste-and-regenerate) → Tasks 8,11; inline-edit/auto-fit deferred to follow-up. §13 tech → all. §14 testing → node:test throughout.
- **Deferred to follow-up plan (explicit):** remaining ~13 layouts; Phase-2 guided editor (inline text edit, title auto-fit, layout-swap, position variants); standalone HTML export; the optional paid-AI seam.
- **Type consistency:** `Slide` discriminated union (Task 1) is the single source consumed by classifier (Task 5), components (Task 9), renderer (Task 10). `compileDeck` (Task 6) is the one public entry.
