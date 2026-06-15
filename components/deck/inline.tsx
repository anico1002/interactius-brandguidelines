import { Fragment } from 'react';

/* Inline markdown for deck text: **negrita** → <strong>.
   Deterministic and injection-safe (we only emit <strong>, never raw HTML).
   Returns the plain string untouched when there's nothing to format. */
export function inline(text: string): React.ReactNode {
  if (!text || !text.includes('**')) return text;
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i}>{part}</strong>
      : <Fragment key={i}>{part}</Fragment>
  );
}
