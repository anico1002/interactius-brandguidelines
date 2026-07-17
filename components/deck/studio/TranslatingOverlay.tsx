'use client';
import { overlay, card, cardTitle, btn, colors } from './ui';

const MONO = 'var(--font-ibm-plex-mono, monospace)';

function Spinner() {
  return (
    <svg width="30" height="30" viewBox="0 0 50 50" aria-hidden>
      <circle cx="25" cy="25" r="20" fill="none" stroke={colors.warmDark} strokeWidth="5" />
      <path d="M25 5a20 20 0 0 1 20 20" fill="none" stroke={colors.dark} strokeWidth="5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/* Blocking overlay shown while the deck is being translated; doubles as the error surface. */
export function TranslatingOverlay({ error, onClose }: { error?: string | null; onClose: () => void }) {
  return (
    <div style={{ ...overlay, zIndex: 100 }}>
      <div style={{ ...card, width: 'min(420px, 100%)', textAlign: 'center' }}>
        {error ? (
          <>
            <div style={cardTitle}>Traducción</div>
            <div style={{ font: `400 13px/1.55 ${MONO}`, color: '#99335F', marginBottom: 22 }}>{error}</div>
            <button style={btn} onClick={onClose}>Cerrar</button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
            <div style={{ font: `500 12px/1.4 ${MONO}`, letterSpacing: '.1em', textTransform: 'uppercase', color: colors.dark, marginTop: 16 }}>
              Traduciendo…
            </div>
            <div style={{ font: `400 11px/1.5 ${MONO}`, color: colors.ash, marginTop: 8, textAlign: 'center' }}>
              No cierres la ventana mientras se traduce el contenido.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
