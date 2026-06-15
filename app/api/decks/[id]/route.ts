import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { DeckUpdateInput } from '@/lib/decks/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/decks/:id — full deck (md + metadata).
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const sb = supabaseServer();
  const { data, error } = await sb.from('decks').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

// PATCH /api/decks/:id — save md and/or metadata.
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  let body: DeckUpdateInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Only forward known, present fields.
  const allowed: (keyof DeckUpdateInput)[] = ['commercial_id', 'client_id', 'contact_emails', 'logo_path', 'budget_url', 'type', 'md'];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb.from('decks').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/decks/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const sb = supabaseServer();
  const { error } = await sb.from('decks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
