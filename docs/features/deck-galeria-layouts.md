# Galería de layouts + documentación del sistema de layouts

> Dos entregables: (1) un **documento de referencia** del sistema de layouts declarativos con
> un checklist para añadir uno nuevo; (2) una nueva función **"Galería de layouts"**: un popup
> que cataloga los layouts disponibles (thumbnail esquemático · marcador · nombre · slots) y
> copia el marcador al portapapeles. Además, **tooltips on-hover** en los botones iconográficos.

## Contexto

El sistema de layouts declarativos (`[ly: …]`) ya está construido, pero no hay forma de
**descubrir** los layouts disponibles desde el editor ni documentación de cómo funciona/ampliarlo.
El wireframe añade un botón iconográfico en la cabecera del panel "Contenido" que abre un popup
"Galería de Layouts" con una tabla scrollable de todos los layouts.

### Decisiones tomadas
- **Al clic en un layout: copia el marcador** `[ly: nombre]` al portapapeles (de momento; insertar
  en el editor queda para más adelante).
- **Thumbnail esquemático con placeholders** (no contenido real), dibujado en **SVG**, que muestra
  la estructura del layout (dónde va título/imagen/columnas).
- **Botón iconográfico** (como el toggle del navegador) para abrir la galería.
- **Tooltips on-hover** con el nombre de la acción en los botones iconográficos.

## Parte A — Función "Galería de layouts"

### 1. Catálogo único de layouts
Nuevo `lib/deck/catalog.ts` con `LAYOUT_CATALOG`: una entrada por marcador con
`{ marker, kind, name, slots }` (datos puros, sin UI). Es la **fuente única**:
- `LAYOUT_MAP` en [classify.ts](../../lib/deck/classify.ts) pasa a **derivarse** del catálogo (`Object.fromEntries(LAYOUT_CATALOG.map(c => [c.marker, c.kind]))`) → una sola lista que mantener. Cambio mínimo y cubierto por los tests de classify.
- La galería y la documentación leen el mismo catálogo (sin riesgo de desincronización).

Cubre los 17 marcadores actuales (portada, cierre, enunciado, texto, lista, columnas, split-der/izq,
contexto, reto, objetivos, roadmap, gantt, presupuesto, manifiesto, equipo, clientes, aceptacion).

### 2. Thumbnail esquemático (SVG)
Nuevo `components/deck/studio/LayoutThumb.tsx`: un SVG 16:9 con **rectángulos placeholder** que
representan la maqueta. Mapea cada marcador a un "esquema" (p. ej. *cover* = imagen full + barra de
título; *split-der* = bloques de texto izq + imagen dcha; *columnas* = 3 bloques; *gantt* = rejilla
con barras; *clientes* = grid de logos…). ~10 esquemas cubren los 17 layouts. Solo tonos del UI Kit
(gris/`warm-dark` sobre `warm-light`); sin contenido real.

### 3. Popup "Galería de layouts"
Nuevo `components/deck/studio/LayoutGallery.tsx` usando el shell [Modal.tsx](../../components/deck/studio/Modal.tsx):
- Tabla scrollable, una fila por entrada del catálogo: **Thumbnail (SVG) · `[ly: marcador]` · Nombre · Slots**.
- **Clic en una fila → copia `[ly: marcador]`** al portapapeles (Clipboard API) con feedback breve
  ("Copiado ✓") por fila.
- Botón **"Aceptar"** cierra (cierra también con Escape/backdrop, como los demás modales).
- Estilos 100% UI Kit (mono, `warm-light`, borde `warm-dark`).

### 4. Botón iconográfico + apertura
En [DeckStudio.tsx](../../components/deck/DeckStudio.tsx), cabecera del panel
"Contenido": añadir un botón **iconográfico** (icono tipo rejilla/galería) junto al toggle del
navegador, que abre la galería (estado `galleryOpen`). Mismo estilo que el toggle del navegador.

