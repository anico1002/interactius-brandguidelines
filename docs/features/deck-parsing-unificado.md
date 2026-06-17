# Unificar el parsing markdown → HTML de las slides

## Context

El generador de decks compila markdown → `Slide` tipado → componentes de layout. Hoy la
**extracción es ad-hoc por layout**: cada arm del `switch` en `buildSlide` ([classify.ts:119](lib/deck/classify.ts#L119))
lee los tokens a su manera, lo que produce dos problemas:

1. **Semántica de encabezados incoherente**: solo `cover` exige `#` (h.level===1, [classify.ts:107](lib/deck/classify.ts#L107));
   el resto usa "el primer encabezado a cualquier nivel" como título, y las plantillas escriben
   `## Objetivos`, `## Presupuesto`, `## Roadmap`, `## Calendari`. Así `#` vs `##` no significan lo mismo.
2. **Drops silenciosos**: cada kind solo lee los tokens que quiere. Listas, párrafos de más, subtítulos
   (`##`), segundas imágenes, fences no-gantt, quotes… se pierden sin aviso (el bug de la lista de
   `equipo` que arreglamos era un caso de esto).

Objetivo: **un parsing unificado** donde cada elemento markdown significa lo mismo en todos los layouts
(`#` = título grande, `##` = subtítulo, `###` = secciones, `-` = lista, `>` = cita, `![]()` = imagen,
LÍNEA EN MAYÚSCULAS = antetítulo, `clave: valor` = meta), ganando versatilidad pero **sin romper nunca el
diseño** (lienzo fijo 1280×720, UI Kit).

**Decisiones del usuario:**
- Contenido que un layout no puede colocar → **ignorar por defecto + avisar** en el editor; el render
  queda idéntico a hoy; la versatilidad (pintar el extra) se habilita solo donde hay sitio seguro.
- Ejecutar **todo (Fases 1+2+3)**.

## Arquitectura: un modelo canónico (BlockModel) + un solo parser

Núcleo: insertar una representación intermedia normalizada entre tokenizar y construir la slide. Nuevo
fichero `lib/deck/model.ts`:

```
type Section = { heading: string; level: number; body: string[]; items: string[]; image?: ImageRef };
type BlockModel = {
  marker?: string; eyebrow?: string; title?: string; subtitle?: string;
  body: string[]; quotes: string[]; items: string[]; lists: string[][];
  sections: Section[]; images: ImageRef[]; meta: Record<string,string>;
  fences: {lang:string; body:string}[]; theme?: Theme;
  position: { index:number; isFirst:boolean; isLast:boolean };
};
```

`parseBlock(tokens, position, total)` hace **una** pasada lineal y captura TODO (nada se pierde a nivel de
datos). Reutiliza la lógica ya probada: `extractPhases`/columns ([classify.ts:11](lib/deck/classify.ts#L11)),
`kvLines` ([classify.ts:38](lib/deck/classify.ts#L38)), `overrideTheme` ([classify.ts:30](lib/deck/classify.ts#L30)).

### Regla de encabezados (compatible hacia atrás — la clave)

De todos los `h` del bloque, `minLevel = min(niveles presentes)`:
- `title` = primer encabezado de nivel `minLevel`.
- `subtitle` = primer encabezado de nivel > `minLevel` que aparezca **antes** de cualquier sección `###`.
- `###`+ nunca son título/subtítulo → van a `sections` (columnas/fases/condiciones).

Consecuencias: `# T` → título `T`; `# T` + `## S` → título+subtítulo (lo deseado); **`## T` solo → título**
(mantiene vivos los 3 decks guardados y las plantillas `## Objetivos`/`## Presupuesto`/`## Roadmap`). Es lo
que hace `#`/`##` consistentes **sin** romper los decks con `##`.

## Mapeo role → slot por layout

`buildSlide(kind, model, marker)` se reescribe para leer **solo** del modelo (nunca tokens). El `Slide`
([types.ts:11](lib/deck/types.ts#L11)) **no cambia en Fase 1**: sus campos se nutren del modelo. Resumen
del mapeo (rol → el slot/campo que el layout ya pinta):

- **cover**: title=`title`, subtitle=`subtitle ?? body[0]`, eyebrow, image=`images[0]`, client=`meta.cliente`.
- **statement/elreto/objetivos/bullets/split**: title=`title`, eyebrow, body=`body[0]`, items=`items`, image=`images[0]`.
- **paragraph**: body=`quotes[0] ?? body[0] ?? title`, eyebrow.
- **contexto**: eyebrow=`eyebrow ?? 'Contexto'`, body=`body.join(' ') ?? quotes[0]`, long=len≥150.
- **manifesto**: title=`title ?? body[0]`, subtitle=`subtitle ?? body[next]` (fallback all-or-nothing ya existente).
- **team**: body→paragraphs, items, image. **clients**: image.
- **closing**: title, url = body que casa la regex de URL.
- **Layouts estructurados** (mismo modelo, parser tipado): **gantt** `parseGantt(fences['gantt']?.body ?? meta/body kv)`;
  **budget** `parseBudget(model)` leyendo `lists` + sección `Condiciones`; **columns** `sections.map(...)`→`Column[]`;
  **roadmapPhases** `sections.map(...)`→`Phase[]`; **acceptance** `meta`→`Signer`/note/cta.

Así "estructurado" deja de ser un camino paralelo: es una vista tipada del mismo modelo (`sections`/`meta`/`fences`).

`detectKind` ([classify.ts:94](lib/deck/classify.ts#L94)) se **mantiene como fallback** (solo corre sin
`[ly:]`), reescrito para leer del modelo.

## Primitivas de render + inline (Fase 2)

Nuevo `components/deck/roles.tsx`: vocabulario fijo y styled, cada uno emite **un** elemento con su clase de
`deck.css` ya existente (`.eyebrow`, `.title`, `.sub`, `.body`, `.list`, nueva `.quote` al estilo de `.body`):
`<Eyebrow>`, `<Title>`, `<Subtitle>`, `<Body>`, `<List>` (◆), `<Quote>`, `<Figure>` (envuelve `ImageSlot`).
Los layouts **componen** estas primitivas en vez de escribir divs a mano → mismo elemento = mismo significado
y mismo aspecto en todas partes. No se introduce lenguaje visual nuevo.

**Inline unificado**: aplicar `inline()` ([inline.tsx](components/deck/inline.tsx)) también a **títulos/subtítulos/antetítulos**
vía `<Title>`/`<Subtitle>`. Es seguro: `inline()` solo emite `<strong>`/`<span class="emph">` y devuelve el
string crudo si no hay `**`/`/ /` → los títulos planos quedan byte-idénticos. Resultado: negrita y énfasis
`/ … /` significan lo mismo en **todos** los slots de texto, incluidos los títulos.

## Contenido sobrante: ignorar + avisar (Fase 3)

Por defecto el render es **idéntico a hoy**: el modelo captura todo, pero cada layout solo pinta lo que cabe.
- `parseBlock` registra qué campos consumió cada kind; un `validateBlock(model, kind)` (solo dev) devuelve
  avisos ("split descarta: 2 párrafos, 1 lista") que se muestran en el editor (`DeckStudio` ya recompila al
  editar, [DeckStudio.tsx:178](components/deck/DeckStudio.tsx#L178)).
- **Versatilidad opt-in**: los layouts con región segura (p. ej. `paragraph`, `team`, columna de texto con
  scroll) pueden renderizar el "stack" de contenido extra con las primitivas; los layouts sin sitio nunca lo
  hacen. Versatilidad donde el diseño lo tolera, seguridad absoluta en el resto.

## Compatibilidad y migración

- **Decks guardados (3) y plantillas**: intactos. La regla de encabezados mantiene `##`-solo como título;
  `compileDeck` y las formas de `Slide` no cambian. Sin migración de BD ni reescritura de markdown.
- Migrar las plantillas a `#` para los títulos grandes (`## Objetivos` → `# Objetivos`) es **editorial y
  opcional**, diferible: una vez normalizado, el nivel del encabezado ya no afecta al render.

## Rollout por fases (cada una entregable y verificable)

- **Fase 0 — Tests de caracterización**: snapshot del `compileDeck` actual de las 3 plantillas + fixtures que
  imiten los 3 decks guardados. Oráculo de regresión.
- **Fase 1 — Parser unificado tras el seam actual**: `model.ts` + `parseBlock`; reescribir `classify.ts` para
  leer el modelo; retargetear `parseBudget`. **`Slide`, los 17 componentes, `deck.css` y `compileDeck` sin
  tocar.** Verificación: los snapshots de Fase 0 deben ser **byte-idénticos**. Arregla los drops en la capa de datos.
- **Fase 2 — Primitivas de render + inline en títulos**: `roles.tsx`; componer layouts; `inline()` en títulos.
  Único delta visual intencionado: negrita/énfasis en títulos.
- **Fase 3 — Overflow opt-in + avisos de validación**: `validateBlock` + superficie de avisos en `DeckStudio`;
  overflow solo en layouts con región segura.

## Verificación

Suite `node --test --experimental-strip-types lib/deck/__tests__/*.test.ts`:
1. `model.test.ts` (nuevo): `parseBlock` por elemento (`#/##/###`, `-`, `>`, `![]()`, CAPS, `clave:valor`, fence);
   regla de encabezados (`##`-solo→título; `#`+`##`→título+subtítulo; `###` nunca título).
2. Tests de mapeo por layout (extender `classify.test.ts`/`editable-content.test.ts`): cada kind lee los campos
   correctos; casos antes descartados (2ª imagen en `images`, fence no-gantt en `fences`).
3. **Snapshots de compatibilidad (oráculo Fase 0)**: `compileDeck(TEMPLATES.*)` + fixtures de los 3 decks
   guardados → `Slide[]` idéntico antes/después de Fase 1.
4. Round-trips: `source.test.ts` (provenance 1:1) sigue verde; `parseBlock` no altera límites de bloque.
5. Inline-en-títulos (Fase 2): el campo título conserva `**`/`/ /` verbatim y el componente renderiza
   `<strong>`/`.emph` (render con react-dom/server o jsdom).
6. Render check: renderizar cada layout a string para un modelo representativo y comprobar el set de clases fijo
   (`.eyebrow`/`.title`/`.body`/`.list`…) y que no aparecen etiquetas inesperadas. Spot-check manual en `DeckStudio`
   y en producción (viewer de un deck guardado) antes de cada deploy.

## Proceso (buenas prácticas)
- Antes de desarrollar: **crear rama nueva** (p. ej. `feature/deck-parsing-unificado`).
- Guardar este plan en el repo: `docs/features/deck-parsing-unificado.md`.
- Por fases: cada fase es un commit/entregable verificable; no hacer push/deploy hasta que el usuario lo decida.

## Ficheros críticos
- `lib/deck/model.ts` (nuevo — `BlockModel` + `parseBlock` + `validateBlock`)
- `lib/deck/classify.ts` (sustituir la extracción ad-hoc por lectura del modelo; `detectKind` como fallback)
- `lib/deck/blocks.ts` (`parseGantt`/`parseBudget` sobre el modelo)
- `lib/deck/types.ts` (tipos `BlockModel`/`Section`; `Slide` sin cambios en Fase 1)
- `components/deck/roles.tsx` (nuevo — primitivas) + `components/deck/inline.tsx` (inline en títulos)
- `components/deck/layouts/*.tsx` (componer primitivas — Fase 2) · `components/deck/DeckStudio.tsx` (avisos — Fase 3)
