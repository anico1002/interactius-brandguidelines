/* Interfaz — fuente única de verdad de los componentes de UI de la marca (sección 12 · Componentes; los iconos, en la 11).

   Canoniza en noviembre de 2026 lo que las herramientas internas (DeckMakr, FormMakr,
   Timer, Workspace) usaban sin que estuviera escrito. Inventario de partida: docs/inventario-ui.md.

   Cómo está construido, de abajo arriba:
   1. Tokens semánticos  → nombran un ROL (filete, superficie, crítico), no un color.
   2. Medidas            → cuatro alturas sobre una retícula de 4px; todo control mide una de ellas.
   3. Tipografía de UI   → cuatro peldaños fijos en px, todos IBM Plex Mono.
   4. Modelo de estados  → las mismas reglas para todo componente interactivo.
   5. Componentes        → cada uno con variantes, medidas, matriz de estados y accesibilidad.

   Espejo: las clases que pintan esto viven en app/ui-kit.css (`.ixu-*`). Si cambias un valor
   aquí, cámbialo allí. Consumido por SectionInterfaz.tsx, lib/llms.ts y /api/brand.json. */

export type L = { es: string; en: string; ca: string };

/* ── 1 · Tokens semánticos ──────────────────────────────────────────────────── */

export type UiToken = { name: string; cssVar: string; value: string; role: L };

export const uiTokens: UiToken[] = [
  { name: 'surface.page',    cssVar: '--ui-surface-page',    value: 'Warm Light',  role: { es: 'Fondo de la herramienta.', en: 'Tool background.', ca: 'Fons de l\'eina.' } },
  { name: 'surface',         cssVar: '--ui-surface',         value: 'Pure White',  role: { es: 'Fondo de todo lo que se pulsa o se escribe.', en: 'Background of anything pressed or typed into.', ca: 'Fons de tot el que es prem o s\'escriu.' } },
  { name: 'surface.hover',   cssVar: '--ui-surface-hover',   value: 'Warm Light',  role: { es: 'Fila o superficie blanca bajo el puntero.', en: 'White row or surface under the pointer.', ca: 'Fila o superfície blanca sota el punter.' } },
  { name: 'surface.pressed', cssVar: '--ui-surface-pressed', value: 'Warm Dark',   role: { es: 'Superficie mientras se mantiene pulsada.', en: 'Surface while held down.', ca: 'Superfície mentre es manté premuda.' } },
  { name: 'border',          cssVar: '--ui-border',          value: 'Warm Dark',   role: { es: 'Filete estructural: divisores, tarjetas, cabeceras y tablas. Ordena, no se toca.', en: 'Structural rule: dividers, cards, headers and tables. It organises; it is not touched.', ca: 'Filet estructural: divisors, targetes, capçaleres i taules. Ordena, no es toca.' } },
  { name: 'border.control',  cssVar: '--ui-border-control',  value: 'Ash',         role: { es: 'Filete de control en reposo: todo lo que se toca. 4,9:1 sobre White (WCAG 1.4.11 pide 3:1).', en: 'Control rule at rest: everything that can be touched. 4.9:1 on White (WCAG 1.4.11 asks for 3:1).', ca: 'Filet de control en repòs: tot el que es toca. 4,9:1 sobre White (WCAG 1.4.11 demana 3:1).' } },
  { name: 'border.strong',   cssVar: '--ui-border-strong',   value: 'Dark',        role: { es: 'Filete al interactuar y en contenedores flotantes.', en: 'Rule on interaction and on floating containers.', ca: 'Filet en interactuar i en contenidors flotants.' } },
  { name: 'text',            cssVar: '--ui-text',            value: 'Dark',        role: { es: 'Texto principal.', en: 'Primary text.', ca: 'Text principal.' } },
  { name: 'text.muted',      cssVar: '--ui-text-muted',      value: 'Ash',         role: { es: 'Texto secundario, rótulos y placeholders.', en: 'Secondary text, labels and placeholders.', ca: 'Text secundari, rètols i placeholders.' } },
  { name: 'text.secondary',  cssVar: '--ui-text-secondary',  value: 'Ash Dark',    role: { es: 'Texto del terciario en reposo. Deja Ash libre para el desactivado.', en: 'Tertiary text at rest. Leaves Ash free for disabled.', ca: 'Text del terciari en repòs. Deixa Ash lliure per al desactivat.' } },
  { name: 'inverse',         cssVar: '--ui-inverse',         value: 'Dark',        role: { es: 'Relleno de lo primario y de lo seleccionado.', en: 'Fill for primary and selected items.', ca: 'Farciment del que és primari i seleccionat.' } },
  { name: 'inverse.hover',   cssVar: '--ui-inverse-hover',   value: 'Ash Dark',    role: { es: 'Relleno oscuro bajo el puntero.', en: 'Dark fill under the pointer.', ca: 'Farciment fosc sota el punter.' } },
  { name: 'inverse.pressed', cssVar: '--ui-inverse-pressed', value: 'Dark + Warm Light 32%', role: { es: 'Relleno oscuro mientras se pulsa: un paso más claro que el hover. #615F5B, Warm Light encima a 5,7:1.', en: 'Dark fill while pressed: one step lighter than hover. #615F5B, Warm Light on top at 5.7:1.', ca: 'Farciment fosc mentre es prem: un pas més clar que el hover. #615F5B, Warm Light a sobre a 5,7:1.' } },
  { name: 'text.inverse',    cssVar: '--ui-text-inverse',    value: 'Warm Light',  role: { es: 'Texto sobre relleno oscuro.', en: 'Text on a dark fill.', ca: 'Text sobre farciment fosc.' } },
  { name: 'critical',        cssVar: '--ui-critical',        value: 'Error',       role: { es: 'Error, acción destructiva, alerta.', en: 'Error, destructive action, alert.', ca: 'Error, acció destructiva, alerta.' } },
  { name: 'success',         cssVar: '--ui-success',         value: 'Success',     role: { es: 'Confirmación de que algo ha salido bien.', en: 'Confirmation that something went well.', ca: 'Confirmació que alguna cosa ha sortit bé.' } },
  { name: 'focus',           cssVar: '--ui-focus',           value: 'Dark',        role: { es: 'Indicador de foco de teclado.', en: 'Keyboard focus indicator.', ca: 'Indicador de focus de teclat.' } },
  { name: 'tint.hover',      cssVar: '--ui-tint-hover',      value: 'Dark 8%',     role: { es: 'Fondo del terciario bajo el puntero. Tinte, para que funcione sobre White y sobre Warm Light.', en: 'Tertiary background under the pointer. A tint, so it works on White and on Warm Light.', ca: 'Fons del terciari sota el punter. Tint, perquè funcioni sobre White i sobre Warm Light.' } },
  { name: 'tint.pressed',    cssVar: '--ui-tint-pressed',    value: 'Dark 16%',    role: { es: 'Fondo del terciario mientras se pulsa: el doble que el hover.', en: 'Tertiary background while pressed: twice the hover.', ca: 'Fons del terciari mentre es prem: el doble que el hover.' } },
  { name: 'disabled.surface', cssVar: '--ui-disabled-surface', value: 'Warm Light', role: { es: 'Superficie de un control desactivado.', en: 'Surface of a disabled control.', ca: 'Superfície d\'un control desactivat.' } },
  { name: 'disabled.fill',   cssVar: '--ui-disabled-fill',   value: 'Warm Dark',   role: { es: 'Relleno desactivado de lo seleccionado o marcado: el estado no se pierde.', en: 'Disabled fill for what is selected or checked: the state is not lost.', ca: 'Farciment desactivat del que està seleccionat o marcat: l\'estat no es perd.' } },
  { name: 'disabled.border', cssVar: '--ui-disabled-border', value: 'Warm Dark',   role: { es: 'Filete desactivado: el estructural, porque ya no se toca.', en: 'Disabled rule: the structural one, since it can no longer be touched.', ca: 'Filet desactivat: l\'estructural, perquè ja no es toca.' } },
  { name: 'disabled.text',   cssVar: '--ui-disabled-text',   value: 'Dark 40%',    role: { es: 'Texto desactivado, ~2,5:1. Es el único texto por debajo de 3:1: el activo más claro es Ash (4,4:1), así que un desactivado nunca pasa por un botón discreto.', en: 'Disabled text, ~2.5:1. The only text below 3:1: the lightest active text is Ash (4.4:1), so a disabled control never passes for a quiet button.', ca: 'Text desactivat, ~2,5:1. És l\'únic text per sota de 3:1: l\'actiu més clar és Ash (4,4:1), així que un desactivat mai passa per un botó discret.' } },
  { name: 'scrim',           cssVar: '--ui-scrim',           value: 'Dark 28%',    role: { es: 'Velo bajo un diálogo.', en: 'Scrim behind a dialog.', ca: 'Vel sota un diàleg.' } },
];

