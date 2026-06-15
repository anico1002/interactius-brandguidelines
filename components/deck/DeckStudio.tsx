'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { compileDeck } from '@/lib/deck';
import type { DeckType } from '@/lib/deck';
import type { ClientRecord, DeckListItem, DeckMeta, DeckRecord } from '@/lib/decks/types';
import { createDeck, getDeck, listClients, updateDeck } from '@/lib/decks/api';
import { DeckRenderer } from './DeckRenderer';
import { ToneReport } from './ToneReport';
import { DeckToolbar } from './studio/DeckToolbar';
import { DeckMetaModal, type MetaValues } from './studio/DeckMetaModal';
import { ConfirmModal } from './studio/ConfirmModal';

const SAMPLE = `# Propuesta de colaboración
Diagnóstico de criterios y arquitectura de decisión para el ecommerce de la marca.
> cliente: Naturgy
![Portada · universo visual](/universo/universo-02.jpg)

---

CONTEXTO
Naturgy tiene la oportunidad de establecer un **nuevo estándar digital** que unifique su experiencia online y aporte coherencia, escalabilidad y alineación con la marca. Hoy existen inconsistencias en experiencia, diseño y flujos que generan fricción y reducen eficiencia.

---

EL RETO
# Incrementar la conversión en el ecommerce principal de la marca
![El reto](/universo/universo-01.jpg)

---

## Objetivos
- Establecer una línea base cuantificada del nivel de calidad actual por país, tipología de pedido y modalidad de recogida.
- Identificar qué dimensiones, mercados o tipologías presentan mayor frecuencia y severidad de incidencias.
- Comparar el rendimiento entre países para detectar diferencias operativas significativas.
- Sentar las bases metodológicas y operativas para la Fase 2, en la que los evaluadores serán usuarios reales de la marca.
![Objetivos](/universo/universo-03.jpg)

---

## Roadmap
Estimamos que la duración del proyecto será de 6 semanas.
### Diagnóstico
La fase de inmersión nos permite comprender el contexto actual y las expectativas del proyecto.
- Kick Off: alineación de objetivos y definición del marco.
- Inmersión inicial: revisión de fuentes internas y externas.
### Discovery
Investigación exhaustiva que combina la inmersión con la experiencia del usuario.
- Mapa de tendencias y competencia.
- Entrevistas en profundidad.
### Ideación
Fase de síntesis donde los insights se transforman en valor estratégico.
- Workshop Business Model Canvas.
- Workshop de Ideación.
### Activación
Definición de la estrategia de marca y la hoja de ruta práctica.
- Análisis de áreas de oportunidad.
- Roadmap de acciones estratégicas.

---

## Roadmap
\`\`\`gantt
semanas: 8
Diagnóstico: 1-1.5
Discovery: 2-3
Volumetría: 4-8
hitos cliente: 1, 3, 5, 8
\`\`\`

---

## Presupuesto
- Análisis Heurístico: 3.315 €
- Benchmark Android/Mobile: 3.770 €
- Inmersión + gestión: 3.991 €
### Condiciones
- Emisión de factura inicial por el 60% del total del proyecto una vez recibida la orden de compra al inicio del proyecto.
- Emisión de factura final por el 40% del total del proyecto una vez realizada la entrega.
- Al importe se le añadirá el IVA correspondiente de acuerdo con la legislación vigente.
- Cobro de facturas a 30 días, día de pago habitual del cliente.
- Esta propuesta económica tiene una validez de tres meses a partir de la fecha de la misma.

---

# Gracias
www.interactius.com
`;

const btn: React.CSSProperties = {
  appearance: 'none', border: '1px solid #1C1A17', background: '#1C1A17', color: '#F5F2ED',
  font: '500 11px/1 var(--font-ibm-plex-mono, monospace)', letterSpacing: '.04em', padding: '10px 12px', cursor: 'pointer', flex: 1,
};

