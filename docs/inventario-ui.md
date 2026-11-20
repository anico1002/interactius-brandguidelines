# Inventario de componentes de interfaz — estado de facto (2026-11-20)

> Punto de partida para canonizar botones, campos y demás componentes en las guidelines.
> Recoge **lo que hay en el código hoy**, no lo que debería haber. Las decisiones de qué se
> canoniza son de Alberto; aquí solo hay datos y hallazgos.

## Alcance

Todo lo construido sobre la marca fuera del manual, dentro de este repo:

| Herramienta | Dónde | Quién |
|---|---|---|
| Web de guidelines | `components/ui`, `app/globals.css` | Alberto (mayo) |
| Deck Maker (editor + galería + login) | `components/deck/studio`, `deck/gallery`, `deck/auth` | Carlos Ruiz (jun–ago) |
| FormMaker (editor + galería) | `components/forms/maker` | Carlos Ruiz (ago) |
| Formulario público (cara al cliente) | `components/forms/forms.css`, `forms/fields` | Carlos Ruiz (jul) |
| Timer | `components/timer` | Carlos Ruiz (jul) |
| Workspace (lanzador) | `components/workspace` | Carlos Ruiz (ago) |
| Piezas compartidas | `components/studio` | Carlos Ruiz (ago) |

### Dónde vive hoy la "norma" de facto

| Archivo | Qué define | Forma |
|---|---|---|
| `components/deck/studio/ui.ts` | **El UI Kit real**: botones, segmentado, label, input, modal, menú | estilos inline (TS) |
| `components/deck/auth/authUi.ts` | Login: tarjeta, input, submit, enlace, avisos | estilos inline, deriva de `ui.ts` |
| `components/studio/*` | Buscador, filtros, etiquetas, acciones de tarjeta, logout | inline, reutiliza `ui.ts` |
| `components/forms/forms.css` | Formulario público | CSS, `--c-*` |
| `components/workspace/workspace.css` | Cabecera y tarjetas del lanzador | CSS, `--c-*` |
| `components/timer/timer.css` | Timer | CSS, `--c-*` |
| `app/globals.css` | `hover-wipe-underline` y `hover-wipe-relay` ("canonical Interactius") | CSS |

Ninguno de estos valores está en `lib/tokens.ts` ni en `lib/typeScale.ts`.

---

## 1 · Botones

Hay **dos familias** que nunca se han reconciliado:

- **A · Enlace con wipe**: la de la web. Es texto sin caja.
- **B · Bloque mono**: la de las herramientas. Es una caja con filete.

### A · Enlace con wipe (web, Timer, Copiar/Descargar)

| Variante | Valores | Uso |
|---|---|---|
| `hover-wipe-underline` | opacidad .6 → 1, subrayado 1px a −4px, se redibuja de izquierda a derecha en 0.5s `cubic-bezier(.45,0,.15,1)` | `CopyButton`, `DownloadButton` (mono, caption, mayúsculas, .04em) |
| `hover-wipe-relay` | variante de relevo del mismo gesto | Timer (`.ixt-lnk`, con `--wipe-offset: 0`) |
| Timer `--lead` / `--quiet` / `--accent` / `--tiny` | serif 400 title-sm · Ash · Burdeos · caption en mayúsculas | controles del Timer |

### B · Bloque mono (herramientas) — base: IBM Plex Mono 500, sin radio

