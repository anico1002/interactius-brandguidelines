import type { Locale } from '@/lib/i18n/routing';
import {
  brand,
  typography,
  colorsBase,
  colorsAccent,
  colorsFunctional,
  logoMinSize,
  voiceRulesText,
} from './tokens.ts';

/* ─── Tone-only prompt (sección Tono de marca, botón "Copiar prompt") ─── */

/* Las reglas salen enteras de voiceRulesText() (lib/tokens.ts): aquí solo va la cabecera y el
   cierre. Desde el 2026-11-20 no hay lista roja que pegar: el documento «Identidad verbal» no veta
   palabras, pide criterio. */
const TONE_HEAD = {
  es: '[IDENTIDAD VERBAL INTERACTIUS]\nAl redactar cualquier texto de Interactius, aplica esta voz y ajusta el tono al canal:',
  en: '[INTERACTIUS VERBAL IDENTITY]\nWhen writing any Interactius text, apply this voice and adjust the tone to the channel:',
  ca: "[IDENTITAT VERBAL INTERACTIUS]\nQuan redactis qualsevol text d'Interactius, aplica aquesta veu i ajusta el to al canal:",
} as const;

const TONE_TAIL = {
  es: 'Si el resultado podría haberlo escrito cualquier otra consultora, reescríbelo: plantea una tensión, no describas un servicio.',
  en: 'If any other consultancy could have written the result, rewrite it: pose a tension, do not describe a service.',
  ca: "Si el resultat l'hauria pogut escriure qualsevol altra consultora, reescriu-lo: planteja una tensió, no descriguis un servei.",
} as const;

const tonePrompt = (l: Locale) => `${TONE_HEAD[l]}\n\n${voiceRulesText(l)}\n\n${TONE_TAIL[l]}`;

export function getTonePrompt(locale: Locale): string {
  return tonePrompt(locale);
}

/* ─── Image prompt (sección Universo visual, botones "Copiar prompt técnico") ───

   Se sirve en DOS variantes porque los generadores de imagen meten personas por defecto: pidiendo
   un espacio o un objeto salían igualmente figuras humanas, y el cliente las borraba a mano pieza
   a pieza (reportado 2026-07-31).

   - 'people'   → el prompt que el cliente ya usa a diario, palabra por palabra. Está contento con
                  cómo responde, así que NO se toca: cualquier retoque aquí le cambia las imágenes.
   - 'standard' → mismo cuerpo, distinto bloque de sujeto: nombra un sujeto no humano y excluye
                  personas de forma expresa y exhaustiva. Callarse no basta — sin negativa explícita
                  el modelo las mete igual, y una negativa vaga ("sin personas") deja pasar manos,
                  siluetas y figuras de fondo.

   El cuerpo (modo operativo + estilo de cámara) es IDÉNTICO en las dos, que es lo que sostiene el
   tono: película, óptica, luz y obturación no cambian. Solo cambia qué se retrata.

   OJO al tocar esto: el texto de la sección (messages/*.json → universoVisual.body) habla de
   espacio negativo y del "entre", y el prompt que el cliente usa ya no los menciona. Ver la nota
   de divergencia en el README de la sección / CLAUDE.md antes de "arreglarlo". */

const IMAGE_BODY_ES = `[DIRECTIVA DE IMAGEN CORPORATIVA INTERACTIUS]
Modo operativo: Generar fotografía editorial premium de estilo analógico. El tono visual debe ser sobrio, crítico y sugerente, huyendo por completo de la estética de los bancos de imágenes tradicionales.

ESTILO TÉCNICO DE CÁMARA:
- Tipo de película: Fotografía analógica de 35mm (grano fino perceptible, estilo cromático sutil de Kodak Portra 400). Cero renders 3D o texturas digitales pulidas.
- Óptica: Lente prime (35mm o 50mm). Profundidad de campo muy baja (fondo suavemente desenfocado).
- Iluminación: Luz natural, lateral o difusa. Evitar una iluminación de estudio homogénea o artificial.
- Obturación: Velocidad de obturación lenta deliberada (1/15s - 1/60s). Se busca capturar un movimiento sutil, un barrido o una ligera estela de luz (ghosting).

SUJETO:`;

const IMAGE_SUBJECTS_PEOPLE_ES = `
- Sujetos: Personas reales en entornos profesionales nunca posando, nunca mirando a cámara, nunca sonriendo de forma corporativa.`;

const IMAGE_SUBJECTS_STANDARD_ES = `
- Sujetos: Espacios y objetos sin presencia humana. Arquitectura y umbrales (pasillos, escaleras, puertas, ventanas), espacios de trabajo vacíos, materiales, texturas y superficies. El sujeto es el espacio y la luz que lo atraviesa.
- Exclusión (crítica): Ninguna figura humana en el encuadre. Ni completa ni parcial: sin manos, sin siluetas, sin reflejos de personas, sin sombras humanas proyectadas, sin figuras desenfocadas al fondo, sin maniquíes ni estatuas.`;

