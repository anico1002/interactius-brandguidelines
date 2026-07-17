# Navegador de diapositivas (Deck Maker) — plan de desarrollo

> Añadir al Deck Maker una **columna vertical de miniaturas** (una por diapositiva) entre el
> editor y la preview, con **mini-render real**, **clic = navegar preview + saltar al editor**,
> **reordenar arrastrando** y un botón **Toggle navegador** para mostrar/ocultar.

## Contexto

El Deck Maker ([DeckStudio.tsx](../../components/deck/DeckStudio.tsx)) compila un único Markdown a un deck y lo muestra en una preview que apila todas las diapositivas ([DeckRenderer.tsx](../../components/deck/DeckRenderer.tsx)). En presentaciones largas no hay forma rápida de orientarse ni saltar a una diapositiva concreta. El wireframe lo-fi añade una **tira de miniaturas** entre el panel "Contenido" y la preview, con un botón "Toggle navegador" en la cabecera del editor.

### Decisiones del usuario
- **Miniaturas: mini-render real** de cada diapositiva (no placeholders).
- **Clic en miniatura: navega la preview** (scroll + resaltado de la activa) **y salta el cursor del editor** al bloque Markdown de esa diapositiva.
- **Reordenar: Fase 2** (fuera del MVP de esta entrega).
- **Toggle iconográfico** (icono, no texto), con los estilos del UI Kit.
- **Ancho de la tira: 156px** (decisión de implementación).

### Alcance MVP (esta entrega) vs Fase 2
- **MVP**: procedencia, mini-render real, tira con activa, clic = navegar preview + saltar al editor, toggle iconográfico.
- **Fase 2**: reordenar arrastrando (drag & drop que reescribe los bloques `---`).

### Restricción de diseño (innegociable)
Se mantiene el diseño visual y se reutiliza el **UI Kit al 100%** (tokens `--c-*`, IBM Plex Mono, easing `expo`). La tira es oscura (`#1C1A17`, como el wireframe) y las miniaturas son el render real sobre su frame claro. **Cero CSS de marca nuevo**; el render del deck no cambia visualmente.

## El punto crítico: diapositivas con y sin origen en el Markdown

`compileDeck()` ([lib/deck/index.ts](../../lib/deck/index.ts)) parte de `parse()` (divide el `.md` por `/\n-{3,}\n/`, **sin offsets**) y luego **inyecta** diapositivas de marca que **no existen en el Markdown**: `manifesto`, `team`, `clients` (tras la portada) y `acceptance` (tras cada `budget`).

Consecuencias:
- **Salto al editor**: solo las diapositivas con origen en un bloque `---` pueden mapearse a una posición del textarea. Las **inyectadas no saltan** (no tienen fuente) → al hacer clic, solo navegan la preview.
- **Reordenar**: solo se pueden reordenar las diapositivas **de contenido** (bloques `---`). Las inyectadas son derivadas: **reflujan automáticamente** al recompilar tras un reordenado. No son arrastrables.

Por eso la primera pieza del plan es exponer la **procedencia** de cada diapositiva compilada.

## Arquitectura

### 1. Procedencia en el pipeline (`lib/deck`)
- **Util de bloques**: `splitSourceBlocks(md): { index, start, end, text }[]` — divide el `.md` con la misma regla que `parse()` pero registrando el **rango de caracteres** de cada bloque (para el salto al editor y el reordenado). Vive en `lib/deck/source.ts`.
- **Procedencia en `compileDeck`**: devolver, junto a `slides`, un array paralelo `provenance: (number | null)[]` donde `provenance[i]` es el índice del bloque fuente o `null` si la diapositiva fue inyectada. Se construye replicando los `splice` de inyección sobre un array de índices. Cambio retrocompatible: se añade `provenance?` al tipo `Deck` (los tests usan `.slides`/`kind`, no se rompen).

### 2. Render reutilizable (`components/deck`)
- **Exportar el render por diapositiva**: extraer el `switch` interno de `DeckRenderer` a `renderSlide(slide, page)` exportable (o un `<SlideFrame slide page/>`), para que la miniatura y la preview usen exactamente el mismo render.
- **Anclas en la preview**: cada `<section className="slide">` recibe `data-ix-slide={i}` (y `id`) para poder hacer `scrollIntoView` y observar la diapositiva activa. Cambio mínimo en `DeckRenderer`.

### 3. `SlideThumb` — mini-render real
- Una miniatura = un contenedor con clase `ix-deck` y una variable `--s` **pequeña** (p. ej. ancho 132px → `--s ≈ 132/1280`), que contiene el `renderSlide(slide)` (el frame de 1280×720 se escala por `--s`, mecanismo ya existente en [deck.css](../../components/deck/deck.css)). Se recorta con `overflow:hidden` a `132 × (720·s)`.
- Se envuelve en `ViewerContext.Provider value={true}` para que `ImageSlot` y demás se rendericen sin hints de edición.
- Número de diapositiva + (opcional) tipo como etiqueta accesible.

