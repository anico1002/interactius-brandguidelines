import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { DeckCreateInput } from '@/lib/decks/types';

export const dynamic = 'force-dynamic';

// GET /api/decks — history list, newest first.
export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('decks')
    .select('id, commercial_id, client_id, created_at, updated_at, clients(name)')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = (data ?? []).map((d: Record<string, unknown>) => ({
    id: d.id,
    commercial_id: d.commercial_id,
    client_id: d.client_id,
    client_name: (d.clients as { name?: string } | null)?.name ?? null,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
  return NextResponse.json(list, { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/decks — create a new deck.
export async function POST(req: Request) {
  let body: DeckCreateInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body?.commercial_id?.trim()) {
    return NextResponse.json({ error: 'commercial_id is required' }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from('decks')
    .insert({
      commercial_id: body.commercial_id.trim(),
      client_id: body.client_id ?? null,
      contact_emails: body.contact_emails ?? [],
      logo_path: body.logo_path ?? null,
      budget_url: body.budget_url ?? null,
      type: body.type ?? 'comercial',
      md: body.md ?? '',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
