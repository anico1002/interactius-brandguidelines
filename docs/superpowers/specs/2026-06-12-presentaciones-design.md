# Presentaciones — Deck generator · Design doc

**Status:** approved (brainstorm 2026-06-12) · **Branch:** `feat/presentaciones-deck-generator`
**Visual reference:** `~/Desktop/Template-Presentaciones-2026.pdf` (official 51-slide master) · **Proof prototype:** `deck-prototype.html` (repo root)

---

## 1. Goal

A new **"Presentaciones"** section inside the existing brand-guidelines microsite (`brand.interactius.com`). A user pastes a Markdown file of *content* and gets back a **brand-locked 16:9 deck** that they can read online (vertical webscroll), iterate (text + images), and export to PDF (one slide per page). The deck follows the Interactius graphic system to the letter.

The tool is the natural next layer of the site's existing "AI factory": the brand is already packaged for ingestion (`/llms.txt`, `/api/brand.json`, AI Kit). This is the first **generative output** layer.

## 2. Core principle: no runtime AI

The intelligence is **baked in once, by us, into a deterministic compiler** — it is not a per-deck dependency. Generating a deck calls **no LLM, needs no API key, costs nothing**, and runs **client-side in the browser** (content never leaves it).

- Layout selection is driven by the *shape* of the Markdown (deterministic rules), never by the user picking templates per page (that would break "one-shot") and never by a runtime model.
- Tone checking reuses the existing **deterministic** rule engine (`lib/eval.ts` + `substitutionMatrix`).
- **Future seam (not built now):** an optional `✨ Pulir con IA` toggle, OFF by default, that — if Interactius later adds a paid API key — enables hot/runtime AI for generative rewriting and content ideas. It must sit *on top of* the deterministic core without redesigning it.

## 3. Non-goals

