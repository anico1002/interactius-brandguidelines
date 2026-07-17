'use client';
import { useEffect, useMemo } from 'react';
import { compileDeck } from '@/lib/deck';
import type { DeckType } from '@/lib/deck';
import type { DeckSignature } from '@/lib/decks/types';
import { publicLogoUrl } from '@/lib/decks/api';
import { DeckRenderer } from '@/components/deck/DeckRenderer';

/* Read-only render surface: just the slides, no editor or site chrome.
   Shared link + print/render target. `?print=1` auto-fires the print dialog.
   `deckId` enables client signing on the Acceptance page; `signature` is the existing one. */
export function DeckViewerClient({
  deckId, md, type, logoPath = null, print, signature = null,
}: {
  deckId: string;
  md: string;
  type: DeckType;
  logoPath?: string | null;
  print?: boolean;
  signature?: DeckSignature | null;
}) {
  const deck = useMemo(() => compileDeck(md, type), [md, type]);
  const clientLogo = useMemo(() => publicLogoUrl(logoPath), [logoPath]);

  useEffect(() => {
    document.body.classList.add('ix-viewer');
    return () => document.body.classList.remove('ix-viewer');
  }, []);

  useEffect(() => {
    if (!print) return;
    // Wait for fonts + layout to settle so the PDF captures the real render.
    const fire = () => window.print();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const ready = fonts?.ready ?? Promise.resolve();
    let t: ReturnType<typeof setTimeout>;
    ready.then(() => { t = setTimeout(fire, 250); });
    return () => clearTimeout(t);
  }, [print]);

  return (
    <div style={{ height: '100vh' }}>
      <DeckRenderer deck={deck} viewer sign={{ deckId, initial: signature }} clientLogo={clientLogo} />
    </div>
  );
}
