'use client';

/* The Deck Maker (DeckStudio) seeded with a "presentation" that contains one page per catalog
   layout — so every layout can be reviewed and retouched at the exact size it has while editing a
   real deck. Standalone (no deckId) means it runs locally and never writes to Supabase unless you
   explicitly save. Gated to dev-only by the server page (page.tsx) — see there for why. */

import { DeckStudio } from '@/components/deck/DeckStudio';
import { LAYOUT_CATALOG, layoutSnippet } from '@/lib/deck/catalog';

// A deck made of every layout, in catalog order.
const LAB_MD = LAYOUT_CATALOG.map(layoutSnippet).join('\n');

export function LabClient() {
  // Escape the localized site chrome (sidebar + main padding) so the editor is full-screen, exactly
  // like /deck.
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <DeckStudio initialMd={LAB_MD} />
    </div>
  );
}
