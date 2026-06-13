'use client';
import { useEffect, useState } from 'react';
import { compileDeck } from '@/lib/deck';
import type { DeckType } from '@/lib/deck';
import { DeckRenderer } from './DeckRenderer';
import { ToneReport } from './ToneReport';

const SAMPLE = `# Propuesta de colaboración
Diagnóstico de criterios y arquitectura de decisión para el ecommerce de la marca.
> cliente: Naturgy
![Portada · universo visual](/universo/universo-02.jpg)

---

CONTEXTO
Naturgy tiene la oportunidad de establecer un nuevo estándar digital que unifique su experiencia online y aporte coherencia, escalabilidad y alineación con la marca. Hoy existen inconsistencias en experiencia, diseño y flujos que generan fricción y reducen eficiencia.

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
Diagnóstico: 1
Discovery: 2-3
Volumetría: 4-8
hitos cliente: 1, 3, 5, 8
\`\`\`

---

## Presupuesto

---

# Gracias
www.interactius.com
`;

const TYPES: { id: DeckType; label: string }[] = [
  { id: 'comercial', label: 'Comercial' },
  { id: 'informe', label: 'Informe' },
  { id: 'generica', label: 'Genérica' },
];

const btn: React.CSSProperties = {
  appearance: 'none', border: '1px solid #1C1A17', background: '#1C1A17', color: '#F5F2ED',
  font: '500 11px/1 var(--font-ibm-plex-mono, monospace)', letterSpacing: '.04em', padding: '10px 12px', cursor: 'pointer', flex: 1,
};
const btnGhost: React.CSSProperties = { ...btn, background: 'transparent', color: '#1C1A17' };
const seg: React.CSSProperties = {
  flex: 1, padding: '7px 6px', border: '1px solid #E0DAD2', background: 'transparent', color: '#75706B',
  font: '500 10px/1 var(--font-ibm-plex-mono, monospace)', letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
};
const segOn: React.CSSProperties = { background: '#1C1A17', color: '#F5F2ED', borderColor: '#1C1A17' };

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

export function DeckStudio() {
  const [md, setMd] = useState(SAMPLE);
  const [type, setType] = useState<DeckType>('comercial');
  const [deck, setDeck] = useState(() => compileDeck(SAMPLE, 'comercial'));
  const [copied, setCopied] = useState(false);
  const [viewer, setViewer] = useState(false);

  // Read a shared link from the URL hash: #view=1&md=... loads the deck and,
  // when "view" is present, renders only the presentation (client-facing).
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const mdParam = params.get('md');
    if (mdParam) {
      try {
        const decoded = b64decode(mdParam);
        setMd(decoded);
        setDeck(compileDeck(decoded, type));
      } catch { /* ignore malformed link */ }
    }
    if (params.has('view')) {
      setViewer(true);
      document.body.classList.add('ix-viewer');
    }
    return () => document.body.classList.remove('ix-viewer');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickType = (t: DeckType) => { setType(t); setDeck(compileDeck(md, t)); };

  const copyUrl = async () => {
    const url = `${window.location.origin}${window.location.pathname}#view=1&md=${b64encode(md)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
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
    <div style={{ display: 'flex', height: '100vh', background: '#F5F2ED' }}>
      <aside
        className="studio-controls"
        style={{ width: 420, flexShrink: 0, padding: 20, borderRight: '1px solid #E0DAD2', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}
      >
        <div style={{ font: '500 11px/1.4 var(--font-ibm-plex-mono, monospace)', letterSpacing: '.14em', textTransform: 'uppercase', color: '#75706B', flexShrink: 0 }}>
          Presentaciones · contenido
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {TYPES.map((t) => (
            <button key={t.id} onClick={() => pickType(t.id)} style={{ ...seg, ...(type === t.id ? segOn : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* The .md editor — the heart of the tool. Large and fixed; it never shrinks. */}
        <textarea
          value={md}
          onChange={(e) => setMd(e.target.value)}
          aria-label="Contenido markdown de la presentación"
          spellCheck={false}
          style={{ flex: 1, minHeight: 0, resize: 'none', padding: 12, border: '1px solid #E0DAD2', background: '#fff', font: '400 12px/1.55 var(--font-ibm-plex-mono, monospace)', color: '#1C1A17' }}
        />

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button style={btn} onClick={() => setDeck(compileDeck(md, type))}>Generar</button>
          <button style={btnGhost} onClick={() => window.print()}>Descargar PDF</button>
          <button style={btnGhost} onClick={copyUrl}>{copied ? 'Copiado ✓' : 'Copiar URL'}</button>
        </div>

        {/* Tone report in its own capped, scrollable panel so it can't shrink the editor. */}
        <div style={{ flexShrink: 0, maxHeight: 160, overflowY: 'auto', borderTop: '1px solid #E0DAD2', paddingTop: 4 }}>
          <ToneReport text={md} />
        </div>
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <DeckRenderer deck={deck} />
      </div>
    </div>
  );
}
