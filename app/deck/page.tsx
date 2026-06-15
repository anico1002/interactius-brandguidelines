import type { Metadata } from 'next';
import { DeckStudio } from '@/components/deck/DeckStudio';

export const metadata: Metadata = {
  title: 'Deck Maker · Interactius',
  robots: { index: false, follow: false },
};

// Standalone Deck Maker — outside the brand-guide chrome, only the root layout (fonts) applies.
export default function DeckPage() {
  return <DeckStudio />;
}
