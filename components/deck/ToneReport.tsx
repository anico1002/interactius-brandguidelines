'use client';
import { evalText } from '@/lib/eval';

/* Deterministic tone check — reuses the existing eval engine. No AI. */
export function ToneReport({ text }: { text: string }) {
  const r = evalText(text);
  const messages = r.violations.map((v) => {
    if (v.rule === 'length:over_max') return `Frase ${v.sentence}: ${v.count} palabras (máx ${v.limit}). Pártela.`;
    if (v.rule === 'length:under_min') return `Frase ${v.sentence}: ${v.count} palabras (mín ${v.limit}).`;
    return 'Signo de exclamación: mejor evitarlo, la energía viene del contenido.';
  });

  return (
    <div style={{ marginTop: 16, fontFamily: 'var(--font-ibm-plex-mono, monospace)', fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: r.hardFail ? '#99335F' : '#46433F' }}>
        <span>Tono</span>
        <span>{r.score}/100{r.hardFail ? ' · revisar' : ' · ok'}</span>
      </div>
      {messages.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m, i) => (
            <li key={i} style={{ color: '#75706B', lineHeight: 1.5 }}>◆ {m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
