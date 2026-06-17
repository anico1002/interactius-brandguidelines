'use client';
import { useEffect, useMemo } from 'react';
import { compileDeck } from '@/lib/deck';
import type { DeckType } from '@/lib/deck';
import { DeckRenderer } from '@/components/deck/DeckRenderer';

/* Read-only render surface: just the slides, no editor or site chrome.
   Shared link + print/render target. `?print=1` auto-fires the print dialog. */
export function DeckViewerClient({ md, type, print }: { md: string; type: DeckType; print?: boolean }) {
  const deck = useMemo(() => compileDeck(md, type), [md, type]);

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
      <DeckRenderer deck={deck} viewer />
    </div>
  );
}