/* ── 2 · Medidas ────────────────────────────────────────────────────────────────
   Retícula de 4px. Cuatro alturas: un botón, un campo y un desplegable de la misma talla miden
   exactamente lo mismo y se alinean en una misma línea. */

export type UiSize = { id: 'xs' | 'sm' | 'md' | 'lg'; height: number; paddingX: number; icon: number; usage: L };

export const uiSizes: UiSize[] = [
  { id: 'xs', height: 24, paddingX: 8,  icon: 12, usage: { es: 'Etiquetas y badges. Nunca un control de acción.', en: 'Tags and badges. Never an action control.', ca: 'Etiquetes i badges. Mai un control d\'acció.' } },
  { id: 'sm', height: 28, paddingX: 10, icon: 14, usage: { es: 'Controles densos: chips, segmentados, acciones dentro de tablas y tarjetas.', en: 'Dense controls: chips, segmented controls, actions inside tables and cards.', ca: 'Controls densos: chips, segmentats, accions dins de taules i targetes.' } },
  { id: 'md', height: 36, paddingX: 14, icon: 16, usage: { es: 'Por defecto. Botones, campos, buscador y desplegables de herramienta.', en: 'Default. Tool buttons, fields, search and selects.', ca: 'Per defecte. Botons, camps, cercador i desplegables d\'eina.' } },
  { id: 'lg', height: 48, paddingX: 20, icon: 16, usage: { es: 'Pantallas de cara al cliente y acciones a todo el ancho: entrar, enviar.', en: 'Client-facing screens and full-width actions: sign in, submit.', ca: 'Pantalles de cara al client i accions a tota l\'amplada: entrar, enviar.' } },
];

export const uiSpacing = [4, 8, 12, 16, 24, 32] as const;

export const uiSpacingRules: { id: string; value: number; rule: L }[] = [
  { id: 'group',  value: 8,  rule: { es: 'Entre controles de un mismo grupo (botones de una barra, chips).', en: 'Between controls in one group (toolbar buttons, chips).', ca: 'Entre controls d\'un mateix grup (botons d\'una barra, chips).' } },
  { id: 'label',  value: 8,  rule: { es: 'Del rótulo al campo, y del campo a su mensaje.', en: 'From label to field, and from field to its message.', ca: 'Del rètol al camp, i del camp al seu missatge.' } },
  { id: 'fields', value: 16, rule: { es: 'Entre campos de un formulario.', en: 'Between fields in a form.', ca: 'Entre camps d\'un formulari.' } },
  { id: 'blocks', value: 32, rule: { es: 'Padding de diálogos y separación entre bloques.', en: 'Dialog padding and spacing between blocks.', ca: 'Padding de diàlegs i separació entre blocs.' } },
];

/* ── 3 · Tipografía de interfaz ──────────────────────────────────────────────────
   Fija en px: la escala de lib/typeScale.ts es editorial y fluida; un control mide lo mismo en
   cualquier pantalla. Cuatro peldaños; un componente no usa ningún otro. */

export type UiTypeStep = { id: string; size: number; lineHeight: string; weight: number; tracking: string; uppercase: boolean; usage: L };

export const uiTypeScale: UiTypeStep[] = [
  { id: 'ui-label',   size: 10, lineHeight: '1.2', weight: 500, tracking: '0.08em', uppercase: true,
    usage: { es: 'Rótulos de campo, badges, cabeceras de grupo.', en: 'Field labels, badges, group headers.', ca: 'Rètols de camp, badges, capçaleres de grup.' } },
  { id: 'ui-control', size: 12, lineHeight: '1',   weight: 500, tracking: '0.02em', uppercase: false,
    usage: { es: 'Todo lo que se pulsa: botones, chips, segmentados, filas de menú.', en: 'Everything pressable: buttons, chips, segmented controls, menu rows.', ca: 'Tot el que es prem: botons, chips, segmentats, files de menú.' } },
  { id: 'ui-text',    size: 12, lineHeight: '1.5', weight: 400, tracking: '0',      uppercase: false,
    usage: { es: 'Texto escrito, placeholders, mensajes, tooltips, cuerpo de diálogo.', en: 'Typed text, placeholders, messages, tooltips, dialog body.', ca: 'Text escrit, placeholders, missatges, tooltips, cos de diàleg.' } },
  { id: 'ui-title',   size: 13, lineHeight: '1.3', weight: 600, tracking: '0.06em', uppercase: true,
    usage: { es: 'Título de diálogo, de panel o de herramienta.', en: 'Dialog, panel or tool title.', ca: 'Títol de diàleg, de panell o d\'eina.' } },
];

/* ── 4 · Modelo de estados ───────────────────────────────────────────────────────
   Una regla por estado, para todos los componentes. La matriz de cada componente es la
   aplicación de estas reglas, no una excepción a ellas. */

export type UiStateId = 'default' | 'hover' | 'pressed' | 'focus' | 'open' | 'selected' | 'disabled' | 'loading' | 'error';

