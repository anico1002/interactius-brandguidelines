/* Eval rubric — pure function that scores text against Interactius brand rules.
   Used by:
   - /api/eval endpoint (HTTP)
   - scripts/eval-content.ts (CI / manual self-validation)
   - Future agent loops that need to validate before returning copy. */

/* Relativo con extensión, no el alias `@/`: es la convención de lib/forms y lo que permite
   cargar el módulo desde node --test, que no resuelve los paths de tsconfig. */
import { sentenceLength } from './tokens.ts';

/* Desde el 2026-11-20 (documento «Identidad verbal») no hay vocabulario prohibido ni regla de
   puntos suspensivos: la lista roja se retiró. La exclamación sigue contando, pero el documento
   la marca como «aconsejable, no requerimiento estricto», así que resta puntos y no bloquea.
   Hoy ninguna regla es dura: `hardFail` existe por compatibilidad con quien lo lee (ReWrit_r,
   IMG_r, DeckMak_r, /api/eval) y vale siempre false. */
export type EvalViolation =
  | {
      rule: 'length:under_min' | 'length:over_max';
      sentence: number;
      count: number;
      limit: number;
      excerpt: string;
    }
  | {
      rule: 'punctuation:exclamation';
      index: number;
    };

export type EvalResult = {
  score: number;                  // 0-100
  violations: EvalViolation[];
  sentenceCount: number;
  wordCount: number;
  hardFail: boolean;              // true if any non-negotiable rule trips (none today)
};

/* Split into sentences using terminal punctuation. We accept ?! since the rules
   forbid ! in our copy but split anyway so a violating ! sentence is still
   measured for length. Spanish ¿¡ are stripped at boundaries. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!…])\s+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countWords(s: string): number {
  // Strip leading/trailing terminal punctuation, normalise whitespace.
  const cleaned = s.replace(/^[¿¡"'(]+|[.!?…)"']+$/gu, '').trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/u).filter(Boolean).length;
}

export function evalText(text: string): EvalResult {
  const violations: EvalViolation[] = [];
  const sentences = splitSentences(text);

  // 1. Sentence length.
  sentences.forEach((s, i) => {
    const count = countWords(s);
    if (count === 0) return;
    if (count < sentenceLength.min) {
      violations.push({
        rule: 'length:under_min',
        sentence: i + 1,
        count,
        limit: sentenceLength.min,
        excerpt: s.length > 80 ? s.slice(0, 77) + '…' : s,
      });
    } else if (count > sentenceLength.max) {
      violations.push({
        rule: 'length:over_max',
        sentence: i + 1,
        count,
        limit: sentenceLength.max,
        excerpt: s.length > 80 ? s.slice(0, 77) + '…' : s,
      });
    }
  });

  // 2. Punctuation — exclamation (¡ or !). Advisory: counts, never blocks.
  const exclRe = /[¡!]/gu;
  let m: RegExpExecArray | null;
  while ((m = exclRe.exec(text)) !== null) {
    violations.push({ rule: 'punctuation:exclamation', index: m.index });
  }

  // Word count for the whole text (sum of sentence words).
  const wordCount = sentences.reduce((sum, s) => sum + countWords(s), 0);

  return {
    score: scoreFor(violations),
    violations,
    sentenceCount: sentences.length,
    wordCount,
    hardFail: hardFailFor(violations),
  };
}

/* ─── La rúbrica, como funciones puras ───

   Extraídas para que quien filtre violaciones (la política por tipo de texto de ReWrit_r, el
   descarte de etiquetas cortas de /api/eval/manual) recalcule score y hardFail con ESTA regla y
   no con una copia. Antes /api/eval/manual repetía a mano el `100 - n*10` y la lista de reglas
   duras; dos copias de la misma rúbrica que podían separarse sin que nada avisara.

   `evalText` no cambia de firma ni de comportamiento: solo delega. */

export function isLengthViolation(v: EvalViolation): boolean {
  return v.rule === 'length:under_min' || v.rule === 'length:over_max';
}

/** Cada violación resta 10 puntos, con suelo en 0. */
export function scoreFor(violations: readonly EvalViolation[]): number {
  return Math.max(0, 100 - violations.length * 10);
}

/* Ninguna regla es dura desde el documento «Identidad verbal» (2026-11-20): la longitud y la
   exclamación son orientativas. Se mantiene la función para que, si un día vuelve una regla no
   negociable, haya un único sitio donde declararla. */
export function hardFailFor(_violations: readonly EvalViolation[]): boolean {
  return false;
}
