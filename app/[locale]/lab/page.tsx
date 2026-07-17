'use client';
import { useEffect, useMemo, useState } from 'react';
import { LAYOUT_CATALOG, layoutSnippet } from '@/lib/deck/catalog';
import { compileDeck } from '@/lib/deck';
import { DeckRenderer } from '@/components/deck/DeckRenderer';
import { LayoutGallery } from '@/components/deck/studio/LayoutGallery';
import { loadRealMix } from './real-content';

/* LOCAL SANDBOX — not part of the product, do not ship.
   Lives outside /deck so the Supabase middleware never runs, which keeps the layouts and the
   gallery workable. Renders every layout side by side, filled with the copy that shipped, so type
   decisions get made against real words. Delete before pushing to the team repo. */
export default function Lab() {
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [real, setReal] = useState(true);
  const [mix, setMix] = useState<{ md: string; sources: Record<string, string> } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadRealMix().then(setMix).catch((e) => setErr(e.message));
  }, []);

  const skeletons = useMemo(() => LAYOUT_CATALOG.map(layoutSnippet).join('\n'), []);
  const md = real && mix ? mix.md : skeletons;
  const deck = useMemo(() => compileDeck(md), [md]);

  /* Real logos live in Supabase Storage; read the picked file from disk so any can be tried. */
  const pickLogo = (file?: File) => setLogo(file ? URL.createObjectURL(file) : null);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }}>
      <header style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, borderBottom: '1px solid #E0DAD2', flexWrap: 'wrap' }}>
        <strong style={{ font: '600 13px/1 monospace' }}>LAB · {deck.slides.length}</strong>
        <label style={{ font: '500 11px/1.4 monospace', display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={real} onChange={(e) => setReal(e.target.checked)} disabled={!mix} />
          {real ? 'Contenido REAL (mediana de las 9)' : 'Plantillas'}
        </label>
        <label style={{ font: '400 11px/1.4 monospace', display: 'flex', gap: 6, alignItems: 'center' }}>
          Logo cliente:
          <input type="file" accept="image/svg+xml,image/png,image/*" onChange={(e) => pickLogo(e.target.files?.[0])} style={{ font: '400 11px monospace', width: 190 }} />
        </label>
        {logo && <button onClick={() => setLogo(null)} style={{ font: '400 11px monospace', cursor: 'pointer' }}>Quitar</button>}
        <button onClick={() => setOpen(true)} style={{ font: '500 12px/1 monospace', padding: '8px 12px', cursor: 'pointer' }}>Galería</button>
        {err && <span style={{ font: '400 11px monospace', color: '#99335F' }}>Supabase: {err}</span>}
        {!mix && !err && <span style={{ font: '400 11px monospace', color: '#75706B' }}>cargando decks reales…</span>}
        {mix && (
          /* Which layouts nobody has ever written: they render their skeleton, not real copy. */
          <span style={{ font: '400 11px/1.4 monospace', color: '#99335F' }}>
            sin uso real: {Object.entries(mix.sources).filter(([, s]) => s.startsWith('SIN USO')).map(([m]) => m).join(', ') || '—'}
          </span>
        )}
      </header>
      <div style={{ minHeight: 0 }}>
        <DeckRenderer deck={deck} clientLogo={logo} />
      </div>
      {open && <LayoutGallery onClose={() => setOpen(false)} />}
    </div>
  );
}