export const uiStates: { id: UiStateId; label: L; rule: L; trigger: string }[] = [
  { id: 'default',  trigger: '—',
    label: { es: 'Reposo', en: 'Default', ca: 'Repòs' },
    rule: { es: 'Superficie blanca y filete Ash; o relleno Dark si es primario.', en: 'White surface and Ash rule; or Dark fill if primary.', ca: 'Superfície blanca i filet Ash; o farciment Dark si és primari.' } },
  { id: 'hover',    trigger: ':hover · 200ms expo',
    label: { es: 'Hover', en: 'Hover', ca: 'Hover' },
    rule: { es: 'Un paso, nunca el último: lo que se toca toma un tinte Dark 8% y su filete pasa a Dark (el campo y la casilla, solo el filete); el relleno Dark aclara a Ash Dark; el crítico, un tinte Error 6%. El relleno pleno se reserva al pulsado. Nunca cambia el tamaño.', en: 'One step, never the last: what can be touched takes a Dark 8% tint and its rule turns Dark (fields and checkboxes, the rule only); a Dark fill lightens to Ash Dark; critical, an Error 6% tint. The full fill is kept for pressed. Size never changes.', ca: 'Un pas, mai l\'últim: el que es toca pren un tint Dark 8% i el seu filet passa a Dark (el camp i la casella, només el filet); el farciment Dark aclareix a Ash Dark; el crític, un tint Error 6%. El farciment ple es reserva al premut. Mai canvia la mida.' } },
  { id: 'pressed',  trigger: ':active',
    label: { es: 'Pulsado', en: 'Pressed', ca: 'Premut' },
    rule: { es: 'Un paso más que el hover, en la misma dirección; nunca igual que el reposo ni que el hover. Secundario, icono y chip: el tinte del hover dobla (8% → 16%) con el filete Dark. Terciario: el tinte dobla (8% → 16%). Primario: se aclara un paso más (Ash Dark → Dark + Warm Light 32%). Crítico: del tinte Error 6% al relleno Error. Sin transición.', en: 'One step beyond hover, in the same direction; never the same as rest or hover. Secondary, icon and chip: the hover tint doubles (8% → 16%) with the Dark rule. Tertiary: the tint doubles (8% → 16%). Primary: lightens one more step (Ash Dark → Dark + Warm Light 32%). Critical: from Error 6% tint to Error fill. No transition.', ca: 'Un pas més que el hover, en la mateixa direcció; mai igual que el repòs ni que el hover. Secundari, icona i chip: el tint del hover es dobla (8% → 16%) amb el filet Dark. Terciari: el tint es dobla (8% → 16%). Primari: s\'aclareix un pas més (Ash Dark → Dark + Warm Light 32%). Crític: del tint Error 6% al farciment Error. Sense transició.' } },
  { id: 'focus',    trigger: ':focus-visible',
    label: { es: 'Foco', en: 'Focus', ca: 'Focus' },
    rule: { es: 'El foco engrosa el filete: aspecto de hover y filete de 2px en Dark hacia dentro (Error en el crítico). Si no hay filete que engrosar —un control relleno, o un campo con error, que ya está a 2px—, el foco se separa 2px. Solo con teclado; nunca se elimina.', en: 'Focus thickens the rule: hover appearance plus a 2px Dark rule drawn inwards (Error on the critical button). When there is no rule to thicken (a filled control, or a field in error, already at 2px), focus is offset 2px. Keyboard only; never removed.', ca: 'El focus engruixeix el filet: aspecte de hover i filet de 2px en Dark cap endins (Error en el crític). Si no hi ha filet per engruixir (un control farcit, o un camp amb error, que ja és a 2px), el focus se separa 2px. Només amb teclat; mai s\'elimina.' } },
  { id: 'open',     trigger: 'aria-expanded',
    label: { es: 'Desplegado', en: 'Open', ca: 'Desplegat' },
    rule: { es: 'El desplegable o el chip con lista, con su lista abierta: filete de 2px como el foco y la flecha gira 180°. La lista (ver Menú) cuelga 6px por debajo, alineada a la izquierda y como mínimo del ancho del campo. Escape la cierra y devuelve el foco al control.', en: 'The select or the chip with list, with its list open: 2px rule like focus and the chevron turns 180°. The list (see Menu) hangs 6px below, left-aligned and at least as wide as the field. Escape closes it and returns focus to the field.', ca: 'El desplegable o el chip amb llista, amb la llista oberta: filet de 2px com el focus i la fletxa gira 180°. La llista (vegeu Menú) penja 6px per sota, alineada a l\'esquerra i com a mínim de l\'amplada del camp. Escape la tanca i torna el focus al camp.' } },
  { id: 'selected', trigger: 'aria-pressed · aria-selected · aria-checked',
    label: { es: 'Seleccionado', en: 'Selected', ca: 'Seleccionat' },
    rule: { es: 'Inversión: relleno Dark, texto Warm Light. 300ms al alternar. Es la firma de la interfaz.', en: 'Inversion: Dark fill, Warm Light text. 300ms when toggling. The signature of the interface.', ca: 'Inversió: farciment Dark, text Warm Light. 300ms en alternar. És la signatura de la interfície.' } },
  { id: 'disabled', trigger: ':disabled · aria-disabled',
    label: { es: 'Desactivado', en: 'Disabled', ca: 'Desactivat' },
    rule: { es: 'Sin opacidad: el control pierde el filete de control y pasa al estructural. Superficie Warm Light, filete Warm Dark, texto Dark 40% (~2,5:1: se lee, pero queda por debajo de cualquier texto activo, que nunca baja de Ash, 4,4:1). Todos los botones desactivados se ven igual: sin acción no hay jerarquía, y el relleno Warm Dark ya es el hover del terciario. Solo lo seleccionado o marcado conserva relleno (Warm Dark), para no perder el estado. Cursor not-allowed, sin hover ni pulsación. Mejor aria-disabled que disabled: sigue en el tabulador y se anuncia.', en: 'No opacity: the control loses its control rule and takes the structural one. Warm Light surface, Warm Dark rule, Dark 40% text (~2.5:1: readable, but below any active text, which never goes under Ash, 4.4:1). All disabled buttons look the same: without an action there is no hierarchy, and a Warm Dark fill is already the tertiary hover. Only what is selected or checked keeps a fill (Warm Dark), so the state is not lost. not-allowed cursor, no hover or press. Prefer aria-disabled to disabled: it stays in the tab order and is announced.', ca: 'Sense opacitat: el control perd el filet de control i passa a l\'estructural. Superfície Warm Light, filet Warm Dark, text Dark 40% (~2,5:1: es llegeix, però queda per sota de qualsevol text actiu, que mai baixa d\'Ash, 4,4:1). Tots els botons desactivats es veuen igual: sense acció no hi ha jerarquia, i el farciment Warm Dark ja és el hover del terciari. Només el que està seleccionat o marcat conserva farciment (Warm Dark), per no perdre l\'estat. Cursor not-allowed, sense hover ni pulsació. Millor aria-disabled que disabled: segueix al tabulador i s\'anuncia.' } },
  { id: 'loading',  trigger: 'aria-busy',
    label: { es: 'Cargando', en: 'Loading', ca: 'Carregant' },
    rule: { es: 'El texto pasa a gerundio («Guardando») y un macrón de 2px recorre la base. El ancho no cambia y no se puede volver a pulsar.', en: 'The label switches to the gerund ("Saving") and a 2px macron runs along the base. Width stays; it cannot be pressed again.', ca: 'El text passa a gerundi («Desant») i un macró de 2px recorre la base. L\'amplada no canvia i no es pot tornar a prémer.' } },
  { id: 'error',    trigger: 'aria-invalid',
    label: { es: 'Error', en: 'Error', ca: 'Error' },
    rule: { es: 'Filete Error de 2px y mensaje en Error debajo, que dice qué falta. 2px y no 1: Ash y Error tienen casi la misma luminancia, y el color no puede ser la única señal (WCAG 1.4.1). Solo en campos.', en: '2px Error rule and an Error message below saying what is missing. 2px, not 1: Ash and Error have almost the same luminance, and colour cannot be the only signal (WCAG 1.4.1). Fields only.', ca: 'Filet Error de 2px i missatge en Error a sota, que diu què falta. 2px i no 1: Ash i Error tenen gairebé la mateixa luminància, i el color no pot ser l\'únic senyal (WCAG 1.4.1). Només en camps.' } },
];

/* ── 5 · Componentes ─────────────────────────────────────────────────────────── */

/* Celda de matriz: valores de un estado para una variante. `null` = el estado no aplica. */
export type UiCell = { fill: string; text: string; border: string } | null;

export type UiVariant = {
  id: string;
  label: L;
  className: string;
  cells: Partial<Record<UiStateId, UiCell>>;
};

export type UiComponent = {
  id: string;
  name: L;
  summary: L;
  sizes: UiSize['id'][];
  states: UiStateId[];
  variants: UiVariant[];
  a11y: L;
  do: L;
  dont: L;
};

const c = (fill: string, text: string, border: string): UiCell => ({ fill, text, border });
// Desactivado: tokens explícitos, nunca opacidad. Pierde el filete de control (Ash) y pasa al estructural.
const DIS = c('Warm Light', 'Dark 40%', 'Warm Dark');       // controles con superficie
const DIS_BARE = c('—', 'Dark 40%', '—');                   // terciario y fila de menú