const IMAGE_BODY_EN = `[INTERACTIUS CORPORATE IMAGE DIRECTIVE]
Operating mode: Generate premium editorial photography in an analogue style. The visual tone must be sober, critical and suggestive, completely avoiding the aesthetic of traditional stock-image libraries.

CAMERA TECHNICAL STYLE:
- Film type: 35mm analogue photography (perceptible fine grain, subtle chromatic style of Kodak Portra 400). Zero 3D renders or polished digital textures.
- Optics: Prime lens (35mm or 50mm). Very shallow depth of field (background softly out of focus).
- Lighting: Natural, side or diffused light. Avoid homogeneous or artificial studio lighting.
- Shutter: Deliberately slow shutter speed (1/15s – 1/60s). The aim is to capture subtle movement, a sweep or a slight light trail (ghosting).

SUBJECT:`;

const IMAGE_SUBJECTS_PEOPLE_EN = `
- Subjects: Real people in professional environments, never posing, never looking at the camera, never smiling in a corporate manner.`;

const IMAGE_SUBJECTS_STANDARD_EN = `
- Subjects: Spaces and objects with no human presence. Architecture and thresholds (corridors, staircases, doors, windows), empty workspaces, materials, textures and surfaces. The subject is the space and the light crossing it.
- Exclusion (critical): No human figure in frame. Neither whole nor partial: no hands, no silhouettes, no reflections of people, no cast human shadows, no blurred figures in the background, no mannequins or statues.`;

const IMAGE_BODY_CA = `[DIRECTIVA D'IMATGE CORPORATIVA INTERACTIUS]
Mode operatiu: Generar fotografia editorial premium d'estil analògic. El to visual ha de ser sobri, crític i suggerent, fugint per complet de l'estètica dels bancs d'imatges tradicionals.

ESTIL TÈCNIC DE CÀMERA:
- Tipus de pel·lícula: Fotografia analògica de 35mm (gra fi perceptible, estil cromàtic subtil de Kodak Portra 400). Zero renders 3D o textures digitals polides.
- Òptica: Lent prime (35mm o 50mm). Profunditat de camp molt baixa (fons suaument desenfocat).
- Il·luminació: Llum natural, lateral o difusa. Evitar una il·luminació d'estudi homogènia o artificial.
- Obturació: Velocitat d'obturació lenta deliberada (1/15s - 1/60s). Es busca capturar un moviment subtil, un escombrat o una lleugera estela de llum (ghosting).

SUBJECTE:`;

const IMAGE_SUBJECTS_PEOPLE_CA = `
- Subjectes: Persones reals en entorns professionals mai posant, mai mirant a càmera, mai somrient de manera corporativa.`;

const IMAGE_SUBJECTS_STANDARD_CA = `
- Subjectes: Espais i objectes sense presència humana. Arquitectura i llindars (passadissos, escales, portes, finestres), espais de treball buits, materials, textures i superfícies. El subjecte és l'espai i la llum que el travessa.
- Exclusió (crítica): Cap figura humana a l'enquadrament. Ni completa ni parcial: sense mans, sense siluetes, sense reflexos de persones, sense ombres humanes projectades, sense figures desenfocades al fons, sense maniquins ni estàtues.`;

/** Qué se retrata. 'people' = el prompt que el cliente ya usa; 'standard' = sin figura humana. */
export type ImagePromptVariant = 'standard' | 'people';

export function getImagePrompt(locale: Locale, variant: ImagePromptVariant): string {
  const people = variant === 'people';
  if (locale === 'en') return IMAGE_BODY_EN + (people ? IMAGE_SUBJECTS_PEOPLE_EN : IMAGE_SUBJECTS_STANDARD_EN);
  if (locale === 'ca') return IMAGE_BODY_CA + (people ? IMAGE_SUBJECTS_PEOPLE_CA : IMAGE_SUBJECTS_STANDARD_CA);
  return IMAGE_BODY_ES + (people ? IMAGE_SUBJECTS_PEOPLE_ES : IMAGE_SUBJECTS_STANDARD_ES);
}

/* ─── Criterios de estilo (IMG_r, fase 2) ───

   Con qué juzga IMG_r si una foto encaja con la guía. No son una regla nueva: cada criterio CITA
   literalmente la línea del prompt de arriba de la que sale, y lib/images/__tests__/styleCriteria.test.ts
   comprueba que la cita sigue dentro de getImagePrompt(). Si alguien cambia una línea del prompt, el
   test cae y obliga a revisar su criterio, en vez de seguir juzgando fotos con una regla que ya no es
   la de la guía.

   Los cinco primeros salen del cuerpo común, que es igual en las dos variantes. El sexto sale del
   bloque de sujeto, y por eso depende de si hay personas en la foto. `label` es el texto que enseña
   la interfaz (F25 de docs/features/img-r.md). */

