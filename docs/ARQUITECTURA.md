# Arquitectura técnica

> Documento de referencia interno del proyecto **Interactius · Brand Guidelines 2026**.
> Para una visión general empieza por el [README](../README.md).

## 1. Visión general

El proyecto es una aplicación **Next.js 15 (App Router) + React 19** que cumple cuatro funciones desde una única base de código y una única fuente de datos:

1. **Sitio web** del manual de marca, multilingüe (ES · EN · CA).
2. **API de marca** legible por máquina (`/api/brand.json`, `/llms.txt`).
3. **Validador de tono** de copy (`/api/eval`, `/api/eval/manual`).
4. **Generador de presentaciones** Markdown → PDF (`/[locale]/presentaciones`).

El principio rector es **_single source of truth_**: la identidad se declara una vez en TypeScript ([lib/tokens.ts](../lib/tokens.ts)) y se proyecta hacia la UI, las APIs, los prompts de IA y los kits descargables. Cambiar un color o una regla de voz en un solo sitio actualiza todas las salidas.

## 2. Flujo de datos

```
                         lib/tokens.ts
   (colorsBase, colorsAccent, typography, voicePrinciple, voiceAxes,
    forbiddenVocabulary, substitutionMatrix, punctuationRules,
    sentenceLength, examples, brand)
        │              │                 │                  │
        ▼              ▼                 ▼                  ▼
  lib/typeScale   lib/motion      lib/graphics        lib/prompts
   (7 niveles)    (easings/dur.)  (3 formas)      (tone/image/master)
        └──────────────┴────────┬────────┴──────────────────┘
                                │
        ┌───────────────────────┼─────────────────────────┐
        ▼                       ▼                         ▼
  components/sections     lib/llms.ts               lib/eval.ts
  (15 secciones UI)   buildLlmsMarkdown()         evalText(text)
        │                       │                         │
        ▼                       ▼                  ┌──────┴───────┐
   Sitio web            /api/brand.json (JSON)     ▼              ▼
   (ES/EN/CA)           /llms.txt (Markdown)   /api/eval    ToneReport
                                               /api/eval/manual  (decks)
```

Consumidores finales:

- **Humanos** → sitio web + PDF + Brand-Kit.zip.
- **LLMs** → `/llms.txt`, `/api/brand.json`, AI-Kit.zip (Claude Projects, NotebookLM, GPTs, RAG).
- **Automatizaciones** → `/api/eval` para validar copy en pipelines.

## 3. App Router y layouts

| Archivo | Rol |
|---------|-----|
| [app/layout.tsx](../app/layout.tsx) | Root layout. Carga IBM Plex Mono/Serif como variables CSS, define metadata y OpenGraph (`brand.interactius.com`). |
| [app/[locale]/layout.tsx](../app/[locale]/layout.tsx) | Valida el locale (404 si no es válido), monta `NextIntlClientProvider`, `Sidebar`, `MobileHeader` y `MenuOverlay`. Pre-renderiza con `generateStaticParams()`. |
| [app/[locale]/page.tsx](../app/[locale]/page.tsx) | Renderiza las 15 `SectionXxx` en orden. |
| [app/[locale]/presentaciones/page.tsx](../app/[locale]/presentaciones/page.tsx) | Monta el generador de decks (`DeckStudio`). |

## 4. Internacionalización (next-intl)

- **Configuración** en [lib/i18n/routing.ts](../lib/i18n/routing.ts):
  ```ts
  defineRouting({ locales: ['es', 'en', 'ca'], defaultLocale: 'es', localePrefix: 'as-needed' });
  ```
- **Carga de mensajes** en [lib/i18n/request.ts](../lib/i18n/request.ts): valida el locale entrante y hace fallback a `es`; importa dinámicamente `messages/<locale>.json`.
- **Middleware** ([middleware.ts](../middleware.ts)): aplica el routing de locale salvo en rutas excluidas por el matcher:
  ```
  /((?!api|llms.txt|_next|_vercel|.*\..*).*)
  ```
  Es decir, `/api/*`, `/llms.txt`, los assets y los internos de Next/Vercel quedan **fuera** del prefijo de idioma. Por eso `/api/brand.json` es accesible sin `/es/`.

Rutas resultantes:

| Ruta | Locale |
|------|--------|
| `/` | es (por defecto, sin prefijo) |
| `/en`, `/ca` | en / ca |
| `/api/*`, `/llms.txt` | sin locale |

## 5. Sistema de marca (capa `lib/`)