export const uiComponents: UiComponent[] = [
  {
    id: 'button',
    name: { es: 'Botón', en: 'Button', ca: 'Botó' },
    summary: {
      es: 'Ejecuta una acción. Cuatro variantes según su peso en la pantalla; una sola primaria por vista.',
      en: 'Runs an action. Four variants by their weight on screen; a single primary per view.',
      ca: 'Executa una acció. Quatre variants segons el seu pes a la pantalla; una sola primària per vista.',
    },
    sizes: ['sm', 'md', 'lg'],
    states: ['default', 'hover', 'pressed', 'focus', 'selected', 'disabled', 'loading'],
    variants: [
      {
        id: 'primary', className: 'ixu-btn ixu-btn--primary',
        label: { es: 'Primario', en: 'Primary', ca: 'Primari' },
        cells: {
          default: c('Dark', 'Warm Light', 'Dark'), hover: c('Ash Dark', 'Warm Light', 'Ash Dark'),
          pressed: c('Dark + Warm Light 32%', 'Warm Light', '= fondo'), focus: c('Ash Dark', 'Warm Light', 'Dark 2px separado'),
          selected: null, disabled: DIS, loading: c('Dark', 'Warm Light', 'macrón Warm Light'),
        },
      },
      {
        id: 'secondary', className: 'ixu-btn ixu-btn--secondary',
        label: { es: 'Secundario', en: 'Secondary', ca: 'Secundari' },
        cells: {
          default: c('White', 'Dark', 'Ash'), hover: c('White + Dark 8%', 'Dark', 'Dark'),
          pressed: c('White + Dark 16%', 'Dark', 'Dark'), focus: c('White + Dark 8%', 'Dark', 'Dark 2px'),
          selected: c('Dark', 'Warm Light', 'Dark'), disabled: DIS, loading: c('White', 'Dark', 'macrón Dark'),
        },
      },
      {
        id: 'ghost', className: 'ixu-btn ixu-btn--ghost',
        label: { es: 'Terciario', en: 'Tertiary', ca: 'Terciari' },
        cells: {
          default: c('—', 'Ash Dark', '—'), hover: c('Dark 8%', 'Dark', '—'),
          pressed: c('Dark 16%', 'Dark', '—'), focus: c('Dark 8%', 'Dark', 'Dark 2px'),
          selected: c('Dark', 'Warm Light', '—'), disabled: DIS_BARE, loading: c('—', 'Ash Dark', 'macrón Ash Dark'),
        },
      },
      {
        id: 'danger', className: 'ixu-btn ixu-btn--danger',
        label: { es: 'Crítico', en: 'Critical', ca: 'Crític' },
        cells: {
          default: c('White', 'Error', 'Error'), hover: c('Error 6%', 'Error', 'Error'),
          pressed: c('Error', 'White', 'Error'), focus: c('Error 6%', 'Error', 'Error 2px'),
          selected: null, disabled: DIS, loading: c('White', 'Error', 'macrón Error'),
        },
      },
    ],
    a11y: {
      es: '<button> nativo. Enter y Espacio lo activan. Un botón conmutable lleva aria-pressed; uno cargando, aria-busy. Uno solo de icono lleva aria-label.',
      en: 'Native <button>. Enter and Space activate it. A toggle carries aria-pressed; a loading one, aria-busy. An icon-only one carries aria-label.',
      ca: '<button> natiu. Enter i Espai l\'activen. Un botó commutable porta aria-pressed; un que carrega, aria-busy. Un només d\'icona porta aria-label.',
    },
    do: { es: 'Un verbo que dice qué pasa: «Descargar PDF», «Eliminar presentación».', en: 'A verb that says what happens: "Download PDF", "Delete presentation".', ca: 'Un verb que diu què passa: «Descarregar PDF», «Eliminar presentació».' },
    dont: { es: 'Dos primarios en la misma vista, o un crítico sin confirmación.', en: 'Two primaries in one view, or a critical action without confirmation.', ca: 'Dos primaris a la mateixa vista, o un crític sense confirmació.' },
  },
  {
    id: 'iconButton',
    name: { es: 'Botón de icono', en: 'Icon button', ca: 'Botó d\'icona' },
    summary: {
      es: 'Un botón secundario o terciario sin texto, siempre cuadrado. Lleva tooltip con el nombre de la acción.',
      en: 'A secondary or tertiary button without text, always square. It carries a tooltip naming the action.',
      ca: 'Un botó secundari o terciari sense text, sempre quadrat. Porta tooltip amb el nom de l\'acció.',
    },
    sizes: ['sm', 'md'],
    states: ['default', 'hover', 'pressed', 'focus', 'selected', 'disabled'],
    variants: [
      {
        id: 'secondary', className: 'ixu-icon-btn',
        label: { es: 'Secundario', en: 'Secondary', ca: 'Secundari' },
        cells: {
          default: c('White', 'Dark', 'Ash'), hover: c('White + Dark 8%', 'Dark', 'Dark'), pressed: c('White + Dark 16%', 'Dark', 'Dark'),
          focus: c('White + Dark 8%', 'Dark', 'Dark 2px'), selected: c('Dark', 'Warm Light', 'Dark'), disabled: DIS,
        },
      },
      {
        id: 'ghost', className: 'ixu-icon-btn ixu-icon-btn--ghost',
        label: { es: 'Terciario', en: 'Tertiary', ca: 'Terciari' },
        cells: {
          default: c('—', 'Ash Dark', '—'), hover: c('Dark 8%', 'Dark', '—'), pressed: c('Dark 16%', 'Dark', '—'),
          focus: c('Dark 8%', 'Dark', 'Dark 2px'), selected: c('Dark', 'Warm Light', '—'), disabled: DIS_BARE,
        },
      },
    ],
    a11y: { es: 'aria-label obligatorio con la acción completa («Eliminar «Propuesta Acme»»), no solo el verbo.', en: 'aria-label required with the full action ("Delete "Acme proposal""), not just the verb.', ca: 'aria-label obligatori amb l\'acció completa («Eliminar «Proposta Acme»»), no només el verb.' },
    do: { es: 'Iconos de la familia maciza (ver Iconos), a la medida del control: 16px en md, 14 en sm.', en: 'Icons from the solid family (see Icons), sized to the control: 16px in md, 14 in sm.', ca: 'Icones de la família massissa (vegeu Icones), a la mida del control: 16px en md, 14 en sm.' },
    dont: { es: 'Un botón de icono primario, relleno de Dark en reposo: en esta marca el relleno Dark en un botón de icono significa «seleccionado». Si la acción principal necesita icono, va en el botón primario con texto. Tampoco esquinas redondeadas.', en: 'A primary icon button, filled Dark at rest: in this brand a Dark fill on an icon button means «selected». If the main action needs an icon, it goes in the primary button with text. No rounded corners either.', ca: 'Un botó d\'icona primari, farcit de Dark en repòs: en aquesta marca el farciment Dark en un botó d\'icona vol dir «seleccionat». Si l\'acció principal necessita icona, va al botó primari amb text. Tampoc cantonades arrodonides.' },
  },
  {
    id: 'field',
    name: { es: 'Campo', en: 'Field', ca: 'Camp' },
    summary: {
      es: 'Recoge texto. El buscador y el desplegable son el mismo campo con un icono delante o una flecha detrás: misma altura, mismo filete, mismos estados. Al escribir, el campo está en foco: filete de 2px y cursor. Es la misma regla de foco que los botones (:focus-visible): el navegador la activa también al hacer clic en un campo de texto, porque vas a escribir; en el desplegable, solo con teclado. El hover solo anuncia que se puede escribir.',
      en: 'Collects text. Search and select are the same field with a leading icon or a trailing chevron: same height, same rule, same states. While typing, the field is in focus: 2px rule and caret. It is the same focus rule as buttons (:focus-visible): the browser also triggers it when you click a text field, because you are about to type; on a select, only from the keyboard. Hover only signals that it can be typed in.',
      ca: 'Recull text. El cercador i el desplegable són el mateix camp amb una icona davant o una fletxa darrere: mateixa alçada, mateix filet, mateixos estats. En escriure, el camp està en focus: filet de 2px i cursor. És la mateixa regla de focus que els botons (:focus-visible): el navegador l\'activa també en fer clic en un camp de text, perquè hi escriuràs; al desplegable, només amb teclat. El hover només anuncia que s\'hi pot escriure.',
    },
    sizes: ['md', 'lg'],
    states: ['default', 'hover', 'focus', 'open', 'error', 'disabled'],
    variants: [
      {
        id: 'text', className: 'ixu-field',
        label: { es: 'Texto', en: 'Text', ca: 'Text' },
        cells: {
          default: c('White', 'Dark · placeholder Ash', 'Ash'), hover: c('White', 'Dark', 'Dark'),
          focus: c('White', 'Dark', 'Dark 2px'), error: c('White', 'Dark', 'Error 2px'), disabled: DIS,
        },
      },
      {
        id: 'search', className: 'ixu-field ixu-field--search',
        label: { es: 'Buscador', en: 'Search', ca: 'Cercador' },
        cells: {
          default: c('White', 'Ash', 'Ash'), hover: c('White', 'Dark', 'Dark'),
          focus: c('White', 'Dark', 'Dark 2px'), error: null, disabled: DIS,
        },
      },
      {
        id: 'select', className: 'ixu-field ixu-field--select',
        label: { es: 'Desplegable', en: 'Select', ca: 'Desplegable' },
        cells: {
          default: c('White', 'Dark', 'Ash'), hover: c('White', 'Dark', 'Dark'),
          focus: c('White', 'Dark', 'Dark 2px'), open: c('White', 'Dark', 'Dark 2px · flecha 180°'), error: c('White', 'Dark', 'Error 2px'), disabled: DIS,
        },
      },
    ],
    a11y: { es: 'Siempre con rótulo visible (<label>); el placeholder no lo sustituye. El error se enlaza con aria-describedby. El buscador lleva aria-label si no hay rótulo visible.', en: 'Always with a visible <label>; the placeholder does not replace it. The error is linked with aria-describedby. Search carries aria-label if there is no visible label.', ca: 'Sempre amb <label> visible; el placeholder no la substitueix. L\'error s\'enllaça amb aria-describedby. El cercador porta aria-label si no hi ha label visible.' },
    do: { es: 'Mensajes de error que dicen qué falta: «Falta el dominio del email».', en: 'Error messages that say what is missing: "The email domain is missing".', ca: 'Missatges d\'error que diuen què falta: «Falta el domini de l\'email».' },
    dont: { es: 'Un campo de otra altura que el botón que tiene al lado.', en: 'A field of a different height from the button next to it.', ca: 'Un camp d\'una altra alçada que el botó del costat.' },
  },
  {
    id: 'choice',
    name: { es: 'Casilla y opción', en: 'Checkbox and radio', ca: 'Casella i opció' },
    summary: {
      es: 'Casilla para marcar varias; opción para elegir una entre varias visibles. 16px. La casilla es cuadrada; la opción es un punto, por eso es redonda.',
      en: 'Checkbox to tick several; radio to choose one among visible options. 16px. The checkbox is square; the radio is a dot, hence round.',
      ca: 'Casella per marcar-ne diverses; opció per triar-ne una entre diverses visibles. 16px. La casella és quadrada; l\'opció és un punt, per això és rodona.',
    },
    sizes: [],
    states: ['default', 'hover', 'focus', 'selected', 'disabled'],
    variants: [
      {
        id: 'checkbox', className: 'ixu-check',
        label: { es: 'Casilla', en: 'Checkbox', ca: 'Casella' },
        cells: {
          default: c('White', '—', 'Ash'), hover: c('White', '—', 'Dark'), focus: c('White', '—', 'Dark 2px'),
          selected: c('Dark', 'marca Warm Light', 'Dark'), disabled: c('Warm Light', 'marcada: relleno Warm Dark, marca Dark 40%', 'Warm Dark'),
        },
      },
      {
        id: 'radio', className: 'ixu-check ixu-check--radio',
        label: { es: 'Opción', en: 'Radio', ca: 'Opció' },
        cells: {
          default: c('White', '—', 'Ash'), hover: c('White', '—', 'Dark'), focus: c('White', '—', 'Dark 2px'),
          selected: c('White', 'punto Dark 8px', 'Dark'), disabled: c('Warm Light', 'punto Dark 40%', 'Warm Dark'),
        },
      },
    ],
    a11y: { es: 'input nativo dentro de su <label>: toda la línea es zona de clic. Espacio marca; las flechas recorren un grupo de opciones.', en: 'Native input inside its <label>: the whole line is the hit area. Space toggles; arrows move through a radio group.', ca: 'input natiu dins de la seva <label>: tota la línia és zona de clic. Espai marca; les fletxes recorren un grup d\'opcions.' },
    do: { es: 'Filete de control Ash, como todo lo que se toca: una casilla tiene que verse sin texto al lado.', en: 'Ash control rule, like everything that can be touched: a checkbox must be visible without text beside it.', ca: 'Filet de control Ash, com tot el que es toca: una casella s\'ha de veure sense text al costat.' },
    dont: { es: 'Colorear la casilla con un acento.', en: 'Colouring the checkbox with an accent.', ca: 'Pintar la casella amb un accent.' },
  },
  {
    id: 'chip',
    name: { es: 'Chip de filtro', en: 'Filter chip', ca: 'Chip de filtre' },
    summary: {
      es: 'Acota lo que se ve en una colección: no ejecuta nada, cambia qué se muestra. Varios pueden estar activos a la vez. El chip simple filtra por una etiqueta; el chip con lista elige un valor (un cliente) y, mientras filtra, queda invertido con el nombre elegido. Va en barras de filtro, sin rótulo. En un formulario, para elegir un valor, se usa el desplegable.',
      en: 'Narrows what a collection shows: it runs nothing, it changes what is shown. Several can be active at once. The simple chip filters by a tag; the chip with list picks a value (a client) and, while it filters, stays inverted with the chosen name. It lives in filter bars, without a label. In a form, to pick a value, use the select.',
      ca: 'Acota el que es veu en una col·lecció: no executa res, canvia què es mostra. N\'hi pot haver diversos d\'actius alhora. El chip simple filtra per una etiqueta; el chip amb llista tria un valor (un client) i, mentre filtra, queda invertit amb el nom triat. Va en barres de filtre, sense rètol. En un formulari, per triar un valor, es fa servir el desplegable.',
    },
    sizes: ['sm'],
    states: ['default', 'hover', 'pressed', 'focus', 'open', 'selected', 'disabled'],
    variants: [
      {
        id: 'chip', className: 'ixu-chip',
        label: { es: 'Chip', en: 'Chip', ca: 'Chip' },
        cells: {
          default: c('White', 'Ash', 'Ash'), hover: c('White + Dark 8%', 'Dark', 'Dark'), pressed: c('White + Dark 16%', 'Dark', 'Dark'),
          focus: c('White + Dark 8%', 'Dark', 'Dark 2px'), selected: c('Dark', 'Warm Light', 'Dark'), disabled: DIS,
        },
      },
      {
        id: 'chipList', className: 'ixu-chip ixu-chip--list',
        label: { es: 'Chip con lista', en: 'Chip with list', ca: 'Chip amb llista' },
        cells: {
          default: c('White', 'Ash', 'Ash'), hover: c('White + Dark 8%', 'Dark', 'Dark'), pressed: c('White + Dark 16%', 'Dark', 'Dark'),
          focus: c('White + Dark 8%', 'Dark', 'Dark 2px'), open: c('White', 'Dark', 'Dark 2px · flecha 180°'),
          selected: c('Dark', 'Warm Light · nombre elegido', 'Dark'), disabled: DIS,
        },
      },
    ],
    a11y: { es: '<button aria-pressed>. Un chip que abre lista lleva aria-haspopup y aria-expanded; Escape la cierra y devuelve el foco.', en: '<button aria-pressed>. A chip that opens a list carries aria-haspopup and aria-expanded; Escape closes it and returns focus.', ca: '<button aria-pressed>. Un chip que obre llista porta aria-haspopup i aria-expanded; Escape la tanca i torna el focus.' },
    do: { es: 'Texto tal como se escribió la etiqueta. El chip con lista lleva la flecha del sistema (Iconos), que gira al desplegarse; nunca ▲▼ de texto.', en: 'Text exactly as the tag was written. The chip with list carries the system chevron (Icons), which turns when open; never text ▲▼.', ca: 'Text tal com es va escriure l\'etiqueta. El chip amb llista porta la fletxa del sistema (Icones), que gira en desplegar-se; mai ▲▼ de text.' },
    dont: { es: 'Llamarlo píldora y redondearlo. Es recto, como todo.', en: 'Calling it a pill and rounding it. It is square, like everything else.', ca: 'Dir-li píndola i arrodonir-lo. És recte, com tot.' },
  },
  {
    id: 'segmented',
    name: { es: 'Segmentado', en: 'Segmented control', ca: 'Segmentat' },
    summary: {
      es: 'Elige una opción entre dos y cuatro, siempre visibles. Segmentos de igual ancho que comparten filete.',
      en: 'Chooses one option among two to four, always visible. Equal-width segments sharing a rule.',
      ca: 'Tria una opció entre dues i quatre, sempre visibles. Segments d\'igual amplada que comparteixen filet.',
    },
    sizes: ['sm', 'md'],
    states: ['default', 'hover', 'focus', 'selected', 'disabled'],
    variants: [
      {
        id: 'segment', className: 'ixu-seg',
        label: { es: 'Segmento', en: 'Segment', ca: 'Segment' },
        cells: {
          default: c('White', 'Ash', 'Ash'), hover: c('White + Dark 8%', 'Dark', 'Ash'),
          focus: c('White + Dark 8%', 'Dark', 'Dark 2px'), selected: c('Dark', 'Warm Light', 'Dark'), disabled: DIS,
        },
      },
    ],
    a11y: { es: 'role="radiogroup" con role="radio" y aria-checked; las flechas cambian de opción.', en: 'role="radiogroup" with role="radio" and aria-checked; arrows change option.', ca: 'role="radiogroup" amb role="radio" i aria-checked; les fletxes canvien d\'opció.' },
    do: { es: 'Textos cortos en ui-label: «ES», «EN», «CLARO», «OSCURO».', en: 'Short labels in ui-label: "ES", "EN", "LIGHT", "DARK".', ca: 'Textos curts en ui-label: «ES», «EN», «CLAR», «FOSC».' },
    dont: { es: 'Más de cuatro opciones. Entonces es un desplegable.', en: 'More than four options. Then it is a select.', ca: 'Més de quatre opcions. Llavors és un desplegable.' },
  },
  {
    id: 'menu',
    name: { es: 'Menú', en: 'Menu', ca: 'Menú' },
    summary: {
      es: 'Lista flotante que abre un desplegable, un chip o un botón. Contenedor blanco con filete Dark; filas de 36px separadas por Warm Dark.',
      en: 'Floating list opened by a select, chip or button. White container with a Dark rule; 36px rows separated by Warm Dark.',
      ca: 'Llista flotant que obre un desplegable, un chip o un botó. Contenidor blanc amb filet Dark; files de 36px separades per Warm Dark.',
    },
    sizes: ['md'],
    states: ['default', 'hover', 'focus', 'selected', 'disabled'],
    variants: [
      {
        id: 'row', className: 'ixu-menu__item',
        label: { es: 'Fila', en: 'Row', ca: 'Fila' },
        cells: {
          default: c('White', 'Dark', '—'), hover: c('White + Dark 8%', 'Dark', '—'), focus: c('White + Dark 8%', 'Dark', 'Dark 2px'),
          selected: c('Dark', 'Warm Light', '—'), disabled: DIS_BARE,
        },
      },
    ],
    a11y: { es: 'role="menu" o "listbox". Flechas para recorrer, Enter para elegir, Escape cierra y devuelve el foco a quien lo abrió.', en: 'role="menu" or "listbox". Arrows to move, Enter to choose, Escape closes and returns focus to the opener.', ca: 'role="menu" o "listbox". Fletxes per recórrer, Enter per triar, Escape tanca i torna el focus a qui l\'ha obert.' },
    do: { es: 'Se abre 6px por debajo de su disparador, alineado a su izquierda.', en: 'Opens 6px below its trigger, aligned to its left edge.', ca: 'S\'obre 6px per sota del seu disparador, alineat a la seva esquerra.' },
    dont: { es: 'Usar el <select> nativo en herramientas: su lista la pinta el sistema y no sigue la marca.', en: 'Using the native <select> in tools: the OS draws its list and it ignores the brand.', ca: 'Fer servir el <select> natiu en eines: la seva llista la pinta el sistema i no segueix la marca.' },
  },
  {
    id: 'tag',
    name: { es: 'Etiqueta', en: 'Tag', ca: 'Etiqueta' },
    summary: {
      es: 'Texto que pone el usuario para clasificar algo (un deck, un formulario). Se quita con su ×, que es lo único interactivo: la etiqueta en sí no se pulsa. Para filtrar por etiquetas se usa el chip de filtro.',
      en: 'Text the user adds to classify something (a deck, a form). It is removed with its ×, the only interactive part: the tag itself is not clickable. To filter by tags, use the filter chip.',
      ca: 'Text que posa l\'usuari per classificar alguna cosa (un deck, un formulari). Es treu amb la seva ×, que és l\'única part interactiva: l\'etiqueta en si no es prem. Per filtrar per etiquetes es fa servir el xip de filtre.',
    },
    sizes: ['xs'],
    states: ['default', 'hover', 'focus'],
    variants: [
      {
        id: 'tag', className: 'ixu-tag',
        label: { es: 'Etiqueta', en: 'Tag', ca: 'Etiqueta' },
        cells: {
          default: c('White', 'Dark · × Ash', 'Warm Dark'),
          hover: c('White', 'Dark · × Dark', 'Warm Dark'),
          focus: c('White', 'Dark · × Dark', 'Warm Dark · × anillo 2px'),
        },
      },
    ],
    a11y: { es: 'La × es un <button> con aria-label «Quitar <etiqueta>». Área de pulsación de 16×16 alrededor del glifo de 12 (talla xs). Su foco es un anillo Dark de 2px en el borde de esa área: no tiene filete que engrosar.', en: 'The × is a <button> with aria-label "Remove <tag>". 16×16 hit area around the 12px glyph (size xs). Its focus is a 2px Dark ring on the edge of that area: it has no rule to thicken.', ca: 'La × és un <button> amb aria-label «Treure <etiqueta>». Àrea de pulsació de 16×16 al voltant del glif de 12 (talla xs). El seu focus és un anell Dark de 2px a la vora d\'aquesta àrea: no té filet per engruixir.' },
    do: { es: 'Minúsculas, el texto tal como lo escribe el usuario.', en: 'Lower case, the text exactly as the user typed it.', ca: 'Minúscules, el text tal com l\'escriu l\'usuari.' },
    dont: { es: 'Usarla como filtro o como estado: lo primero es un chip; lo segundo, un badge.', en: 'Using it as a filter or a status: the first is a chip, the second a badge.', ca: 'Fer-la servir com a filtre o com a estat: el primer és un xip; el segon, un badge.' },
  },
  {
    id: 'card',
    name: { es: 'Tarjeta', en: 'Card', ca: 'Targeta' },
    summary: {
      es: 'Superficie que agrupa un objeto de una colección (un deck, un formulario, una herramienta) y lleva a él. Si es un enlace, toda la tarjeta es el área de clic.',
      en: 'Surface grouping one item of a collection (a deck, a form, a tool) and leading to it. When it is a link, the whole card is the click area.',
      ca: 'Superfície que agrupa un objecte d\'una col·lecció (un deck, un formulari, una eina) i hi porta. Si és un enllaç, tota la targeta és l\'àrea de clic.',
    },
    sizes: [],
    states: ['default', 'hover', 'focus'],
    variants: [
      {
        id: 'link', className: 'ixu-card',
        label: { es: 'Enlace', en: 'Link', ca: 'Enllaç' },
        cells: {
          default: c('White', 'Dark', 'Warm Dark'),
          hover: c('White · sombra · sube 2px', 'Dark', 'Dark'),
          focus: c('White · sombra · sube 2px', 'Dark', 'Dark 2px'),
        },
      },
    ],
    a11y: { es: 'Un solo <a> envuelve la tarjeta; dentro no hay otros enlaces. Si necesita acciones propias (duplicar, eliminar), van fuera del enlace.', en: 'A single <a> wraps the card, with no other links inside. Its own actions (duplicate, delete) sit outside the link.', ca: 'Un sol <a> embolcalla la targeta; a dins no hi ha altres enllaços. Si necessita accions pròpies (duplicar, eliminar), van fora de l\'enllaç.' },
    do: { es: 'La sombra del hover es la única del sistema: 0 6 18 Dark al 16%, 300ms expo.', en: 'The hover shadow is the only one in the system: 0 6 18 Dark at 16%, 300ms expo.', ca: 'L\'ombra del hover és l\'única del sistema: 0 6 18 Dark al 16%, 300ms expo.' },
    dont: { es: 'Sombras en reposo ni en ningún otro componente.', en: 'Shadows at rest or on any other component.', ca: 'Ombres en repòs ni en cap altre component.' },
  },
];

