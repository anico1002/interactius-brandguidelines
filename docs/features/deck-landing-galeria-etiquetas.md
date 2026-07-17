# Landing (galería de decks) + etiquetas — Company Deck / DeckMkr

> Convertir la entrada de la app de "abrir directamente el editor" a una **landing tipo Google
> Drive** (buscador predictivo + filtros por etiqueta + grid de miniaturas), sacar el editor a su
> propia ruta `/deck/[id]`, y añadir **etiquetas** al modelo de datos, editables desde la página
> de edición del deck.

## Contexto

Antes, el Deck Maker (`/deck`) abría **directamente en el editor** (`DeckStudio`), sembrado con una
plantilla de ejemplo. La única forma de ver/abrir decks guardados era el desplegable **"Abrir ▾"**
dentro del editor, y **no existía ningún concepto de etiquetas**.

Objetivo: una **landing** con buscador predictivo, una fila de chips de etiquetas para filtrar, y un
**grid de 4 columnas** con las miniaturas de portada de los decks. La primera celda es "Crear nueva
presentación". El **etiquetado ya no se hace al crear**, sino desde la **edición del deck** (click
en su nombre → modal de metadatos).

Decisiones tomadas con el usuario:
- **Miniaturas**: preview real de la portada (primera diapositiva) reutilizando `SlideThumb`.
- **Rutas reales**: `/deck` = landing, `/deck/[id]` = editor (coherente con `/deck/[id]/view`).
- **Etiquetas libres con autocompletar**: texto libre + `datalist` de las ya usadas.

Restricción heredada (ver [deck-persistencia-supabase.md](deck-persistencia-supabase.md)): **no se
introduce CSS de marca nuevo**; todo se compone con los tokens de `components/deck/studio/ui.ts`.

## Cambios realizados

### 1. Modelo de datos — `tags`
- Migración Supabase (`add_tags_to_decks`): `alter table public.decks add column tags text[] not null default '{}'`.
- [lib/decks/types.ts](../../lib/decks/types.ts): `tags: string[]` en `DeckMeta`; `tags` + `md` +
  `type` en `DeckListItem` (los dos últimos alimentan la miniatura de portada de la galería).

### 2. API
- [app/api/decks/route.ts](../../app/api/decks/route.ts): `GET` selecciona/mapea `tags, md, type`;
  `POST` inserta `tags`.
- [app/api/decks/[id]/route.ts](../../app/api/decks/[id]/route.ts): `PATCH` permite `tags`.

### 3. Landing — `/deck`
- [app/deck/page.tsx](../../app/deck/page.tsx): renderiza `<DeckGallery/>`.
- [components/deck/gallery/DeckGallery.tsx](../../components/deck/gallery/DeckGallery.tsx) (nuevo):
  - Carga `listDecks()` + `listClients()`.
  - **Buscador predictivo**: filtra por `commercial_id` a partir del **3.º carácter**.
  - **Chips de etiquetas**: derivadas de las `tags` distintas de todos los decks; varias = AND, y
    en AND con el buscador.
  - **Grid responsive** (`repeat(auto-fill, minmax(min(100%,240px),1fr))`, ~4 columnas en desktop):
    1.ª celda "Crear nueva presentación" (abre `DeckMetaModal` mode `new` → `createDeck` con
    `TEMPLATES[type]` → `router.push('/deck/[id]')`); el resto, tarjetas con miniatura + nombre + fecha.
  - **Miniatura** (`DeckCard`): `compileDeck(md, type).slides[0]` + `SlideThumb`, con ancho vía
    `ResizeObserver`; fallback a placeholder neutro si el `md` está vacío o no compila.

### 4. Editor — `/deck/[id]`
- [app/deck/[id]/page.tsx](../../app/deck/[id]/page.tsx) (nuevo): `<DeckStudio deckId={id}/>`.
- [components/deck/DeckStudio.tsx](../../components/deck/DeckStudio.tsx): prop `deckId`, carga por
  id al montar (`getDeck`), navegación con `useRouter` (abrir/crear → `/deck/[id]`, volver →
  `/deck`), `tags` en `EMPTY_META`/`loadRecord`, y sugerencias de etiquetas (`allTags` vía `listDecks`).
- [components/deck/studio/DeckToolbar.tsx](../../components/deck/studio/DeckToolbar.tsx): botón
  "← Galería" (`onHome`, respeta el guard de cambios sin guardar).

### 5. Etiquetado — `DeckMetaModal`
- [components/deck/studio/DeckMetaModal.tsx](../../components/deck/studio/DeckMetaModal.tsx):
  `MetaValues` gana `tags`; campo de etiquetas con chips (añadir con Enter/coma, quitar con ×,
  borrar el último con Backspace) y `datalist` de `allTags`. Se muestra **solo en modo `edit`**
  (el modal "Nueva" de la landing no permite etiquetar, por requisito).

## Notas
- Los enlaces legacy `#view=…&md=…` apuntaban a `/deck` (antiguo editor raíz), ahora galería; el
  enlace compartible persistente sigue siendo `/deck/[id]/view`.
- API pública (MVP) sin cambios de seguridad; `tags` hereda la política permisiva.
- El link "Presentaciones" del Sidebar/MenuOverlay ya apuntaba a `/deck` → aterriza en la galería.

## Verificación (hecha)
- `npm run type-check` ✅ · `npm run test` (75) ✅.
- `GET /api/decks` devuelve `tags/md/type`; `PATCH {tags}` persiste y se refleja en la lista.
- `/deck` (200) renderiza wordmark + buscador + chips + grid; `/deck/[id]` (200) carga el editor.
</content>
