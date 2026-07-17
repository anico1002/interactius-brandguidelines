# Layouts declarativos en el Deck Maker — plan de desarrollo

> Desacoplar el **diseño** de la slide de su **contenido**: el usuario declara el layout en el
> Markdown con un marcador `[ly: …]` (como el fence de Gantt), en vez de que el sistema lo
> infiera de los copies. Además, **todas** las slides (incluidas las de marca, hoy inyectadas)
> pasan a declararse y editarse desde el Markdown.

## Contexto

Hoy `lib/deck/classify.ts` **adivina** el layout a partir del contenido (heading+lista→bullets, heading+2 `###`→columnas, eyebrow `EL RETO`→elreto…). Eso ata el diseño a los copies y hace impredecible la maqueta. Además, `compileDeck()` ([index.ts](../../lib/deck/index.ts)) **inyecta** automáticamente 4 páginas de marca con contenido hardcodeado y no editable (Manifiesto, Equipo + `team.png`, Clientes + `clients.png`, Aceptación con la firma de Carlos Ruiz, NIF y aviso legal).

Objetivo: el layout se **elige explícitamente**; el contenido solo rellena los "slots" de ese layout; y no queda nada fuera del Markdown.

### Decisiones tomadas
- **Nomenclatura semántica** (`[ly: split-der]`, `[ly: reto]`…), no descriptiva.
- **Sin marcador → inferencia actual** como fallback (compatibilidad con decks existentes y el SAMPLE; el marcador manda si está).
- **Páginas de marca: defaults + override** — mantienen sus textos/imágenes actuales por defecto y el usuario sobreescribe solo lo que quiera. **Se elimina la inyección automática.**
- **Plantilla comercial de arranque**: al crear un deck "comercial", el editor precarga un Markdown con todas las páginas ya escritas y editables.

## Nomenclatura (marcador `[ly: <nombre>]`, primera línea del bloque)

| Marcador | kind | Slots de contenido |
|---|---|---|
| `[ly: portada]` | cover | título, subtítulo, `> cliente:`, imagen fondo |
| `[ly: cierre]` | closing | título, url |
| `[ly: enunciado]` | statement | antetítulo (CAPS), título |
| `[ly: texto]` | paragraph | antetítulo, párrafo |
| `[ly: lista]` | bullets | título, lista |
| `[ly: columnas]` | columns | título, N× (`###` subtítulo + cuerpo) |
| `[ly: split-izq]` / `[ly: split-der]` | split | antetítulo, título, cuerpo, imagen (lado) |
| `[ly: contexto]` | contexto | párrafo |
| `[ly: reto]` | elreto | título, imagen |
| `[ly: objetivos]` | objetivos | título, lista, imagen |
| `[ly: roadmap]` | roadmapPhases | título, subtítulo, fases (`###`) |
| `[ly: gantt]` | gantt | bloque ```gantt``` (sintaxis actual) |
| `[ly: presupuesto]` | budget | partidas, total, `### Condiciones` |
| `[ly: manifiesto]` | manifesto | título, subtítulo |
| `[ly: equipo]` | team | párrafos, imagen |
| `[ly: clientes]` | clients | imagen |
| `[ly: aceptacion]` | acceptance | título, datos firmante, aviso, CTA, imagen firma |

`split-izq` es el Split actual (imagen a la izquierda); `split-der` es la variante nueva (imagen a la derecha).

## Arquitectura

### 1. Parsing del marcador
- **`lib/deck/parse.ts`**: nuevo token `{ t: 'layout', name: string }`, reconocido por una línea que case `^\[ly:?\s+([a-z0-9-]+)\]$` (insensible a mayúsculas). Se añade en `tokenize()`. (No colisiona con enlaces Markdown: exige que la línea sea exactamente el marcador.)
- **`lib/deck/types.ts`**: añadir el token `layout` a la unión `Token`.

### 2. Refactor de `classify.ts` (elegir vs extraer)
Separar las dos responsabilidades que hoy están mezcladas:
- **Elegir kind**: si el bloque tiene token `layout` → `LAYOUT_MAP[name]` (tabla marcador→kind). Si no → la **inferencia actual** (las reglas de detección por contenido, intactas, como fallback).
- **Construir la slide**: un extractor por kind que vuelca los tokens en los campos tipados (reaprovechando la lógica de extracción que ya existe en `classify.ts`, ahora indexada por kind en vez de descubierta).
- El override de tema `{dark}/{light}` y el `splitOnce`/keywords se conservan.

### 3. `types.ts` — campos nuevos (todos opcionales → defaults en componente)
- `split`: `imageSide?: 'left' | 'right'` (default `left`).
- `manifesto`: `title?`, `subtitle?`.
- `team`: `paragraphs?: string[]`, `image?: ImageRef`.
- `clients`: `image?: ImageRef`.
- `acceptance`: `title?`, `signer?: { name?, role?, company?, nif?, address? }`, `note?`, `cta?`, `signatureImage?`.