// UTF-8 safe, URL-safe base64 (base64url) for sharing the .md inside the URL hash.
function b64encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64decode(s: string): string {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

const EMPTY_META: DeckMeta = {
  commercial_id: '', client_id: null, contact_emails: [], logo_path: null, budget_url: null, type: 'comercial',
};
const snap = (md: string, meta: DeckMeta) => JSON.stringify({ md, meta });

// Resizable editor panel — drag the divider to widen it, up to half the viewport.
const ASIDE_MIN = 320;
const ASIDE_DEFAULT = 420;
const ASIDE_STORAGE_KEY = 'deck.asideW';
const maxAside = () => (typeof window === 'undefined' ? Infinity : window.innerWidth * 0.5);

type ModalState =
  | { kind: 'new' | 'duplicate'; initial?: Partial<MetaValues> & { client_name?: string | null }; seedMd: string }
  | { kind: 'edit'; initial: Partial<MetaValues> & { client_name?: string | null } }
  | null;

export function DeckStudio() {
  const [md, setMd] = useState(SAMPLE);
  const [meta, setMeta] = useState<DeckMeta>(EMPTY_META);
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [deck, setDeck] = useState(() => compileDeck(SAMPLE, 'comercial'));
  const [savedSnap, setSavedSnap] = useState(() => snap(SAMPLE, EMPTY_META));
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [guard, setGuard] = useState<{ run: () => void; targetName?: string } | null>(null);
  const [toneOn, setToneOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [asideW, setAsideW] = useState(ASIDE_DEFAULT);
  const rowRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const dirty = useMemo(() => snap(md, meta) !== savedSnap, [md, meta, savedSnap]);

  // Restore the saved editor width, then keep it within [min, 50% of viewport].
  useEffect(() => {
    const saved = Number(localStorage.getItem(ASIDE_STORAGE_KEY));
    if (saved) setAsideW(Math.max(ASIDE_MIN, Math.min(saved, maxAside())));
    const onResize = () => setAsideW((w) => Math.max(ASIDE_MIN, Math.min(w, maxAside())));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Drag-to-resize the editor panel.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const left = rowRef.current?.getBoundingClientRect().left ?? 0;
      setAsideW(Math.max(ASIDE_MIN, Math.min(e.clientX - left, maxAside())));
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(ASIDE_STORAGE_KEY, String(Math.round(asideW)));
  }, [asideW]);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  // Shared link from URL hash: #view=1&md=... loads + renders only the presentation.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const mdParam = params.get('md');
    if (mdParam) {
      try {
        const decoded = b64decode(mdParam);
        setMd(decoded);
        setDeck(compileDeck(decoded, meta.type));
      } catch { /* ignore malformed link */ }
    }
    if (params.has('view')) {
      setViewer(true);
      document.body.classList.add('ix-viewer');
    } else {
      listClients().then(setClients).catch(() => {});
    }
    return () => document.body.classList.remove('ix-viewer');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientNameFor = (id: string | null) => clients.find((c) => c.id === id)?.name ?? null;

  const loadRecord = (rec: DeckRecord) => {
    const m: DeckMeta = {
      commercial_id: rec.commercial_id, client_id: rec.client_id, contact_emails: rec.contact_emails,
      logo_path: rec.logo_path, budget_url: rec.budget_url, type: rec.type,
    };
    setCurrentDeckId(rec.id);
    setMeta(m);
    setMd(rec.md);
    setDeck(compileDeck(rec.md, rec.type));
    setSavedSnap(snap(rec.md, m));
  };

  const withGuard = (run: () => void, targetName?: string) => {
    if (dirty) setGuard({ run, targetName });
    else run();
  };

  // Toolbar actions
  const onNew = () => withGuard(() => setModal({ kind: 'new', initial: { type: 'comercial' }, seedMd: SAMPLE }));

  const onSave = async () => {
    if (!currentDeckId) {
      // Save-as: capture metadata first, keep current md.
      setModal({ kind: 'new', initial: { type: meta.type }, seedMd: md });
      return;
    }
    setSaving(true);
    try {
      await updateDeck(currentDeckId, { ...meta, md });
      setSavedSnap(snap(md, meta));
    } catch (e) {
      // surface minimally; keep editor state
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onOpenDeck = (item: DeckListItem) =>
    withGuard(async () => {
      try {
        loadRecord(await getDeck(item.id));
      } catch (e) {
        console.error(e);
      }
    }, item.commercial_id);

  const onDuplicateDeck = async (item: DeckListItem) => {
    try {
      const full = await getDeck(item.id);
      setModal({
        kind: 'duplicate',
        seedMd: full.md,
        initial: {
          commercial_id: `${full.commercial_id} Copy`,
          client_id: full.client_id,
          client_name: clientNameFor(full.client_id),
          contact_emails: full.contact_emails,
          logo_path: full.logo_path,
          budget_url: full.budget_url,
          type: full.type,
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onEditTitle = () => {
    if (!currentDeckId) return;
    setModal({
      kind: 'edit',
      initial: { ...meta, client_name: clientNameFor(meta.client_id) },
    });
  };

  const onCopyUrl = async () => {
    const url = `${window.location.origin}${window.location.pathname}#view=1&md=${b64encode(md)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };

  const onSubmitMeta = async (values: MetaValues) => {
    if (!modal) return;
    if (modal.kind === 'edit') {
      if (!currentDeckId) return;
      await updateDeck(currentDeckId, { ...values });
      const m: DeckMeta = { ...values };
      setMeta(m);
      setDeck(compileDeck(md, m.type));
      setSavedSnap(snap(md, m));
    } else {
      const rec = await createDeck({ ...values, md: modal.seedMd });
      loadRecord(rec);
    }
    setModal(null);
    listClients().then(setClients).catch(() => {});
  };

  // Client-facing presentation: only the deck, nothing internal.
  if (viewer) {
    return (
      <div style={{ height: '100vh' }}>
        <DeckRenderer deck={deck} viewer />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F2ED' }}>
      <DeckToolbar
        title={meta.commercial_id || null}
        dirty={dirty}
        saving={saving}
        onNew={onNew}
        onOpenDeck={onOpenDeck}
        onDuplicateDeck={onDuplicateDeck}
        onEditTitle={onEditTitle}
        onSave={onSave}
        onToggleTone={() => setToneOn((v) => !v)}
        toneOn={toneOn}
        onDownloadPdf={() => window.print()}
        onCopyUrl={onCopyUrl}
        copied={copied}
      />

      <div ref={rowRef} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside
          className="studio-controls"
          style={{ width: asideW, flexShrink: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}
        >
          <div style={{ font: '500 11px/1.4 var(--font-ibm-plex-mono, monospace)', letterSpacing: '.14em', textTransform: 'uppercase', color: '#75706B', flexShrink: 0 }}>
            Presentaciones · contenido
          </div>

          <textarea
            value={md}
            onChange={(e) => setMd(e.target.value)}
            aria-label="Contenido markdown de la presentación"
            spellCheck={false}
            style={{ flex: 1, minHeight: 0, resize: 'none', padding: 12, border: '1px solid #E0DAD2', background: '#fff', font: '400 12px/1.55 var(--font-ibm-plex-mono, monospace)', color: '#1C1A17' }}
          />

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button style={btn} onClick={() => setDeck(compileDeck(md, meta.type))}>Generar</button>
          </div>

          {toneOn && (
            <div style={{ flexShrink: 0, maxHeight: 160, overflowY: 'auto', borderTop: '1px solid #E0DAD2', paddingTop: 4 }}>
              <ToneReport text={md} />
            </div>
          )}
        </aside>

        {/* Drag handle: resize the editor up to 50% of the viewport. */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Ajustar ancho del editor"
          onPointerDown={startResize}
          style={{ width: 7, flexShrink: 0, cursor: 'col-resize', borderRight: '1px solid #E0DAD2', background: 'transparent', touchAction: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#E0DAD2')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <DeckRenderer deck={deck} />
        </div>
      </div>

      {modal && (
        <DeckMetaModal
          mode={modal.kind}
          clients={clients}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSubmit={onSubmitMeta}
        />
      )}

      {guard && (
        <ConfirmModal
          title="Abrir presentación"
          message={`${guard.targetName ? guard.targetName + ' · ' : ''}No has guardado cambios. ¿Quieres continuar?`}
          confirmLabel="Aceptar"
          onConfirm={() => { const run = guard.run; setGuard(null); run(); }}
          onClose={() => setGuard(null)}
        />
      )}
    </div>
  );
}
