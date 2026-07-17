import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type SignBody = { deck_id?: string; signer_name?: string; signer_email?: string; signature_png?: string };

// POST /api/sign — a client signs the Acceptance page of a saved deck.
export async function POST(req: Request) {
  let body: SignBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const deck_id = body.deck_id?.trim();
  const signer_name = body.signer_name?.trim();
  const signer_email = body.signer_email?.trim();
  const signature_png = body.signature_png;
  if (!deck_id || !signer_name || !signer_email || !signature_png?.startsWith('data:image/')) {
    return NextResponse.json({ error: 'deck_id, signer_name, signer_email and signature_png are required' }, { status: 400 });
  }
  // The signature is a small PNG data URL; reject oversized payloads (open endpoint).
  if (signature_png.length > 2_000_000) {
    return NextResponse.json({ error: 'signature_png too large' }, { status: 413 });
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;
  const user_agent = req.headers.get('user-agent');

  const sb = supabaseServer();
  // Confirm the deck exists (also gives us context for the notification email).
  const { data: deck, error: deckErr } = await sb
    .from('decks').select('id, commercial_id, contact_emails').eq('id', deck_id).single();
  if (deckErr || !deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });

  const { data, error } = await sb
    .from('signatures')
    .insert({ deck_id, signer_name, signer_email, signature_png, ip, user_agent })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort notification to Interactius; never blocks or fails the signature.
  await notify({ deckTitle: deck.commercial_id as string, signer_name, signer_email, signature_png, signed_at: data.signed_at }).catch(() => {});

  return NextResponse.json(data, { status: 201 });
}

async function notify(p: { deckTitle: string; signer_name: string; signer_email: string; signature_png: string; signed_at: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INTERACTIUS_NOTIFY_EMAIL;
  if (!key || !to) return; // not configured yet — signature is still persisted
  const from = process.env.RESEND_FROM ?? 'Interactius <onboarding@resend.dev>';
  const base64 = p.signature_png.split(',')[1] ?? '';
  const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: to.split(',').map((s) => s.trim()).filter(Boolean),
      subject: `Firma recibida · ${p.deckTitle}`,
      html: `<div style="font-family:monospace;line-height:1.6">
        <p><strong>${esc(p.signer_name)}</strong> (${esc(p.signer_email)}) ha firmado la propuesta <strong>${esc(p.deckTitle)}</strong>.</p>
        <p>Fecha: ${esc(p.signed_at)}</p>
        <p>Firma adjunta.</p>
      </div>`,
      attachments: base64 ? [{ filename: 'firma.png', content: base64 }] : undefined,
    }),
  });
}