### 4. Layouts de marca → editables con defaults
Convertir los 4 componentes de contenido fijo a recibir props opcionales, con los **valores actuales como default** (si el usuario no escribe nada, se ven igual que hoy):
- [Manifesto.tsx](../../components/deck/layouts/Manifesto.tsx), [Team.tsx](../../components/deck/layouts/Team.tsx), [Clients.tsx](../../components/deck/layouts/Clients.tsx), [Acceptance.tsx](../../components/deck/layouts/Acceptance.tsx).
- [DeckRenderer.tsx](../../components/deck/DeckRenderer.tsx) `renderSlide` pasa los nuevos campos.
- Extracción desde Markdown: manifiesto (heading→título, párrafo→subtítulo), equipo (párrafos→`paragraphs`, imagen→`image`), clientes (imagen→`image`), aceptación (heading→título + líneas `clave: valor` para el firmante, reusando el patrón de `parseBudget`/`parseGantt` en [blocks.ts](../../lib/deck/blocks.ts)). Donde falte, default actual.

### 5. Quitar la inyección automática (`compileDeck`)
- Eliminar `COMMERCIAL_INTRO` y el bucle que inserta `acceptance` tras `budget` en [index.ts](../../lib/deck/index.ts). Las slides pasan a ser **1:1** con los bloques del Markdown.
- `provenance` queda **todo no-null** (toda slide tiene origen) → el navegador puede saltar al editor en **todas** las miniaturas (mejora colateral).
- `type` (comercial/informe/genérica) deja de alterar las slides; se conserva como metadato y como selector de **plantilla de arranque**.

### 6. Plantillas de arranque
- Nuevo `lib/deck/templates.ts` con `TEMPLATES[type]` (al menos `comercial`): un Markdown con marcadores y las páginas de marca ya escritas con su contenido por defecto (portada · manifiesto · equipo · clientes · contexto · reto · objetivos · roadmap · gantt · presupuesto · aceptación · cierre).
- [DeckStudio.tsx](../../components/deck/DeckStudio.tsx): al crear (`Nueva`) con un `type`, el `seedMd` sale de `TEMPLATES[type]` en vez del `SAMPLE` único.

### 7. Docs y guía
- Actualizar [docs/presentaciones-md-guia.md](../presentaciones-md-guia.md) con la tabla de marcadores y ejemplos.

## Archivos
**Nuevos:** `lib/deck/templates.ts`.
**Modificados:** `lib/deck/parse.ts`, `lib/deck/types.ts`, `lib/deck/classify.ts`, `lib/deck/index.ts`, `lib/deck/blocks.ts`, `components/deck/layouts/{Manifesto,Team,Clients,Acceptance,Split}.tsx`, `components/deck/DeckRenderer.tsx`, `components/deck/DeckStudio.tsx`, `docs/presentaciones-md-guia.md`, tests en `lib/deck/__tests__/`.

## Riesgos / notas
- **Compatibilidad**: la inferencia se mantiene como fallback; los decks guardados en Supabase y el SAMPLE siguen renderizando igual. Verificar con el fixture.
- **Tests de compilación**: al quitar la inyección, `compile.test.ts` cambia (ya no aparecen manifesto/team/clients/acceptance automáticos). Actualizar expectativas.
- **`type` sin efecto en slides**: documentar que ahora solo elige plantilla; evita confusión.
- **Extracción de la página de aceptación**: el mapeo de datos del firmante (líneas `clave: valor`) es la parte más nueva; empezar simple y, si hace falta, refinar.
- **Mantener el UI Kit**: sin cambios visuales en los layouts salvo la variante `split-der` (espejo del actual).

## Fases de implementación
1. **Marcador**: token `layout` en parse/types + `LAYOUT_MAP`.
2. **Refactor classify**: separar elegir-kind (marcador → fallback inferencia) de construir-slide; tests.
3. **Split der/izq**: `imageSide` en tipo + componente.
4. **Páginas de marca editables**: props + defaults en los 4 componentes + extracción desde Markdown.
5. **Quitar inyección** en `compileDeck` + actualizar `provenance`/tests.
6. **Plantillas** (`templates.ts`) + wiring en `Nueva` de DeckStudio.
7. **Guía** Markdown + verificación.

## Verificación
1. `[ly: lista]` sobre un bloque con un párrafo (sin lista) renderiza el layout de lista (no infiere otro) → **el diseño no depende del contenido**.
2. `[ly: split-der]` coloca la imagen a la derecha; `[ly: split-izq]`, a la izquierda.
3. Un bloque **sin** marcador sigue infiriéndose como hoy (decks existentes intactos).
4. `[ly: aceptacion]` con datos de firmante propios los muestra; sin ellos, sale el default actual.
5. Crear deck "comercial" precarga la plantilla con todas las páginas (incluidas las de marca) **editables**; no se inyecta nada automáticamente.
6. El navegador de diapositivas salta al editor en **todas** las miniaturas (provenance completo).
7. `npm run type-check` y `npm run test` en verde (con `compile.test.ts` actualizado).
