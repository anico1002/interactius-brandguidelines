'use client';
import { useMemo, useState } from 'react';
import { LAYOUT_CATALOG, layoutSnippet } from '@/lib/deck/catalog';
import { compileDeck } from '@/lib/deck';
import { DeckRenderer } from '@/components/deck/DeckRenderer';
import { LayoutGallery } from '@/components/deck/studio/LayoutGallery';
import { REAL_MD } from './real-content';

/* LOCAL SANDBOX — not part of the product, do not ship.
   Lives outside /deck so the Supabase middleware never runs, which makes the layout skeletons and
   the gallery testable without project credentials. Renders the deck you get by pasting all 18
   snippets, in catalog order. Delete once /deck runs locally. */
export default function Lab() {
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  /* Real copy by default: dummy text looks fine at any size, so it can't settle a type decision. */
  const [real, setReal] = useState(true);
  const md = useMemo(() => (real ? REAL_MD : LAYOUT_CATALOG.map(layoutSnippet).join('\n')), [real]);
  const deck = useMemo(() => compileDeck(md), [md]);

  /* Real client logos live in Supabase Storage, out of reach locally: read the picked file
     straight from disk so any logo can be tried on the cover without uploading anything. */
  const pickLogo = (file?: File) => setLogo(file ? URL.createObjectURL(file) : null);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderBottom: '1px solid #E0DAD2' }}>
        <strong style={{ font: '600 13px/1 monospace' }}>LAB · {deck.slides.length} slides</strong>
        <label style={{ font: '500 11px/1.4 monospace', display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={real} onChange={(e) => setReal(e.target.checked)} />
          {real ? 'Contenido REAL (TMB · QualitaHub · Naturgy)' : 'Contenido de plantilla'}
        </label>
        <button onClick={() => setOpen(true)} style={{ font: '500 12px/1 monospace', padding: '8px 12px', cursor: 'pointer' }}>
          Galería
        </button>
        <label style={{ font: '400 11px/1.4 monospace', display: 'flex', gap: 6, alignItems: 'center' }}>
          Logo de cliente:
          <input type="file" accept="image/svg+xml,image/png,image/*" onChange={(e) => pickLogo(e.target.files?.[0])} style={{ font: '400 11px monospace' }} />
        </label>
        {logo && (
          <button onClick={() => setLogo(null)} style={{ font: '400 11px monospace', cursor: 'pointer' }}>Quitar</button>
        )}
        <span style={{ font: '400 11px/1.4 monospace', color: '#75706B' }}>
          Clica un layout → se copia la plantilla.
        </span>
      </header>
      <div style={{ minHeight: 0 }}>
        <DeckRenderer deck={deck} clientLogo={logo} />
      </div>
      {open && <LayoutGallery onClose={() => setOpen(false)} />}
    </div>
  );
}
