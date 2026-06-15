'use client';
import { supabaseBrowser } from '@/lib/supabase/client';
import type {
  ClientCreateInput,
  ClientRecord,
  DeckCreateInput,
  DeckListItem,
  DeckRecord,
  DeckUpdateInput,
} from './types';

const LOGO_BUCKET = 'deck-assets';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error((msg as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ---- Decks ----
export function listDecks(): Promise<DeckListItem[]> {
  return fetch('/api/decks', { cache: 'no-store' }).then((r) => json<DeckListItem[]>(r));
}

export function getDeck(id: string): Promise<DeckRecord> {
  return fetch(`/api/decks/${id}`, { cache: 'no-store' }).then((r) => json<DeckRecord>(r));
}

export function createDeck(input: DeckCreateInput): Promise<DeckRecord> {
  return fetch('/api/decks', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => json<DeckRecord>(r));
}

export function updateDeck(id: string, patch: DeckUpdateInput): Promise<DeckRecord> {
  return fetch(`/api/decks/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<DeckRecord>(r));
}

export function deleteDeck(id: string): Promise<{ ok: boolean }> {
  return fetch(`/api/decks/${id}`, { method: 'DELETE' }).then((r) => json<{ ok: boolean }>(r));
}

// ---- Clients ----
export function listClients(): Promise<ClientRecord[]> {
  return fetch('/api/clients', { cache: 'no-store' }).then((r) => json<ClientRecord[]>(r));
}

export function addClient(input: ClientCreateInput): Promise<ClientRecord> {
  return fetch('/api/clients', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => json<ClientRecord>(r));
}

// ---- Storage (logos) ----
/* Upload an SVG logo to the public bucket and return its storage path.
   Render it via publicLogoUrl() as an <img src> — never inline SVG (XSS). */
export async function uploadLogo(file: File): Promise<string> {
  const sb = supabaseBrowser();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `logos/${Date.now()}-${safe}`;
  const { error } = await sb.storage.from(LOGO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'image/svg+xml',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export function publicLogoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const sb = supabaseBrowser();
  return sb.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
}