/* ── 6 · Piezas sin matriz ───────────────────────────────────────────────────────
   Contenedores y señales: no son interactivos en sí (o su interacción es la de un botón que
   contienen), así que se especifican con sus medidas, no con una matriz de estados. */

export const uiPieces: { id: string; name: L; spec: L }[] = [
  { id: 'header',  name: { es: 'Cabecera de herramienta', en: 'Tool header', ca: 'Capçalera d\'eina' },
    spec: { es: '56px de alto: controles md (36) con 10px arriba y abajo y 16px a los lados. Fondo Warm Light, filete inferior Warm Dark. Imagotipo a la izquierda (vuelve al inicio), título en ui-title, acciones a la derecha.', en: '56px tall: md controls (36) with 10px top and bottom and 16px at the sides. Warm Light background, Warm Dark bottom rule. Imagotype on the left (goes home), title in ui-title, actions on the right.', ca: '56px d\'alt: controls md (36) amb 10px a dalt i a baix i 16px als costats. Fons Warm Light, filet inferior Warm Dark. Imagotip a l\'esquerra (torna a l\'inici), títol en ui-title, accions a la dreta.' } },
  { id: 'dialog',  name: { es: 'Diálogo', en: 'Dialog', ca: 'Diàleg' },
    spec: { es: 'Hasta 560px de ancho, padding 32. Fondo Warm Light, filete Dark, velo Dark al 28%. Título en ui-title, cuerpo en ui-text, acciones abajo a la derecha: secundario y luego primario o crítico. Escape y clic fuera cierran.', en: 'Up to 560px wide, 32 padding. Warm Light background, Dark rule, Dark 28% scrim. Title in ui-title, body in ui-text, actions bottom right: secondary, then primary or critical. Escape and outside click close it.', ca: 'Fins a 560px d\'amplada, padding 32. Fons Warm Light, filet Dark, vel Dark al 28%. Títol en ui-title, cos en ui-text, accions a baix a la dreta: secundari i després primari o crític. Escape i clic fora el tanquen.' } },
  { id: 'tooltip', name: { es: 'Tooltip', en: 'Tooltip', ca: 'Tooltip' },
    spec: { es: '24px de alto, padding 0 8. Fondo Dark, texto Warm Light en ui-text. Aparece 6px bajo el elemento al hover o al foco. Nombra la acción; no la explica: si hay que explicar algo (unas reglas, un formato), no es un tooltip sino un panel que se abre con clic. Sobre una superficie oscura se invierte: Warm Light con texto Dark.', en: '24px tall, 0 8 padding. Dark background, Warm Light text in ui-text. Appears 6px below the element on hover or focus. Names the action; does not explain it: anything that needs explaining (rules, a format) is not a tooltip but a panel opened on click. On a dark surface it inverts: Warm Light with Dark text.', ca: '24px d\'alt, padding 0 8. Fons Dark, text Warm Light en ui-text. Apareix 6px sota l\'element en hover o focus. Anomena l\'acció; no l\'explica: si cal explicar alguna cosa (unes regles, un format), no és un tooltip sinó un panell que s\'obre amb clic. Sobre una superfície fosca s\'inverteix: Warm Light amb text Dark.' } },
  { id: 'badge',   name: { es: 'Badge', en: 'Badge', ca: 'Badge' },
    spec: { es: 'El rótulo de la web (peldaño caption, en mayúsculas) metido en una caja de talla xs (24px). Dice el estado de un objeto: activo (publicado) = invertido; inactivo (borrador) = filete Ash. No se pulsa.', en: 'The web label (caption step, in capitals) inside a size xs box (24px). States an item\'s status: active (published) = inverted; inactive (draft) = Ash rule. Not clickable.', ca: 'El rètol de la web (graó caption, en majúscules) dins d\'una caixa de talla xs (24px). Diu l\'estat d\'un objecte: actiu (publicat) = invertit; inactiu (esborrany) = filet Ash. No es prem.' } },
  { id: 'alert',   name: { es: 'Aviso', en: 'Alert', ca: 'Avís' },
    spec: { es: 'Tres formas, según a qué se refiere. En línea: texto sin caja pegado a lo que avisa (un campo, una acción), en ui-text y en Error o Success; la cercanía ya dice de qué habla. Banner: el aviso es de toda la pantalla y no hay nada a lo que pegarlo; crítico con filete y texto Error sobre Error al 6%, éxito igual en Success, neutro con filete Warm Dark sobre Warm Light; padding 12 16. Toast: confirmación que se va sola; Dark con texto Warm Light, padding 12 16, abajo al centro, 3s.', en: 'Three forms, depending on what it refers to. Inline: unboxed text attached to what it is about (a field, an action), in ui-text and in Error or Success; proximity already says what it refers to. Banner: the alert concerns the whole screen and there is nothing to attach it to; critical with Error rule and text on Error at 6%, success the same in Success, neutral with a Warm Dark rule on Warm Light; 12 16 padding. Toast: a confirmation that goes away by itself; Dark with Warm Light text, 12 16 padding, bottom centre, 3s.', ca: 'Tres formes, segons a què es refereix. En línia: text sense caixa enganxat al que avisa (un camp, una acció), en ui-text i en Error o Success; la proximitat ja diu de què parla. Bàner: l\'avís és de tota la pantalla i no hi ha res on enganxar-lo; crític amb filet i text Error sobre Error al 6%, èxit igual en Success, neutre amb filet Warm Dark sobre Warm Light; padding 12 16. Toast: confirmació que se\'n va sola; Dark amb text Warm Light, padding 12 16, a baix al centre, 3s.' } },
];

