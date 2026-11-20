/* ReWrit_r — el system prompt, compuesto desde los tokens de marca.

   La voz NO se escribe aquí: se compone desde lib/tokens.ts (voiceRulesText: principio, valores,
   ejes, estructura, longitud, puntuación y vocabulario de marca). Si cambia la identidad verbal en
   tokens, cambia lo que esta herramienta exige, sin tocar este fichero. Desde el 2026-11-20 no hay
   lista roja: el documento «Identidad verbal» no veta palabras. Es el mismo criterio que siguen
   lib/llms.ts y lib/prompts.ts, que ya construyen sus bloques desde la misma fuente.

   Función pura: mismo input, mismo prompt. Se prueba en __tests__/prompt.test.ts. */

/* Imports relativos con extensión, no el alias `@/`: es la convención de lib/forms y lo que
   permite cargar el módulo desde node --test, que no resuelve los paths de tsconfig. */
import { sentenceLength, voiceRulesText } from '../tokens.ts';
import {
  PRESETS,
  textTypeOption,
  type LengthId,
  type OutputLang,
  type RewriteRequest,
} from './options.ts';

/* Las escalas que ve la UI son etiquetas cortas ("medio", "cálido"). Al modelo le va mejor una
   descripción explícita, así que aquí van desarrolladas. */
const FORMALITY_PROMPT = [
  'muy cercano e informal',
  'cercano',
  'equilibrado',
  'formal',
  'muy formal',
] as const;

const WARMTH_PROMPT = [
  'neutro y sobrio',
  'moderadamente cálido',
  'cálido equilibrado',
  'cálido',
  'muy cálido',
] as const;

const LENGTH_PROMPT: Record<LengthId, string> = {
  corto:
    'LONGITUD: deja el texto notablemente más corto que el borrador. Quédate solo con lo esencial.',
  igual:
    'LONGITUD: mantén una longitud similar a la del borrador. Ajusta solo lo necesario para que fluya.',
  desarrollado:
    'LONGITUD: desarrolla algo más el texto. Añade contexto o transiciones donde ayuden a la claridad, sin relleno.',
};

const LANG_NAMES: Record<Exclude<OutputLang, 'auto'>, string> = {
  es: 'castellano',
  ca: 'catalán',
  en: 'inglés',
};

const NO_BRAND_VOICE =
  'No apliques la voz de marca de Interactius. Usa un tono profesional genérico, correcto y claro.';

/* El bloque de voz se escribe en el idioma de salida cuando está fijado: los tokens ya son
   trilingües, así que sale gratis y las reglas se leen en el mismo idioma que el texto. */
function voiceLocaleFor(lang: OutputLang): 'es' | 'en' | 'ca' {
  return lang === 'auto' ? 'es' : lang;
}

/* La regla de longitud sale de `allowFragments`, el mismo campo que decide si el eval penaliza
   las frases cortas (lib/rewriter/lengthPolicy.ts). Escribirla aquí a mano rompería esa unión y
   la herramienta acabaría pidiendo titulares para luego suspenderlos. */
function sentenceLengthLine(l: 'es' | 'en' | 'ca', allowFragments: boolean): string {
  const unit = l === 'en' ? 'words per sentence' : l === 'ca' ? 'paraules per frase' : 'palabras por frase';
  const full = `Frases de ${sentenceLength.min}–${sentenceLength.max} ${unit} de media; más cortas solo para enfatizar.`;
  if (!allowFragments) return full;
  return `En este formato se admiten fragmentos y frases por debajo de ${sentenceLength.min} palabras, pero ninguna frase pasa de ${sentenceLength.max} ${unit}.`;
}

function buildVoiceBlock(lang: OutputLang, allowFragments: boolean): string {
  const l = voiceLocaleFor(lang);

  return `VOZ INTERACTIUS (identidad verbal, obligatoria)
${voiceRulesText(l, { compact: true })}

LONGITUD DE FRASE EN ESTE FORMATO: ${sentenceLengthLine(l, allowFragments)}

Si el resultado podría haberlo escrito cualquier otra consultora, descártalo y reescribe desde un enfoque crítico y honesto.`;
}

export function buildRewriterPrompt(input: RewriteRequest): string {
  const preset = PRESETS.find((p) => p.id === input.preset) ?? PRESETS[0];
  const type = textTypeOption(input.textType);

  const langInstr =
    input.lang === 'auto'
      ? 'Detecta el idioma del borrador (castellano, catalán o inglés) y responde en ese mismo idioma.'
      : `Redacta el texto en ${LANG_NAMES[input.lang]}, sea cual sea el idioma del borrador.`;

  const context = input.context.trim();
  const contextBlock = context
    ? `\nCONTEXTO DEL TEXTO Y DEL DESTINATARIO (tenlo muy en cuenta para afinar tono y contenido, sin inventar datos que no estén en el borrador):\n${context}\n`
    : '';

  const voiceBlock = input.brandVoice
    ? buildVoiceBlock(input.lang, type.allowFragments)
    : NO_BRAND_VOICE;

  const subjectRule = type.hasSubject
    ? '- El asunto es breve y concreto. El cuerpo lleva saltos de línea reales donde correspondan.'
    : '- Este formato no lleva asunto: devuelve "subject" como cadena vacía. El cuerpo lleva saltos de línea reales donde correspondan.';

  return `Eres el editor de textos de Interactius, una consultora de experiencia y diseño. Reescribes el borrador que te da el usuario manteniendo su intención, pero ajustando voz, tono, formato y estructura.

FORMATO DE LA PIEZA
${type.hint}

AJUSTE DE TONO PARA ESTE TEXTO
- Perfil: "${preset.label}" — ${preset.hint}
- Formalidad: ${FORMALITY_PROMPT[input.formality - 1]}.
- Calidez: ${WARMTH_PROMPT[input.warmth - 1]}.

IDIOMA: ${langInstr}
${LENGTH_PROMPT[input.length]}
${contextBlock}
${voiceBlock}

INSTRUCCIONES DE SALIDA
- Mejora claridad, estructura y tono. No inventes datos, compromisos, cifras ni nombres que no estén en el borrador.
- Si el borrador deja algo ambiguo, mantenlo ambiguo. No lo resuelvas tú.
- Cierra con una acción o una pregunta clara cuando aplique, sin presión artificial.
${subjectRule}
- En "changes", entre dos y cuatro cambios, cada uno explicado en una frase.`;
}
