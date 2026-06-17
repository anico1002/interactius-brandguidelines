import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import type { DeckRecord } from '@/lib/decks/types';
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

  const deck = data as Pick<DeckRecord, 'md' | 'type'>;
  return <DeckViewerClient md={deck.md} type={deck.type} print={print === '1'} />;
}