| Rol | Fondo / texto / filete | Tipo | Padding | Dónde |
|---|---|---|---|---|
| **Primario** `btn` | Dark / Warm Light / Dark | 11px · .04em | 10/12 | Guardar, confirmar en modales |
| Primario de login `submit` | igual | **12px** · .04em | **12** · ancho 100% | Login, reset |
| **Secundario** `btnGhost` | transparente / Dark / Dark | 11px | 10/12 | Cancelar |
| **Peligro** `btnDanger` | transparente / Burdeos / Burdeos | 11px | 10/12 | Eliminar |
| **Barra** `toolbarBtn` | White / Dark / Warm Dark | 11px · .04em | 9/12 | Revisar tono, PDF, Compartir |
| Barra activa (toggle) | invierte a Dark / Warm Light | — | — | Revisar tono activo |
| Publicar desactivado | Warm Dark / Warm Light | — | — | FormMaker |
| **Icono con filete** `IconButton` | White / Dark / Warm Dark; activo invertido | — | 5/6 | barra del editor. Transición .25s expo |
| Icono desnudo `iconBtn` | sin filete, Ash | 12px | 4 | menú Abrir |
| **Acción sobre tarjeta** `CardActions` | tinta 72% → 94%, icono blanco, 26×26, **radio 4** | — | — | duplicar/eliminar (galerías), papelera de imágenes |
| Cerrar sesión `bar` | White / Ash / Warm Dark | **10px · .06em · MAYÚSCULAS** | 7/12 | cabecera de galerías |
| ~~Cerrar sesión `avatar`~~ | círculo 40, filete Ash | — | — | código muerto: ninguna pantalla lo usaba; retirado (nov. 2026) |
| Indicador de guardado | texto, sin caja | deck **500 11px** · forms **400 10px** | — | barras de editor |
| Título editable | caja aparece al hover | 500 15px MAYÚSCULAS · .02em | 7/10 | barras de editor |
| Elegir imagen del hero | tinta 72%, filete Warm Light; hover invierte | caption · .06em · MAYÚSCULAS | 9/14 | editor de formularios |

### C · Botones del formulario público (cara al cliente)

| Rol | Valores |
|---|---|
| Enviar `.ixf-submit` | fondo `--accent`, texto blanco, mono **600**, body-sm, .02em, padding 15/28, **radio 2px**, hover opacidad .9 |
| Escala Likert/NPS | White, filete Warm Dark, radio 2px, 40px de ancho mínimo; pulsado = `--accent` |
| Subir/bajar en ranking | filete; hover = `--accent` |

---

## 2 · Campos y búsqueda

| Componente | Valores | Dónde |
|---|---|---|
| **Input herramientas** `input` | White, filete Warm Dark, mono 400 13px/1.4, 10/12, radio 0, **sin estado de foco** (login: `outline: none`) | modales, login |
| **Input público** `.ixf-input` | White, filete Warm Dark, body-sm, 12/14, **radio 2px**, foco = filete `--accent` + anillo 3px al 22% | formulario público |
| Error de campo | filete Burdeos + texto caption Burdeos | formulario público |
| **Label** | mono 500 10px/1.4, .08em, MAYÚSCULAS, Ash | todas las herramientas |
| **Buscador** `SearchField` | White, filete Warm Dark, 8/12, lupa 14px Ash, texto 400 12px, placeholder "Buscar", ancho 380 máx. Medido para igualar `toolbarBtn` | cabecera de las dos galerías |
| **Filtro chip** | White/Ash/Warm Dark; activo = Dark/Warm Light; 500 11px .04em, 8/16, radio 0 (el código las llama "píldoras") | galerías |
| Desplegable de cliente | mismo traje que el chip + ▼ 8px; lista propia: White, filete Dark, filas 9/14 separadas por Warm Dark, hover Warm Light, elegida en Dark | galerías |
| **Segmentado** `seg`/`segOn` | transparente/Ash/Warm Dark, 500 10px .06em MAYÚSCULAS, 7/6; activo = Dark | modales de metadatos |
| **Etiqueta** (TagInput) | White, filete Warm Dark, 400 11px, 5/8, × en Ash | modales de metadatos |
| **Badge de estado** | 500 9px .08em, 4/8; publicado = Dark; borrador = filete Ash | FormMaker |

## 3 · Contenedores y superficies

| Componente | Valores |
|---|---|
| **Cabecera de herramienta** | 10/16, Warm Light, filete inferior Warm Dark, imagotipo 20px + divisor. **Ya es la misma** en deck, forms y workspace |
| **Modal** | velo `rgba(28,26,23,.28)`, tarjeta **Warm Light**, filete Dark, padding 28, 560 máx.; título 600 13px .06em MAYÚSCULAS |
| Tarjeta de login | **White** (el modal es Warm Light), filete Dark, padding 28 |
| **Menú desplegable** | White, filete Dark, filas 10/12 separadas por Warm Dark |
| **Tooltip** | Dark / Warm Light, 500 10px .04em, 5/7 (multilínea 8/10) |
| **Tarjeta de galería / tile** | White, filete Warm Dark; hover = filete Dark + `translateY(-2px)` + sombra `0 6px 18px rgba(28,26,23,.16)` |
| **Aviso de error** | filete y texto Burdeos, fondo Burdeos al 5%, 400 11px |
| **Aviso neutro** | Warm Light, filete Warm Dark, 400 12px |

