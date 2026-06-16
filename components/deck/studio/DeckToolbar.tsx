'use client';
import { useState } from 'react';
import type { DeckListItem } from '@/lib/decks/types';
import { OpenMenu } from './OpenMenu';
import { btn, colors, toolbarBtn } from './ui';

const MONO = 'var(--font-ibm-plex-mono, monospace)';

/* Top toolbar: Nueva · Abrir ▾ · <título editable> · Guardar · Revisar Tono · Descargar PDF · Compartir URL */
export function DeckToolbar({
  title,
  dirty,
  saving,
  onNew,
  onOpenDeck,
  onDuplicateDeck,
  onEditTitle,
  onSave,
  onToggleTone,
  toneOn,
  onDownloadPdf,
  onCopyUrl,
  copied,
}: {
  title: string | null;
  dirty: boolean;
  saving: boolean;
  onNew: () => void;
  onOpenDeck: (item: DeckListItem) => void;
  onDuplicateDeck: (item: DeckListItem) => void;
  onEditTitle: () => void;
  onSave: () => void;
  onToggleTone: () => void;
  toneOn: boolean;
  onDownloadPdf: () => void;
  onCopyUrl: () => void;
  copied: boolean;
}) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
        borderBottom: `1px solid ${colors.warmDark}`, background: colors.warmLight, flexShrink: 0,
      }}
    >
      <button style={btn} onClick={onNew}>Nueva</button>

      <div style={{ position: 'relative' }}>
        <button style={toolbarBtn} onClick={() => setOpenMenu((v) => !v)} aria-expanded={openMenu}>Abrir ▾</button>
        {openMenu && (
          <OpenMenu
            onOpen={(it) => { setOpenMenu(false); onOpenDeck(it); }}
            onDuplicate={(it) => { setOpenMenu(false); onDuplicateDeck(it); }}
            onClose={() => setOpenMenu(false)}
          />
        )}
      </div>

      {/* Editable title (commercial_id). Click to edit metadata. */}
      <button
        onClick={onEditTitle}
        disabled={!title}
        title={title ? 'Editar presentación' : undefined}
        style={{
          flex: 1, minWidth: 0, textAlign: 'left', appearance: 'none', border: 'none', background: 'transparent',
          cursor: title ? 'pointer' : 'default', padding: '0 8px',
          font: `500 15px/1.2 ${MONO}`, letterSpacing: '.02em', color: title ? colors.dark : colors.ash,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {title ?? 'Sin guardar'}{dirty && title ? ' •' : ''}
      </button>

      <button style={{ ...btn, opacity: saving ? 0.6 : 1 }} onClick={onSave} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>

      <button style={{ ...toolbarBtn, ...(toneOn ? { background: colors.dark, color: colors.warmLight, borderColor: colors.dark } : {}) }} onClick={onToggleTone}>
        Revisar Tono
      </button>

      <button style={toolbarBtn} onClick={onDownloadPdf}>Descargar PDF</button>

      <button style={toolbarBtn} onClick={onCopyUrl}>{copied ? 'Copiado ✓' : 'Compartir URL'}</button>
    </div>
  );
}