- No image generation in-tool (placeholders + manual upload instead).
- No content rewriting/idea-generation in v1 (that stays upstream in the user's own brand-aware AI, via the existing AI Kit).
- No free-form drag editor (would break the grid/brand). Iteration is *guided*.
- No per-page template picker exposed to the user.

## 4. Users & flow

1. **Author content upstream** in any AI loaded with the Interactius brand kit (already exists) → content comes out in-tone by construction.
2. **Open** `brand.interactius.com/presentaciones`, paste/upload the `.md`, press generate.
3. **Deck renders instantly** (deterministic). Tone checker flags any red-list/length/punctuation issues with concrete substitutions.
4. **Iterate**: edit text inline, upload real images one by one, auto-fit overflowing titles, swap a slide to another valid layout.
5. **Export**: read/share as webscroll, or `Cmd+P → Save as PDF` (one 16:9 slide per page).

## 5. The `.md` authoring contract (hybrid)

Plain Markdown that anyone writes naturally; its structure is the signal. Only data-heavy layouts need an explicit block.

**Slide separation:** `---` (horizontal rule) between slides.

**Layout inference (content shape → primitive):**

| What the user writes | Layout |
| --- | --- |
| First slide: `#` title + subtitle + `> cliente: X` | **Cover** (full-bleed image, co-brand) |
| Short UPPERCASE line + `#` big line | **Statement** (eyebrow + huge serif) |
| `##` + `> ` lead paragraph | **Highlighted paragraph** (contexto) |
| `##` + `-` list | **Bullets ◆** |
| `##` + three `###` sub-blocks | **N columns 01·02·03** |
| `##` + image + paragraph | **Image + text split** |
| `#` only (no body) | **Section divider** |
| Last slide `# Gracias` / explicit | **Closing** |

**Eyebrow:** a short ALL-CAPS line at the top of a slide.
**Emphasis in serif headlines:** `/ word /` (slashes) → rendered as the brand's emphasis device.
**Theme override (optional):** `# Title {oscuro}` / `{claro}`. Default = **role-based rhythm** (covers/dividers/statements dark, content light) — NOT mechanical alternation; consecutive same-theme slides are allowed when the content calls for it.
**Image:** `![alt](prompt-or-url)` — if no real asset, becomes a brand placeholder showing the suggested universo-visual prompt; user uploads the real image later.

**Data blocks (explicit, for the few layouts prose can't express):**

```
\`\`\`gantt
semanas: 8
Diagnóstico: 1
Discovery: 2-3
Volumetría: 4-8
hitos cliente: 1, 3, 5, 8
\`\`\`
```

Also: ` ```donut `, ` ```indice `, ` ```diagrama ` (orbit/org), ` ```tabla `, ` ```logos `.

**Fallback ("good designer"):** content that matches no special layout falls gracefully into the cleanest text primitive — it never errors, never leaves the brand.

## 6. Layout primitive catalog (~20, content-agnostic)

Generic design primitives derived from the master — they serve *any* deck type (proposal, training, report, workshop), not just commercial proposals.

- **Structure:** Cover · Section divider / chapter title · Index (auto from sections, page numbers) · Closing.
- **Narrative:** Statement · Pull-quote / `/emphasis/` · Highlighted paragraph · 1 column · 2 columns.
- **Lists:** Bullets ◆ · Numbered list · 2–4 columns `01·02·03` · Card grid (2×3).
- **Image:** Full-bleed cover · Image + text split · Full-bleed image with title · Image/portrait grid (team).
- **Data (explicit block):** Gantt/timeline · Donut/proportion · Relation diagram (orbit/org) · Table/comparison · Logo wall.

Each primitive: one component, one clear purpose, well-defined props (slots). **Adding a new layout = add a component + a mapping rule, nothing else** (extensibility is a first-class property).

## 7. Brand binding (hard rules)

- **Tokens are the SSOT.** Colors, type scale, motion come from `lib/tokens.ts` / `lib/typeScale.ts` / `lib/motion.ts`. Never hardcode a near-miss value.
  - Base: Dark `#1C1A17`, Warm Light `#F5F2ED`, Grey `#E8E6E3`, Warm Dark `#E0DAD2`, Ash `#75706B`, Ash Dark `#46433F`.
  - Accents **only in dataviz** (gantt bars, donuts, role tags): Opal `#B0B5B0`, Bordeaux `#99335F`, Emerald `#5999A6`.
  - Type: IBM Plex Serif (titles, 300/400, no italics) + IBM Plex Mono (body/eyebrows, 400/500/600, no italics). Scale `super→caption`.
- **Brand assets always from the SSOT** (`public/logo/`, `public/sistema-grafico/`). The compiler references them; it NEVER reproduces or approximates them. A guideline update propagates to all future decks.
- **Logo system:** Cover + closing → full horizontal wordmark, SAME size on both. Interiors → compact isotipo as persistent mark. Positivo on light, negativo on dark — automatic by slide theme. Cover wordmark left-justified to the SAME margin line as the title/footer.
- **Voice exceptions:** fixed template text (labels, "Gracias") is not bound by the red list; only *user content* is. Closing exclamation `¡Gracias!` vs `Gracias` is a pending micro-decision (master uses `¡Gracias!`; voice rules forbid `!`).

## 8. Grid discipline (excellence bar)

The tool must "rozar la excelencia gráfica" — no margin/justification errors. A shared grid, identical across every layout:

- Frame: fixed **1280×720** internal coords (16:9), scaled responsively.
- Shared margin vars: content-left `108px`, content-right `108px`, top `64px`, bottom `56px`.
- Left margin column (filete + isotipo) lives outside the content margin (~26–64px).
- Cover/closing/interior elements share the same left line. Every element snaps to the grid.

## 9. Output model

- **Online = webscroll.** Slides are 16:9 frames stacked vertically; navigation is scroll with **scroll-snap**, plus subtle progress dots. No arrows, no click-to-advance (natural for sharing a proposal online).
- **Responsive scale:** each frame is the fixed 1280×720 design scaled by `min(vw/1280, vh/720)`.
- **Print = one 16:9 slide per page.** `@page{ size:1280px 720px; margin:0 }` + `page-break-after` per slide. Verified producing clean N-page 16:9 PDFs. (Export button triggers `window.print()`.)

## 10. Images

- One-shot inserts **brand placeholders** (correct tone rectangle, optionally the suggested universo-visual prompt as a hint).
- Each image slot is **editable**: click → file picker → replace (object URL in the browser; embedded as data URL on export).
- Images go **to the margins / full-bleed** where the layout calls for it (cover fullscreen, split to the edge) — matching the master, not timid contained boxes.

## 11. Tone validation (deterministic, reuse existing)

Run the user's content through the existing engine (`lib/eval.ts`): red-list vocabulary (with `substitutionMatrix` alternatives), sentence length 15–22, no `!`, no `…`. Surface flags inline next to the offending text. No LLM. The subtle "passes filters but sounds generic" case is explicitly out of scope for the deterministic layer (belongs to the future AI seam).

## 12. Iteration — guided web editor (Model 1, phased)

- **Phase 1 (this build):** the one-shot that comes out right by itself + inline text edit + image upload + title auto-fit within the type scale + export. This is ~80% of the value.
- **Phase 2 (later):** "try another valid layout" (the compiler offers 2–3 alternative primitives for that slide's content), predefined position variants, richer guided controls. No free drag.

## 13. Tech approach (in this repo)

Next.js 15 (app router) + React 19 + Tailwind + next-intl, deployed on Vercel. All client-side; no new server route required for v1.

- `lib/deck/parse.ts` — lightweight Markdown→slide-model parser (custom, no heavy deps): split on `---`, tokenize headings/lists/blockquotes/images/fenced data blocks.
- `lib/deck/classify.ts` — deterministic `block(s) → layout primitive` mapping rules (§5), incl. theme-by-role and fallback.
- `lib/deck/types.ts` — `Slide` / `Deck` model (discriminated union per primitive).
- `components/deck/layouts/*` — one component per primitive (ports the proven prototype CSS into the brand's styling approach; consumes tokens).
- `components/deck/DeckRenderer.tsx` — maps the model to layout components; webscroll + scroll-snap + progress dots; print CSS.
- `components/deck/ImageSlot.tsx` — editable image client component.
- `components/deck/ToneReport.tsx` — runs `lib/eval` over content, shows flags.
- `app/[locale]/presentaciones/page.tsx` + section registration in `lib/sections.ts` and the chrome nav/menu.
- Export: `Descargar PDF` (`window.print()`), later `Descargar HTML` (serialize standalone, images as data URLs).

## 14. Testing strategy

- Unit-test `parse.ts` and `classify.ts` against fixture `.md` inputs → expected slide model (TDD: these are pure functions, highest-value to test).
- Snapshot the slide-model JSON for the master-deck content as a golden fixture.
- Visual sanity via the existing headless-Chrome screenshot/PDF flow.
- Verify print produces one 16:9 page per slide.

## 15. Milestones

1. **M1 — Compiler core:** `parse` + `classify` + types, TDD, fixtures. (No UI.)
2. **M2 — Layout library:** the ~20 primitives as components, brand-bound, from the prototype.
3. **M3 — Renderer + page:** `DeckRenderer` (webscroll + print) + `/presentaciones` page wired into nav.
4. **M4 — Iteration:** editable images, inline text edit, title auto-fit, tone report.
5. **M5 — Export + polish:** PDF/HTML export, grid audit, the master deck reproduced end-to-end from a `.md`.

Future: optional paid-AI seam (`✨ Pulir con IA`).
