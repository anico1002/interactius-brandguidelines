# Exportar slides + visor compartible

> **Estado (2026-06-17):** Fase 1 implementada en la branch `feature/deck-export-visor`.
> Ruta visor `app/deck/[id]/view/page.tsx` (server) + `DeckViewerClient.tsx` (compila y
> renderiza sólo las slides, soporta `?print=1`). Botones del Studio reconectados: "Compartir
> URL" copia `/deck/:id/view` y "Descargar PDF" imprime desde el visor limpio para decks
> guardados (con fallback base64/`window.print()` para decks sin guardar). CSS de impresión
> reforzado con `print-color-adjust: exact`. **Fase 2 (export server-side con Puppeteer) sigue
> pendiente** como upgrade opcional.

## Contexto

El sistema de decks renderiza presentaciones en un canvas fijo de **1280×720** con CSS puro en `components/deck/deck.css` (namespaced bajo `.ix-deck`). Hoy el "export" es limitado y frágil:

- **Descargar PDF** = `window.print()` sobre la pantalla del Studio (`DeckStudio.tsx:315`). Depende del diálogo del navegador y de que el usuario ponga márgenes a 0 y active "gráficos de fondo".
- **Compartir URL** = codifica todo el markdown en base64 en el hash (`#view=1&md=…`, `DeckStudio.tsx:265-266`). Es una **instantánea** (no refleja ediciones posteriores), la URL crece sin límite y no usa el deck persistido por id.

Objetivo: **PDF de alta fidelidad** y un **enlace web compartible**, haciendo el sistema más versátil.

La base ya está casi lista: `ViewerContext` existe (`components/deck/viewer.ts`), `DeckRenderer` acepta `viewer` (`DeckRenderer.tsx:30`), las reglas `@media print` ya producen 1 slide 16:9 por página (`deck.css:228-241`), y `puppeteer-core` ya está en devDeps. Lo que falta es **una ruta read-only por id** que sirva de superficie tanto para compartir como para imprimir/renderizar.

## Recomendación (resumen)

La pieza de mayor apalancamiento es **separar la "superficie de render" del Studio**: una ruta read-only `/deck/[id]/view`. Esa única ruta resuelve el enlace compartible *y* se convierte en el objetivo de impresión/render para el PDF — y mañana habilita PNG por slide, embeds, o PPTX sin reescribir nada.

Para el PDF, enfoque por fases:
- **Fase 1 (recomendada para empezar):** PDF de alta fidelidad **vía impresión del navegador sobre la ruta limpia**. Es vectorial, con fuentes reales y gradientes/Gantt perfectos (más fidelidad que cualquier captura raster), **cero infraestructura** y **cero riesgo de timeout en Netlify**. El único roce es el diálogo del navegador.
- **Fase 2 (mejora "un clic", opcional):** ruta de API server-side con `puppeteer-core` + `@sparticuz/chromium` que navega a la ruta limpia y devuelve el PDF con `printBackground`. Quita el diálogo, pero añade el peso operativo de Chromium en Netlify (bundle ~50MB, cold start, timeout 10–26s — viable para ~15-30 slides).

Recomendación: **construir la Fase 1 completa** (visor + impresión pulida) y dejar la Fase 2 como upgrade si el diálogo de impresión molesta en la práctica.

## Cambios

### 1. Ruta read-only del visor por id — `app/deck/[id]/view/page.tsx` (nuevo)

- Server Component que recibe `params.id`, obtiene el deck desde Supabase (reutiliza el patrón de `app/api/decks/[id]/route.ts:10-15` o `supabaseServer().from('decks').select('*')`).
- Pasa `md` + `type` a un Client Component ligero que hace `compileDeck(md, type)` (`lib/deck/index.ts:11`) y renderiza `<DeckRenderer deck={deck} viewer />`.
- Aplica `document.body.classList.add('ix-viewer')` (mismo patrón que `DeckStudio.tsx:179`) para ocultar el chrome del sitio. `metadata: { robots: noindex }`.
- Sin toolbar ni editor: sólo las slides. Esta ruta es la URL para compartir y la superficie de impresión.
- Soportar `?print=1` para que, al cargar, auto-dispare `window.print()` (lo usa el botón del Studio y, más tarde, Puppeteer).

### 2. Reconectar los botones del Studio

- **Compartir URL** (`DeckStudio.tsx:265-266`): si el deck está guardado (tiene id), copiar `${origin}/deck/${id}/view` en vez del hash base64. Mantener el hash como fallback sólo para decks sin guardar (o pedir guardar primero).
- **Descargar PDF** (`DeckStudio.tsx:315`): abrir `/deck/${id}/view?print=1` (deck guardado) en lugar de imprimir el Studio, para que el PDF salga siempre desde la superficie limpia. Para decks sin guardar, conservar el `window.print()` actual.

### 3. Pulir el CSS de impresión

- Revisar `deck.css:228-241`: asegurar `print-color-adjust: exact` / `-webkit-print-color-adjust: exact` en `.ix-deck .frame` (y en fondos con gradiente) para que los fondos oscuros (cover/statement/closing) no se pierdan sin que el usuario tenga que activar "gráficos de fondo".
- Verificar que las fuentes IBM Plex (servidas localmente) se incrustan correctamente en el PDF.

### 4. (Fase 2, opcional) Export server-side de un clic — `app/api/decks/[id]/export/route.ts` (nuevo)

- `POST`/`GET` que lanza `puppeteer-core` conectado a `@sparticuz/chromium` (nueva dep), navega a la URL interna `/deck/[id]/view`, espera a `networkidle`, y `page.pdf({ width: '1280px', height: '720px', printBackground: true, pageRanges })`.
- Devolver el PDF directamente o **guardarlo en Supabase Storage** (bucket `deck-assets`, mismo patrón que `uploadLogo` en `lib/decks/api.ts:67-78`) y devolver una signed URL — esto evita límites de tamaño de respuesta y da un enlace permanente.
- La misma ruta puede emitir **PNG por slide** vía `page.screenshot()` sobre cada `<section id="ix-slide-{i}">` cuando se quiera (versatilidad futura, sin trabajo extra de layout).

## Verificación

1. **Visor compartible:** guardar un deck, copiar "Compartir URL", abrir la URL en una pestaña nueva (idealmente en incógnito) → se ven todas las slides read-only, sin editor ni chrome del sitio, y reflejan el contenido guardado actual.
2. **PDF Fase 1:** desde el Studio pulsar "Descargar PDF" → se abre el visor y el diálogo de impresión; guardar como PDF y comprobar: 1 slide por página a 16:9, fondos oscuros y gradientes presentes, fuentes correctas, Gantt nítido.
3. **CSS print:** imprimir sin tocar "gráficos de fondo" y confirmar que los fondos se mantienen.
4. **Fase 2 (si se implementa):** `curl` a `/api/decks/{id}/export` → recibir PDF/URL válido; medir tiempo de generación contra el timeout de Netlify con un deck de ~25 slides.
5. `npm run build` y los tests existentes (`lib/deck/__tests__/`) siguen verdes.
