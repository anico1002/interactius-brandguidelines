# Sistema de layouts del Deck Maker — referencia

> Cómo funciona el sistema de **layouts declarativos** del generador de presentaciones y cómo
> **añadir uno nuevo**. Para escribir decks (uso), ver [presentaciones-md-guia.md](../presentaciones-md-guia.md).

## Visión general

Cada diapositiva declara su **layout** con un marcador `[ly: nombre]` en la primera línea del bloque
(como el fence de Gantt). El contenido del bloque solo **rellena los huecos** ("slots") de ese layout
— el diseño no depende de los copies. Si una slide **no** lleva marcador, el layout se **infiere** del
contenido (fallback, para compatibilidad). No hay inyección automática: las slides son **1:1** con los
bloques `---` del Markdown.

## Pipeline (con rutas)

```
.md
 └─ parse()                         lib/deck/parse.ts      → tokens (incl. token 'layout')
 └─ classify()                      lib/deck/classify.ts
      ├─ kind:  marcador → LAYOUT_MAP   (si no, detectKind() = inferencia por contenido)
      └─ slide: buildSlide(kind, ctx)   (extractor por kind: vuelca tokens → campos tipados)
 └─ compileDeck()                   lib/deck/index.ts      → Deck (slides 1:1 + provenance)
 └─ renderSlide(slide)              components/deck/DeckRenderer.tsx → <Layout slide/>
 └─ <Layout/>                       components/deck/layouts/*.tsx
 └─ estilos .ix-deck .<layout>      components/deck/deck.css
```

- **Datos tabulares** (gantt/budget): parsers en `lib/deck/blocks.ts` (`parseGantt`, `parseBudget`).
- **`ctx`** (en `classify.ts`) son los "slots" disponibles para los extractores: `h`/`title`,
  `caps` (eyebrow), `quote`, `image`, `fence`, `list`, `subs` (`###`), `paras`, `clientLine`,
  `T(kind)` (tema), `isFirst`/`isLast`.
- **Catálogo único**: `lib/deck/catalog.ts` (`LAYOUT_CATALOG`) es la fuente de la que se **deriva**
  `LAYOUT_MAP`, y de la que comen la **Galería de layouts** y esta documentación.

## Vocabulario (17 layouts)

La lista canónica vive en [`lib/deck/catalog.ts`](../../lib/deck/catalog.ts) y es la que muestra la
**Galería de layouts** (botón iconográfico en la cabecera del editor → tabla con thumbnail esquemático,
marcador, nombre y slots; clic copia el marcador). Marcadores: `portada`, `enunciado`, `texto`, `lista`,
`columnas`, `split-izq`, `split-der`, `contexto`, `reto`, `objetivos`, `roadmap`, `gantt`, `presupuesto`,
`manifiesto`, `equipo`, `clientes`, `aceptacion`, `cierre`.

## Anatomía de un layout (dónde vive cada cosa)

| Concern | Archivo |
|---|---|
| Catálogo (marcador · kind · nombre · slots) | `lib/deck/catalog.ts` (`LAYOUT_CATALOG`) |
| Marcador → kind | `LAYOUT_MAP` (derivado del catálogo) en `lib/deck/catalog.ts` |
| Tipo / slots (unión `Slide`) | `lib/deck/types.ts` |
| Extracción tokens → campos | `buildSlide` en `lib/deck/classify.ts` |
| Inferencia (fallback opcional) | `detectKind` en `lib/deck/classify.ts` |
| Tema por defecto | `DARK_BY_ROLE` en `lib/deck/theme.ts` |
| Componente React | `components/deck/layouts/Xxx.tsx` |
| Export barrel | `components/deck/layouts/index.ts` |
| Render (case) | `renderSlide` en `components/deck/DeckRenderer.tsx` |
| Estilos | `components/deck/deck.css` (`.ix-deck .xxx`) |
| Datos tabulares (si aplica) | `lib/deck/blocks.ts` |
| Thumbnail esquemático (galería) | `components/deck/studio/LayoutThumb.tsx` |
| Guía de autor | `docs/presentaciones-md-guia.md` |

## Checklist: añadir un layout nuevo

Ejemplo guía: un layout `timeline` con marcador `[ly: timeline]`.

1. **Catálogo** — añade la entrada a `LAYOUT_CATALOG` (`catalog.ts`): `{ marker:'timeline', kind:'timeline', name:'Timeline', slots:'…' }`. Esto alimenta `LAYOUT_MAP`, la galería y los tests.
2. **Tipo** — añade la variante a la unión `Slide` en `types.ts` (`kind: 'timeline'` + campos/slots).
3. **Extractor** — añade `case 'timeline'` en `buildSlide` (`classify.ts`) usando `ctx` (title, paras, list, image…).
4. **(Opcional) inferencia** — regla en `detectKind` si quieres que funcione **sin** marcador.
5. **Tema** — si por defecto es oscuro, añade el kind a `DARK_BY_ROLE` (`theme.ts`); si no, queda claro.
6. **Componente** — crea `layouts/Timeline.tsx` (copia uno parecido, p. ej. `Bullets`/`Objetivos`); usa `Chrome`, `inline()` para texto e `ImageSlot` para imágenes.
7. **Barrel** — exporta en `layouts/index.ts`.
8. **Render** — importa y añade `case 'timeline'` en `renderSlide` (`DeckRenderer.tsx`).
9. **CSS** — estilos en `deck.css` bajo `.ix-deck .timeline` (solo tokens del UI Kit).
10. **Thumbnail** — añade un esquema en `LayoutThumb.tsx` (un `case 'timeline'` con rects placeholder).
11. **Guía** — fila del marcador en `presentaciones-md-guia.md`.
12. **Test** — caso en `classify.test.ts` (`[ly: timeline]` → kind + slots). El test de `catalog.test.ts` ya exige que el kind esté cubierto.

**Red de seguridad:** el `switch` exhaustivo sobre `Slide['kind']` hace que, al añadir el tipo en el
paso 2, **TypeScript te obligue** a cubrir los dos sitios que faltan (`buildSlide` y `renderSlide`):
`npm run type-check` falla y te señala exactamente dónde. Es "semi-automático" por diseño.

## Notas

- La inferencia (`detectKind`) es solo **fallback**; el marcador siempre manda.
- **Páginas de marca** (`manifiesto`/`equipo`/`clientes`/`aceptacion`): contenido editable desde el
  Markdown con el copy canónico como **default** (sin inyección automática).
- **Variantes con el mismo kind** por marcador: `split-der`/`split-izq` → campo `imageSide` (default
  derecha); dos entradas en el catálogo, mismo `kind`, distinto thumbnail.
- **Gantt**: la palabra de la línea del eje es la unidad (`semanas:`/`meses:`/`días:`).
- **Ampliación futura** (no implementada): un *script de scaffolding* que genere los stubs de los
  pasos 1–12 reduciría el alta a rellenar detalles.