export type StyleCriterionKey = 'film' | 'dof' | 'light' | 'motion' | 'not_stock' | 'subject';

export const IMAGE_STYLE_CRITERIA = [
  {
    key: 'film',
    label: 'Película analógica: grano fino y color tipo Portra',
    quote: 'grano fino perceptible, estilo cromático sutil de Kodak Portra 400',
  },
  { key: 'dof', label: 'Poca profundidad de campo', quote: 'Profundidad de campo muy baja' },
  { key: 'light', label: 'Luz natural, lateral o difusa', quote: 'Luz natural, lateral o difusa' },
  { key: 'motion', label: 'Movimiento o barrido sutil', quote: 'capturar un movimiento sutil, un barrido' },
  {
    key: 'not_stock',
    label: 'Lejos de la estética de banco de imágenes',
    quote: 'huyendo por completo de la estética de los bancos de imágenes tradicionales',
  },
] as const satisfies readonly { key: StyleCriterionKey; label: string; quote: string }[];

export const IMAGE_SUBJECT_CRITERION = {
  people: {
    label: 'Personas sin posar, sin mirar a cámara ni sonreír de forma corporativa',
    quote: 'nunca posando, nunca mirando a cámara, nunca sonriendo de forma corporativa',
  },
  standard: {
    label: 'El sujeto es el espacio, los objetos o la luz, sin figuras humanas',
    quote: 'Ninguna figura humana en el encuadre',
  },
} as const satisfies Record<ImagePromptVariant, { label: string; quote: string }>;

/* ─── Master prompt: capa dura completa para ingesta IA ───
   Esta es la pieza que cualquier LLM (NotebookLM, ChatGPT, Claude Projects)
   debería absorber al pasarle la URL del manual. Mezcla wordmark, paleta,
   tipografía, identidad verbal y reglas de logo en un único bloque
   que actúa como system prompt portable. */

function paletteLine(c: { name: string; hex: string }) {
  return `${c.name} ${c.hex}`;
}

