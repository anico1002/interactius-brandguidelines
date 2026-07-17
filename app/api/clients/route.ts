import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { ClientCreateInput } from '@/lib/decks/types';

export const dynamic = 'force-dynamic';

// GET /api/clients — list for the "Cliente" dropdown.
export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .order('name', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/clients — quick-add a client (used when the editor types a new one).
export async function POST(req: Request) {
  let body: ClientCreateInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from('clients')
    .insert({
      name: body.name.trim(),
      default_logo_path: body.default_logo_path ?? null,
      default_emails: body.default_emails ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
