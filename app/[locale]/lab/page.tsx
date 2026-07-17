'use client';
import { useMemo, useState } from 'react';
import { LAYOUT_CATALOG, layoutSnippet } from '@/lib/deck/catalog';
import { compileDeck } from '@/lib/deck';
import { DeckRenderer } from '@/components/deck/DeckRenderer';
import { LayoutGallery } from '@/components/deck/studio/LayoutGallery';

/* LOCAL SANDBOX — not part of the product, do not ship.
   Lives outside /deck so the Supabase middleware never runs, which makes the layout skeletons and
   the gallery testable without project credentials. Renders the deck you get by pasting all 18
   snippets, in catalog order. Delete once /deck runs locally. */
/* Stand-in for a client's uploaded logo: the real one lives in Supabase Storage, out of reach
   locally, and any transparent asset proves the cover slot the same way. */
const FAKE_CLIENT_LOGO = '/logo/isotipo-negativo.svg';

export default function Lab() {
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState(false);
  const md = useMemo(() => LAYOUT_CATALOG.map(layoutSnippet).join('\n'), []);
  const deck = useMemo(() => compileDeck(md), [md]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderBottom: '1px solid #E0DAD2' }}>
        <strong style={{ font: '600 13px/1 monospace' }}>LAB · {deck.slides.length} slides</strong>
        <button onClick={() => setOpen(true)} style={{ font: '500 12px/1 monospace', padding: '8px 12px', cursor: 'pointer' }}>
          Abrir galería de layouts
        </button>
        <label style={{ font: '400 11px/1.4 monospace', display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} />
          Logo de cliente en portada
        </label>
        <span style={{ font: '400 11px/1.4 monospace', color: '#75706B' }}>
          Clica un layout → se copia la plantilla. Pégala donde quieras para comprobarla.
        </span>
      </header>
      <div style={{ minHeight: 0 }}>
        <DeckRenderer deck={deck} clientLogo={logo ? FAKE_CLIENT_LOGO : null} />
      </div>
      {open && <LayoutGallery onClose={() => setOpen(false)} />}
    </div>
  );
}