### 4. `SlideNavigator` — la tira
- Columna vertical (~150px, fondo `#1C1A17`) scrollable con un `SlideThumb` por `deck.slides`.
- **Activa**: `IntersectionObserver` sobre las `section[data-ix-slide]` de la preview → resalta la miniatura activa y la hace visible en la tira (patrón del [Sidebar](../../components/chrome/Sidebar.tsx) de la guía).
- **Clic**: `scrollIntoView` de la `section` correspondiente en la preview **y**, si `provenance[i] != null`, posiciona el cursor del textarea en `start` del bloque y lo desplaza a la vista (las inyectadas solo navegan la preview).
- **Reordenar (drag & drop)** — **Fase 2**: arrastrable solo en miniaturas con origen (`provenance != null`). Al soltar, se recalcula el orden de los **bloques fuente**, se reescribe el `.md` (uniendo bloques con `\n\n---\n\n`), `setMd` y se recompila; las inyectadas reflujan solas. Las miniaturas inyectadas no se arrastran.

### 5. Integración en `DeckStudio`
- **Toggle iconográfico** en la cabecera del panel "Contenido" (a la derecha): un botón con icono (rectángulos apilados) que muestra/oculta la tira, estilado con los tokens del UI Kit; estado activo coherente con el resto de la barra. Preferencia persistida en `localStorage` (como `asideW`). Por defecto: visible.
- **Layout**: la fila pasa de `editor | handle | preview` a `editor | handle | navigator? | preview` (la tira entre el divisor y la preview).
- **Cableado**: `DeckStudio` posee el `ref` del textarea (para el salto), un `ref` al contenedor de la preview (para observar/scrollear sus `section`), y el callback de reordenado (`setMd`). El deck compilado pasa a exponer `provenance` para el navegador.

## Archivos

**Nuevos**
- `lib/deck/source.ts` — `splitSourceBlocks(md)` con rangos.
- `components/deck/studio/SlideNavigator.tsx` — la tira.
- `components/deck/studio/SlideThumb.tsx` — miniatura (mini-render).

**Modificados**
- [lib/deck/index.ts](../../lib/deck/index.ts) + [lib/deck/types.ts](../../lib/deck/types.ts) — `provenance` en `compileDeck`/`Deck`.
- [components/deck/DeckRenderer.tsx](../../components/deck/DeckRenderer.tsx) — exportar `renderSlide`, `data-ix-slide`/`id` en las `section`.
- [components/deck/DeckStudio.tsx](../../components/deck/DeckStudio.tsx) — toggle, layout con la tira, refs (textarea/preview), reordenado.

## Riesgos / decisiones
- **Mapeo de inyectadas** (la procedencia) es el núcleo; si falla, el salto al editor y el reordenado se desalinean. Tests unitarios de `provenance` sobre el fixture existente.
- **Rendimiento del mini-render**: renderizar N diapositivas reales (con imágenes, SVG de Gantt…) puede pesar en decks largos. MVP directo; si hace falta, virtualizar la tira o cachear miniaturas (futuro).
- **Reordenar y bloques fuente**: reescribir el `.md` normaliza separadores a `\n\n---\n\n` (cambios menores de espaciado). Las diapositivas de marca reflujan al recompilar; se documenta que solo el contenido es reordenable.
- **Estilos del deck en la miniatura**: deck.css cuelga de `.ix-deck`; cada miniatura debe envolverse en `.ix-deck` con su propio `--s`.

## Fases de implementación
1. **Procedencia**: `splitSourceBlocks` + `provenance` en `compileDeck` (+ test).
2. **Render reutilizable**: exportar `renderSlide`, anclas `data-ix-slide` en la preview.
3. **Miniatura**: `SlideThumb` (mini-render en `ix-deck` + ViewerContext).
4. **Tira**: `SlideNavigator` con activa (IntersectionObserver) y clic = scroll preview + salto editor.
5. **Reordenar**: drag & drop de miniaturas de contenido → reescribe el `.md`.
6. **Integración**: toggle + layout + persistencia en `DeckStudio`.
7. **Verificación**: type-check, tests, E2E.

## Verificación
1. La tira muestra **una miniatura por diapositiva** del deck (incluidas las inyectadas) y se actualiza al **Generar**.
2. **Clic** en una miniatura de contenido: la preview se desplaza a esa diapositiva **y** el cursor del editor salta a su bloque Markdown.
3. **Clic** en una inyectada (p. ej. Equipo): navega la preview, no toca el editor.
4. La **miniatura activa** se resalta al hacer scroll en la preview.
5. **Reordenar**: arrastrar una diapositiva de contenido reescribe el `.md` y la preview refleja el nuevo orden; las páginas de marca reflujan solas.
6. **Toggle navegador** muestra/oculta la tira y recuerda la preferencia.
7. `npm run type-check` y `npm run test` en verde.

## Nota de implementación
Se desarrollará en una **branch nueva** (p. ej. `feature/deck-slide-navigator`), partiendo del trabajo de persistencia ([deck-persistencia-supabase.md](deck-persistencia-supabase.md)) ya presente en `DeckStudio`.
