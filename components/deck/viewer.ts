import { createContext } from 'react';

/* True when the deck is rendered as a shared, client-facing presentation
   (no editor, no image editing, no site chrome). */
export const ViewerContext = createContext(false);