| Módulo | Exporta | Consumido por |
|--------|---------|---------------|
| [lib/tokens.ts](../lib/tokens.ts) | `colorsBase`, `colorsAccent`, `typography`, `voicePrinciple`, `voiceAxes`, `forbiddenVocabulary(Detailed)`, `substitutionMatrix`, `punctuationRules`, `sentenceLength`, `examples`, `brand` | Todo lo demás |
| [lib/typeScale.ts](../lib/typeScale.ts) | Escala fluida de 7 niveles (`super`, `display`, `title`, `title-sm`, `body`, `body-sm`, `caption`) con `clamp()`, line-height y uso | `SectionSistemaTexto`, Tailwind, `llms.ts` |
| [lib/motion.ts](../lib/motion.ts) | 3 easings (`expo`, `hover-wipe`, `page-curtain`) + 6 duraciones (200–1100 ms) + referencias de hero | `SectionMovimiento`, Tailwind, `llms.ts` |
| [lib/graphics.ts](../lib/graphics.ts) | 3 `serviceShapes` (polygon/ellipse/wave) ligadas a color y servicio | `SectionSistemaGrafico`, `llms.ts` |
| [lib/prompts.ts](../lib/prompts.ts) | `getTonePrompt(locale)`, `getImagePrompt(locale)`, `getMasterPrompt(locale)` | `SectionTonoMarca`, `SectionUniversoVisual`, `SectionIaReady`, `llms.ts` |
| [lib/llms.ts](../lib/llms.ts) | `buildLlmsMarkdown()` — compone el documento `/llms.txt` (15 bloques) | `/llms.txt` route, `build-ai-kit` |
| [lib/eval.ts](../lib/eval.ts) | `evalText(text)` — motor de validación de tono | `/api/eval`, `/api/eval/manual`, `ToneReport` |
| [lib/sections.ts](../lib/sections.ts) | Catálogo de 15 secciones (id, num, label i18n) | `Sidebar`, `MenuOverlay` |

### Validación de tono (`evalText`)

`evalText(text): EvalResult` aplica tres familias de reglas:

1. **Vocabulario prohibido** — regex con límites de palabra Unicode sobre cada familia (ES+EN); _hard fail_.
2. **Longitud de frase** — 15–22 palabras (`sentenceLength`); violación _soft_ (advertencia de estilo).
3. **Puntuación** — prohíbe `!`/`¡` y `…`/`...`; _hard fail_.

Puntuación: `100 − 10 × nº de violaciones`, con suelo en 0. `hardFail = true` si hay vocabulario o puntuación prohibidos.

## 6. Componentes

- **`components/sections/`** — una sección de marca por archivo, todas envueltas en `SectionShell` (eyebrow numerado + título + variante light/dark). `page.tsx` las ordena.
- **`components/brand/`** — piezas visuales reutilizables: `LogoStage`, `ColorSwatch` (copia HEX/RGB/CMYK), `TypeSpecimen`, `ClearSpaceDiagram`, `DontGrid`, `EasingCurve` (SVG) y `EasingDemo` (Web Animations API).
- **`components/chrome/`** — navegación: `Sidebar` (desktop, sección activa por `IntersectionObserver`), `MenuOverlay` (móvil, Framer Motion), `MobileHeader`, `LocaleSwitch`.
- **`components/ui/`** — primitivos: `CopyButton` (Clipboard API + toast), `DownloadButton`, `Toast` (Context), `PromptCard`.
- **Estado** — `lib/store/menu.ts` (Zustand) controla el menú móvil; `lib/hooks/useScrollToSection.ts` hace scroll suave con `history.replaceState`.

## 7. Estilos

- **Tailwind** ([tailwind.config.ts](../tailwind.config.ts)) expone los tokens de marca como tema: colores (`dark`, `warm-light`, `opal`, `bordeaux`, `emerald`, semánticos `fg`/`bg`/`muted`), familias `mono`/`serif`, easing `expo` y la escala tipográfica fluida.
- **`app/globals.css`** declara variables CSS (`--c-*`, `--sidebar-w` responsivo, `--ease`), el reset, el _hover-wipe underline_ canónico, el toast y la regla de **cursivas desactivadas** (`em, i, cite… { font-style: normal }`).
- **PostCSS** ([postcss.config.mjs](../postcss.config.mjs)): Tailwind + autoprefixer.

## 8. Configuración de build

- **Next** ([next.config.mjs](../next.config.mjs)) compone dos plugins: `next-intl` (apuntando a `lib/i18n/request.ts`) y `@next/mdx`. `pageExtensions: ['ts','tsx','mdx']`, `reactStrictMode: true`.
- **TypeScript** ([tsconfig.json](../tsconfig.json)): `strict`, `target ES2022`, `moduleResolution: bundler`, alias `@/*` → raíz, `allowImportingTsExtensions` (necesario para los tests con TS nativo).
- **Tests**: `node --test --experimental-strip-types lib/deck/__tests__/*.test.ts` — sin framework externo, ejecuta TypeScript directamente.

## 9. Despliegue

Netlify con `@netlify/plugin-nextjs` ([netlify.toml](../netlify.toml)); build `next build`, publish `.next`. Dominio de producción `https://brand.interactius.com`. `.gitignore` excluye `node_modules`, `.next`, `.netlify`, `tsconfig.tsbuildinfo` y `.env*.local`.

## 10. Convenciones

- **Una fuente de verdad.** Cualquier dato de marca nuevo entra por `lib/tokens.ts` (o el módulo `lib/` correspondiente), nunca hardcodeado en componentes.
- **i18n siempre.** Texto visible → `messages/*.json` en los tres idiomas; nunca literales en componentes.
- **Sin cursivas** y **sin `!`/`…`**: son reglas de marca forzadas por CSS y por el validador.
- **Determinismo en decks.** El generador no usa IA en runtime; el mismo Markdown produce siempre el mismo deck (ver [PRESENTACIONES.md](PRESENTACIONES.md)).
- **Assets generados** (`AI-Kit.zip`, formas SVG) se regeneran con scripts; no se editan a mano.
