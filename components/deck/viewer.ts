import { createContext } from 'react';
import type { DeckSignature } from '@/lib/decks/types';

/* True when the deck is rendered as a shared, client-facing presentation
   (no editor, no image editing, no site chrome). */
export const ViewerContext = createContext(false);

/* Enables client-facing signing on the Acceptance page. Present only on the saved-deck
   viewer route (it needs a persisted deck id). `initial` is the existing signature, if the
   deck was already signed — the page renders the immutable signed state instead of the pad. */
export type SignCtx = { deckId: string; initial: DeckSignature | null };
export const SignContext = createContext<SignCtx | null>(null);

/* Editor-only callback to open the image gallery for a given slide. Null in viewer mode
   and anywhere images aren't editable (thumbnails, shared view), which makes ImageSlot
   render as a plain, non-clickable image. */
export const ImageEditContext = createContext<((slideIndex: number) => void) | null>(null);

/* Public URL of the client's logo (deck meta, not markdown — uploaded in DeckMetaModal and
   defaulted per client). Null when the deck has none, and the cover falls back to the client
   name. Always rendered as an <img src>, never inlined: the file is third-party SVG. */
export const ClientLogoContext = createContext<string | null>(null);