/* ── Principios (encabezan la sección) ─────────────────────────────────────────── */

export const uiPrinciples: { id: string; title: L; body: L }[] = [
  { id: 'radio', title: { es: 'Esquina recta', en: 'Square corners', ca: 'Cantonada recta' },
    body: { es: 'Radio 0. Solo es redondo lo que es un punto: la opción de un grupo. Nada más, tampoco los botones de icono.', en: 'Radius 0. Only what is a dot is round: a radio option. Nothing else, icon buttons included.', ca: 'Radi 0. Només és rodó el que és un punt: l\'opció d\'un grup. Res més, tampoc els botons d\'icona.' } },
  { id: 'filete', title: { es: 'Filete, no sombra', en: 'Rule, not shadow', ca: 'Filet, no ombra' },
    body: { es: 'Todo se delimita con 1px, y el filete dice qué es cada cosa: Ash si se toca, Warm Dark si solo ordena. La profundidad la da el contraste, no la sombra.', en: 'Everything is bounded by 1px, and the rule says what each thing is: Ash if it can be touched, Warm Dark if it only organises. Depth comes from contrast, not shadow.', ca: 'Tot es delimita amb 1px, i el filet diu què és cada cosa: Ash si es toca, Warm Dark si només ordena. La profunditat la dona el contrast, no l\'ombra.' } },
  { id: 'inversion', title: { es: 'Seleccionar es invertir', en: 'Selecting is inverting', ca: 'Seleccionar és invertir' },
    body: { es: 'Lo elegido pasa a Dark con texto Warm Light. Un solo gesto para todos los componentes.', en: 'What is chosen turns Dark with Warm Light text. One gesture for every component.', ca: 'El que s\'ha triat passa a Dark amb text Warm Light. Un sol gest per a tots els components.' } },
  { id: 'paleta', title: { es: 'Paleta base y colores funcionales', en: 'Base palette and functional colours', ca: 'Paleta base i colors funcionals' },
    body: { es: 'La interfaz se construye con la paleta base. Error y Success solo marcan estado. Los acentos de servicio no entran en la interfaz.', en: 'The interface is built from the base palette. Error and Success only mark state. Service accents do not enter the interface.', ca: 'La interfície es construeix amb la paleta base. Error i Success només marquen estat. Els accents de servei no entren a la interfície.' } },
  { id: 'teclado', title: { es: 'Todo funciona con teclado', en: 'Everything works by keyboard', ca: 'Tot funciona amb teclat' },
    body: { es: 'Cada componente tiene foco visible y un comportamiento de teclado escrito. Si no se puede usar sin ratón, no está terminado.', en: 'Every component has visible focus and a written keyboard behaviour. If it cannot be used without a mouse, it is not finished.', ca: 'Cada component té focus visible i un comportament de teclat escrit. Si no es pot fer servir sense ratolí, no està acabat.' } },
];

