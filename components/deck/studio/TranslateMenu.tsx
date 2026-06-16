'use client';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { IconButton } from './IconButton';
import { colors, menuPanel } from './ui';

const MONO = 'var(--font-ibm-plex-mono, monospace)';
const LANGS = [
  { id: 'en', label: 'Inglés' },
  { id: 'ca', label: 'Català' },
  { id: 'es', label: 'Castellano' },
] as const;

function TranslateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M1.8 8h12.4" />
      <path d="M8 1.8c3 2.5 3 9.9 0 12.4M8 1.8c-3 2.5-3 9.9 0 12.4" />
    </svg>
  );
}

const menuItem: CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', appearance: 'none', border: 'none',
  borderBottom: `1px solid ${colors.warmDark}`, background: 'transparent', cursor: 'pointer',
  font: `500 11px/1 ${MONO}`, color: colors.dark, padding: '11px 12px',
};

/* Iconographic "Traducir" button with a language dropdown. */
export function TranslateMenu({ onPick }: { onPick: (target: 'es' | 'ca' | 'en') => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <IconButton label="Traducir" active={open} onClick={() => setOpen((v) => !v)}>
        <TranslateIcon />
      </IconButton>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onMouseDown={() => setOpen(false)} />
          <div style={{ ...menuPanel, width: 150, left: 0 }}>
            {LANGS.map((l) => (
              <button key={l.id} style={menuItem} onClick={() => { setOpen(false); onPick(l.id); }}>
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
