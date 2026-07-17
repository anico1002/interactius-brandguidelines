'use client';
import { useState } from 'react';
import { btn, colors, toolbarBtn } from './ui';

const MONO = 'var(--font-ibm-plex-mono, monospace)';

/* Top toolbar: ← Galería · <título editable> · Guardar · Revisar Tono · Descargar PDF · Compartir URL.
   (Crear/Abrir viven ahora en la galería; sus handlers siguen disponibles en DeckStudio.) */
export function DeckToolbar({
  title,
  dirty,
  saving,
  onHome,
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
  onHome: () => void;
  onEditTitle: () => void;
  onSave: () => void;
  onToggleTone: () => void;
  toneOn: boolean;
  onDownloadPdf: () => void;
  onCopyUrl: () => void;
  copied: boolean;
}) {
  const [titleHover, setTitleHover] = useState(false);
  const showTip = titleHover && !!title;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
        borderBottom: `1px solid ${colors.warmDark}`, background: colors.warmLight, flexShrink: 0,
      }}
    >
      <button style={toolbarBtn} onClick={onHome} title="Volver a la galería" aria-label="Volver a la galería">← Galería</button>

      {/* Editable title (commercial_id). Hover shows a box + "Editar" tooltip; click edits metadata. */}
      <span
        style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}
        onMouseEnter={() => setTitleHover(true)}
        onMouseLeave={() => setTitleHover(false)}
      >
        <button
          onClick={onEditTitle}
          disabled={!title}
          aria-label={title ? 'Editar presentación' : undefined}
          style={{
            maxWidth: '100%', textAlign: 'left', appearance: 'none',
            border: `1px solid ${showTip ? colors.warmDark : 'transparent'}`,
            background: showTip ? colors.white : 'transparent',
            cursor: title ? 'pointer' : 'default', padding: '7px 10px',
            font: `500 15px/1 ${MONO}`, letterSpacing: '.02em', color: title ? colors.dark : colors.ash,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'background .15s, border-color .15s',
          }}
        >
          {title ?? 'Sin guardar'}{dirty && title ? ' •' : ''}
        </button>
        {showTip && (
          <span
            role="tooltip"
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              background: colors.dark, color: colors.warmLight,
              font: `500 10px/1 ${MONO}`, letterSpacing: '.04em', padding: '5px 7px',
              whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none',
            }}
          >
            Editar
          </span>
        )}
      </span>

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