/* ── Iconos ─────────────────────────────────────────────────────────────────────
   Noviembre de 2026: la marca no tenía estilo de iconos y cada herramienta dibujaba el suyo
   (trazos 1,2 / 1,3 / 1,4 / 2 sobre 24, remates redondos y rectos, esquinas con rx). Alberto
   eligió el glifo macizo. Los iconos de referencia viven en SectionInterfaz.tsx (Ico). */
export type UiIconRule = { id: string; title: L; body: L };
export const uiIconRules: UiIconRule[] = [
  { id: 'macizo', title: { es: 'Glifo macizo', en: 'Solid glyph', ca: 'Glif massís' },
    body: { es: 'Lo que tiene superficie se rellena (cuadrícula, papelera, copiar, información). Lo que es solo línea (lupa, más, cerrar, flechas, check, encendido) se dibuja a 2px: es el grosor que iguala el peso de un relleno a 16px. Nunca contorno fino: un icono a 1,4px junto a uno macizo parece de otra familia.', en: 'Whatever has a surface is filled (grid, trash, copy, info). Whatever is only a line (search, plus, close, arrows, check, power) is drawn at 2px: the weight that matches a fill at 16px. Never a thin outline: a 1.4px icon next to a solid one looks like another family.', ca: 'El que té superfície s\'omple (quadrícula, paperera, copiar, informació). El que és només línia (lupa, més, tancar, fletxes, check, encesa) es dibuixa a 2px: és el gruix que iguala el pes d\'un farciment a 16px. Mai contorn fi: una icona a 1,4px al costat d\'una massissa sembla d\'una altra família.' } },
  { id: 'reticula', title: { es: 'Retícula y tamaño', en: 'Grid and size', ca: 'Retícula i mida' },
    body: { es: 'Se dibujan en 16×16 sobre un área viva de 12: un cuadrado ocupa 12×12; un círculo, 13 de diámetro, porque a igual medida lo redondo se ve más pequeño. Así todos pesan lo mismo dentro del botón. 16px en controles md y lg, 14 en sm, 12 en xs (la × de la etiqueta). La flecha del desplegable es un indicador, no un icono: 12 en md y 10 en sm. Coordenadas enteras: a esos tamaños, medio píxel emborrona el borde.', en: 'Drawn on 16×16 over a 12px live area: a square takes 12×12; a circle, 13 across, because at the same size round shapes look smaller. That way they all weigh the same inside the button. 16px in md and lg controls, 14 in sm, 12 in xs (the tag ×). The select arrow is an indicator, not an icon: 12 in md and 10 in sm. Whole-pixel coordinates: at these sizes half a pixel blurs the edge.', ca: 'Es dibuixen en 16×16 sobre una àrea viva de 12: un quadrat ocupa 12×12; un cercle, 13 de diàmetre, perquè a igual mida el que és rodó es veu més petit. Així totes pesen el mateix dins del botó. 16px en controls md i lg, 14 en sm, 12 en xs (la × de l\'etiqueta). La fletxa del desplegable és un indicador, no una icona: 12 en md i 10 en sm. Coordenades enteres: a aquestes mides, mig píxel emborrona la vora.' } },
  { id: 'recto', title: { es: 'Ángulo recto', en: 'Right angles', ca: 'Angle recte' },
    body: { es: 'Remate recto y unión en inglete; sin radio en las esquinas, como el resto de la interfaz. Solo es redondo lo que la figura es redonda: la lupa, el encendido, la información.', en: 'Square caps and mitre joins; no corner radius, like the rest of the interface. Only what is round by nature is round: search, power, info.', ca: 'Remat recte i unió en biaix; sense radi a les cantonades, com la resta de la interfície. Només és rodó el que la figura és rodona: la lupa, l\'encesa, la informació.' } },
  { id: 'color', title: { es: 'Un color, el del texto', en: 'One colour: the text colour', ca: 'Un color, el del text' },
    body: { es: 'Siempre currentColor: el icono hereda el estado de su control (hover, seleccionado, desactivado) sin reglas propias. Un botón solo de icono lleva aria-label; el icono es aria-hidden.', en: 'Always currentColor: the icon inherits its control\'s state (hover, selected, disabled) with no rules of its own. An icon-only button carries aria-label; the icon is aria-hidden.', ca: 'Sempre currentColor: la icona hereta l\'estat del seu control (hover, seleccionat, desactivat) sense regles pròpies. Un botó només d\'icona porta aria-label; la icona és aria-hidden.' } },
];