---

## 4 · Hallazgos (lo que hay que decidir al canonizar)

Ordenados por gravedad respecto a la norma escrita.

1. **Tres rojos para un mismo rol.** La norma dice que la alerta es **Burdeos #99335F** (`uiRole` en `lib/tokens.ts`). En el código conviven además:
   - **#B4402E**, el error de guardado del Deck (`DeckToolbar.tsx:138`); el FormMaker usa Burdeos para lo mismo.
   - **#C24B36** (`brick`), el guion de los wordmarks y el enlace del login (`authUi.ts`).

   Ninguno de los dos está en la paleta. Carlos ya dejó `brick` anotado como pendiente.
2. **Acentos como decoración en el formulario público.** Cada formulario elige `accent: opal | bordeaux | emerald` y ese color pinta el botón de enviar, el foco y la escala. Eso choca con la regla dura de que *los acentos no son decorativos: cada uno identifica un servicio*. Además, **Opal (#B0B5B0) con texto blanco tiene un contraste de ~2:1**, por debajo de AA.
3. **No hay estado de foco en las herramientas.** El formulario público tiene un anillo de foco y las herramientas no tienen ninguno; el login lo quita explícitamente (`outline: none`). Es un problema de accesibilidad y una incoherencia entre dos superficies de la misma marca.
4. **El radio de esquina no tiene regla**: 0 (herramientas), 2px (formulario público), 4px (acciones de tarjeta) y 50% (avatar de logout).
5. **El mismo rol tiene valores distintos:**
   - Primario: 11px con padding 10/12 (`btn`) frente a 12px con padding 12 (`submit` del login).
   - Indicador de guardado: 500 11px en el Deck frente a 400 10px en Forms.
   - En la misma cabecera, Cerrar sesión va a 10px en MAYÚSCULAS y los botones de barra a 11px en tipo de frase.
   - Fondo de tarjeta: modal en Warm Light, login en White.
6. **Los tamaños de interfaz están fuera de la escala** (9, 10, 11, 12, 13 y 15px). Es el mismo caso que el deck: la escala es web y fluida, y la interfaz necesita peldaños fijos pequeños. Toca decidir si se declara una **escala de UI** propia.
7. **El movimiento no está unificado:**
   - wipe: 0.5s `(.45,0,.15,1)`
   - IconButton: .25s expo `(0.16,1,0.3,1)`
   - acciones de tarjeta: 120ms ease
   - tiles: 150ms `--ease`
   - formulario: 200ms `--ease`

   La sección 14 (Movimiento) ya define curvas, pero ninguna duración de interfaz.
8. **Los colores están duplicados a mano por tercera vez.** `ui.ts` reescribe los hex en lugar de usar `var(--c-*)`, y 20 archivos redeclaran su propia constante `MONO`. Si cambia un color de marca, las herramientas no se enteran.
9. **Grises sueltos fuera de paleta**, solo en miniaturas y placeholders: `#D8D2C8`, `#B9B2A6`, `#CDC6BB` (`LayoutThumb.tsx`), `#E7E1D9` (`DeckGallery.tsx`) y `#2A2724` (`FormCard.tsx`). Son de bajo riesgo, pero existe `Grey #E8E6E3` en la paleta.

## 5 · Lo que ya funciona y merece pasar tal cual a la norma

- **La cabecera de herramienta**: ya está unificada en las tres apps y documentada en el código.
- **El sistema de "inversión"** (estado activo = fondo Dark con texto Warm Light) es consistente en toolbar, chips, segmentado, IconButton y desplegable. Es la firma de la interfaz.
- **Filete de 1px en lugar de sombra o relleno** como lenguaje base. La única sombra es el hover de las tarjetas.
- **Las etiquetas en mono 10px, MAYÚSCULAS y .08em, en Ash** se usan igual en todas partes.
- **Componentes ya extraídos y compartidos** (`SearchField`, `FilterBar`, `CardActions`, `TagInput`, `LogoutButton`): son la base natural de la librería.
