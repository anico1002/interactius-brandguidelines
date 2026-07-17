'use client';
import { useState } from 'react';
import { LAYOUT_CATALOG, layoutSnippet, type LayoutCatalogEntry } from '@/lib/deck/catalog';
import { Modal } from './Modal';
import { LayoutThumb } from './LayoutThumb';
import { btn, colors } from './ui';

const MONO = 'var(--font-ibm-plex-mono, monospace)';

/* Catalog of available layouts. Click a row to copy a ready-to-paste block: the `[ly: marcador]`
   plus dummy content shaped like the layout, so a last-minute slide lands filled in. */
export function LayoutGallery({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (entry: LayoutCatalogEntry) => {
    const marker = entry.marker;
    const text = layoutSnippet(entry);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers/contexts where the async clipboard API is unavailable.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      } catch {
        /* give up silently */
      }
    }
    setCopied(marker);
    setTimeout(() => setCopied((c) => (c === marker ? null : c)), 1400);
  };

  return (
    <Modal title="Galería de layouts" onClose={onClose} width={760}>
      <div style={{ maxHeight: '62vh', overflowY: 'auto', border: `1px solid ${colors.warmDark}` }}>
        {LAYOUT_CATALOG.map((e) => {
          const isCopied = copied === e.marker;
          return (
            <button
              key={e.marker}
              onClick={() => copy(e)}
              title="Copiar plantilla al portapapeles"
              style={{
                display: 'grid', gridTemplateColumns: '124px 122px 104px 1fr', gap: 14, alignItems: 'center', width: '100%',
                textAlign: 'left', appearance: 'none', border: 'none', borderBottom: `1px solid ${colors.warmDark}`,
                background: 'transparent', cursor: 'pointer', padding: '12px 14px',
              }}
            >
              <LayoutThumb marker={e.marker} width={120} />
              <div style={{ font: `600 12px/1.3 ${MONO}`, color: isCopied ? '#99335F' : colors.dark }}>
                {isCopied ? 'Copiado ✓' : `[ly: ${e.marker}]`}
              </div>
              <div style={{ font: `500 11px/1.3 ${MONO}`, color: colors.dark }}>{e.name}</div>
              <div style={{ font: `400 11px/1.5 ${MONO}`, color: colors.ash }}>{e.slots}</div>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button style={btn} onClick={onClose}>Aceptar</button>
      </div>
    </Modal>
  );
}