### 5. Tooltips on-hover (botones iconográficos)
Nuevo `components/deck/studio/IconButton.tsx`: envoltorio reutilizable = icono + **tooltip** (etiqueta
oscura que aparece on-hover/focus, estilada con tokens del UI Kit). Se aplica a:
- el botón de **Galería de layouts** ("Galería de layouts"),
- el **toggle del navegador** (hoy solo tiene `title` nativo) → "Mostrar/Ocultar navegador".
Accesible (aria-label) y sin romper el layout de la cabecera.

## Parte B — Documentación del sistema de layouts

Nuevo `docs/features/deck-layouts-sistema.md` (referencia para desarrolladores):
- **Visión general** (declarativo; marcador manda; inferencia como fallback; sin inyección).
- **Pipeline con rutas**: `parse` (token `layout`) → `classify` (`LAYOUT_MAP`←catálogo / `detectKind`
  fallback; `buildSlide` extractores) → `compileDeck` (1:1) → `renderSlide` → componente → `deck.css`.
  Datos tabulares en `blocks.ts`; los "slots" disponibles en `ctx`.
- **Vocabulario** de los 17 marcadores (generado conceptualmente desde `LAYOUT_CATALOG`).
- **Anatomía de un layout** (tabla "concern → archivo").
- **Checklist para añadir un layout** (12 pasos), actualizado: ahora incluye **"añade la entrada al
  `LAYOUT_CATALOG`"** (que alimenta `LAYOUT_MAP`, la galería y el thumbnail) + tipo en `types.ts` +
  `buildSlide` + componente + barrel + `case` en `renderSlide` + CSS + esquema de thumbnail + test.
  Destacar la red de seguridad: el `switch` exhaustivo sobre `Slide['kind']` hace que TypeScript
  obligue a cubrir extractor y render.

## Archivos
**Nuevos:** `lib/deck/catalog.ts`, `components/deck/studio/LayoutThumb.tsx`,
`components/deck/studio/LayoutGallery.tsx`, `components/deck/studio/IconButton.tsx`,
`docs/features/deck-layouts-sistema.md`.
**Modificados:** `lib/deck/classify.ts` (LAYOUT_MAP←catálogo), `components/deck/DeckStudio.tsx`
(botón galería + modal + tooltip en el toggle), `lib/deck/__tests__/` (consistencia catálogo↔kinds).

## Riesgos / notas
- `LAYOUT_MAP` derivado del catálogo: cambio pequeño; los tests de `classify`/`compile` lo cubren.
- ~17 esquemas SVG es la parte más laboriosa; se agrupan en ~10 plantillas reutilizables.
- Mantener el UI Kit: galería, tooltip y thumbnails solo con tokens existentes.
- `split-der`/`split-izq` son dos entradas del catálogo con el mismo `kind` (distinto thumbnail).

## Fases
1. Catálogo (`catalog.ts`) + derivar `LAYOUT_MAP` + test de consistencia.
2. `LayoutThumb` (esquemas SVG).
3. `LayoutGallery` (tabla + copiar marcador) + `IconButton` (tooltip).
4. Wiring en DeckStudio (botón galería en la cabecera + tooltip en el toggle del navegador).
5. Documentación `deck-layouts-sistema.md`.
6. Verificación.

## Verificación
1. El botón iconográfico de la cabecera abre el popup "Galería de Layouts".
2. La tabla lista los 17 layouts con thumbnail esquemático, marcador, nombre y slots.
3. Clic en una fila **copia** `[ly: marcador]` al portapapeles (comprobar contenido del clipboard) con feedback.
4. **Aceptar**/Escape cierran.
5. **Tooltips**: al pasar el ratón por el botón de galería y el toggle del navegador aparece el nombre de la acción.
6. `LAYOUT_CATALOG` y `LAYOUT_MAP` cuadran (test); `npm run type-check` y `npm run test` en verde.
7. El doc `deck-layouts-sistema.md` abre y sus rutas/enlaces resuelven.