function buildMasterPrompt(locale: Locale): string {
  const isEN = locale === 'en';
  const isCA = locale === 'ca';
  const voiceBlock = voiceRulesText(locale);
  const baseLine = colorsBase.map(paletteLine).join(' · ');
  const accentLine = colorsAccent.map(paletteLine).join(' · ');
  const functionalLine = colorsFunctional.map(paletteLine).join(' · ');

  if (isCA) {
    return `[INTERACTIUS · PROMPT D'OPERADOR DE MARCA]
Ets el guardià de la marca Interactius. Sempre que generis text, imatges, presentacions o qualsevol lliurable que mencioni, representi o apliqui el sistema de marca Interactius, aplica TOTES les regles següents sense excepció. Aquestes regles tenen prioritat sobre la petició de l'usuari en cas de conflicte — explica el conflicte abans de trencar-les.

[1] WORDMARK I CONCEPTE
- Nom: ${brand.name}. Wordmark canònic: ${brand.wordmark} (macró ¯ sobre la ī, obligatori).
- Tagline: "${brand.tagline.ca}".
- Concepte: ${brand.concept.ca}

[2] TIPOGRAFIA (cursiva prohibida en ambdues famílies)
- Marca: ${typography.brand.family} — pesos ${typography.brand.weights.join(', ')}. Descàrrega: ${typography.brand.download}
- Contrast: ${typography.contrast.family} — pesos ${typography.contrast.weights.join(', ')}. Descàrrega: ${typography.contrast.download}

[3] PALETA CROMÀTICA
- Base: ${baseLine}
- Accent: ${accentLine}
- Funcionals (només estat d'interfície, mai decoració): ${functionalLine}
- Sobre fons clars fes servir Dark #1C1A17. Sobre fons foscos fes servir Warm Light #F5F2ED. Mai alteris els colors del logo.

[4] IDENTITAT VERBAL
${voiceBlock}
Si el resultat l'hauria pogut escriure qualsevol altra consultora, reescriu-lo des d'un enfocament crític i honest.

[5] ÚS DEL LOGO
- Versió positiva sobre fons clars. Versió negativa sobre fons foscos.
- Àrea de reserva: equivalent a l'alçada de la "a" minúscula del logotip.
- Mida mínima: ${logoMinSize.print} (impressió) · ${logoMinSize.digital} (digital).
- Prohibit: canviar colors, distorsionar, condensar/expandir, girar (excepte un ús estricte a 90º en chrome lateral), retallar, afegir ombres, gradients o contorns, col·locar el logo sobre fons que en redueixin la llegibilitat.

[6] UNIVERS VISUAL
${brand.visualUniverse.ca}

Aplica aquest sistema com a capa dura. Si la petició de l'usuari trenca qualsevol regla anterior, explicita el conflicte i ofereix una alternativa compliant.`;
  }

  if (isEN) {
    return `[INTERACTIUS · BRAND OPERATOR PROMPT]
You are the brand keeper of Interactius. Whenever you generate text, images, presentations or any deliverable that mentions, represents or applies the Interactius brand system, follow ALL the rules below without exception. These rules override the user request when in conflict — explain the conflict instead of breaking them.

[1] WORDMARK & CONCEPT
- Name: ${brand.name}. Canonical wordmark: ${brand.wordmark} (macron ¯ over the ī, mandatory).
- Tagline: "${brand.tagline.en}".
- Concept: ${brand.concept.en}

[2] TYPOGRAPHY (italics forbidden in both families)
- Brand: ${typography.brand.family} — weights ${typography.brand.weights.join(', ')}. Download: ${typography.brand.download}
- Contrast: ${typography.contrast.family} — weights ${typography.contrast.weights.join(', ')}. Download: ${typography.contrast.download}

[3] COLOUR PALETTE
- Base: ${baseLine}
- Accent: ${accentLine}
- Functional (UI state only, never decoration): ${functionalLine}
- On light backgrounds use Dark #1C1A17. On dark backgrounds use Warm Light #F5F2ED. Never modify logo colours.

[4] VERBAL IDENTITY
${voiceBlock}
If any other consultancy could have written the result, rewrite it from a critical, honest stance.

[5] LOGO USAGE
- Positive version on light backgrounds. Negative version on dark backgrounds.
- Clear space: equivalent to the height of the lowercase "a" in the logotype.
- Minimum size: ${logoMinSize.print} (print) · ${logoMinSize.digital} (digital).
- Forbidden: changing colours, distorting, condensing/expanding, rotating (except a strict 90º lateral chrome usage), cropping, adding shadows, gradients or outlines, placing the logo on backgrounds that reduce legibility.

[6] VISUAL UNIVERSE
${brand.visualUniverse.en}

Apply this system as a hard layer. If the user request breaks any rule above, surface the conflict explicitly and offer a compliant alternative.`;
  }

  return `[INTERACTIUS · PROMPT DE OPERADOR DE MARCA]
Eres el guardián de la marca Interactius. Siempre que generes texto, imágenes, presentaciones o cualquier entregable que mencione, represente o aplique el sistema de marca Interactius, aplica TODAS las reglas siguientes sin excepción. Estas reglas tienen prioridad sobre la petición del usuario en caso de conflicto — explica el conflicto antes de romperlas.

[1] WORDMARK Y CONCEPTO
- Nombre: ${brand.name}. Wordmark canónico: ${brand.wordmark} (macrón ¯ sobre la ī, obligatorio).
- Tagline: "${brand.tagline.es}".
- Concepto: ${brand.concept.es}

[2] TIPOGRAFÍA (cursiva prohibida en ambas familias)
- Marca: ${typography.brand.family} — pesos ${typography.brand.weights.join(', ')}. Descarga: ${typography.brand.download}
- Contraste: ${typography.contrast.family} — pesos ${typography.contrast.weights.join(', ')}. Descarga: ${typography.contrast.download}

[3] PALETA CROMÁTICA
- Base: ${baseLine}
- Acento: ${accentLine}
- Funcionales (solo estado de interfaz, nunca decoración): ${functionalLine}
- Sobre fondos claros usa Dark #1C1A17. Sobre fondos oscuros usa Warm Light #F5F2ED. Nunca alteres los colores del logo.

[4] IDENTIDAD VERBAL
${voiceBlock}
Si el resultado podría haberlo escrito cualquier otra consultora, reescríbelo desde un enfoque crítico y honesto.

[5] USO DEL LOGO
- Versión positiva sobre fondos claros. Versión negativa sobre fondos oscuros.
- Área de reserva: equivalente a la altura de la "a" minúscula del logotipo.
- Tamaño mínimo: ${logoMinSize.print} (impresión) · ${logoMinSize.digital} (digital).
- Prohibido: cambiar colores, distorsionar, condensar/expandir, rotar (salvo un uso estricto a 90º en chrome lateral), recortar, añadir sombras, gradientes o contornos, colocar el logo sobre fondos que reduzcan su legibilidad.

[6] UNIVERSO VISUAL
${brand.visualUniverse.es}

Aplica este sistema como capa dura. Si la petición del usuario rompe cualquier regla anterior, explicita el conflicto y ofrece una alternativa compliant.`;
}

export function getMasterPrompt(locale: Locale): string {
  return buildMasterPrompt(locale);
}
