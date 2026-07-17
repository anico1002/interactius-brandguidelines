import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import type { DeckRecord, DeckSignature } from '@/lib/decks/types';
import { DeckViewerClient } from './DeckViewerClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Presentación · Interactius',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
};

/* Read-only viewer for a saved deck: the shared link and the print/render surface.
   Reads the deck by id from Supabase; the client compiles + renders the slides only. */
export default async function DeckViewPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { print } = await searchParams;

  const sb = supabaseServer();
  const { data, error } = await sb.from('decks').select('md, type').eq('id', id).single();
  if (error || !data) notFound();

  // If the deck was already signed, render the immutable signed state on the Acceptance page.
  const { data: sig } = await sb
    .from('signatures').select('*').eq('deck_id', id)
    .order('signed_at', { ascending: false }).limit(1).maybeSingle();

  const deck = data as Pick<DeckRecord, 'md' | 'type'>;
  return (
    <DeckViewerClient
      deckId={id}
      md={deck.md}
      type={deck.type}
      print={print === '1'}
      signature={(sig as DeckSignature | null) ?? null}
    />
  );
}
