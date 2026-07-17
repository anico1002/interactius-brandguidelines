import type { DeckType } from '@/lib/deck';

/* Metadata stored alongside a presentation's Markdown. Matches the `decks` table. */
export interface DeckMeta {
  commercial_id: string;
  client_id: string | null;
  contact_emails: string[];
  logo_path: string | null;
  budget_url: string | null;
  type: DeckType;
  tags: string[];
}

/* A full deck row (metadata + content). */
export interface DeckRecord extends DeckMeta {
  id: string;
  md: string;
  created_at: string;
  updated_at: string;
}

/* Compact row for the "Abrir" history list and the gallery grid. Includes the joined
   client name plus `tags`, and `md`/`type` so the gallery can render a cover thumbnail. */
export interface DeckListItem {
  id: string;
  commercial_id: string;
  client_id: string | null;
  client_name: string | null;
  tags: string[];
  md: string;
  type: DeckType;
  created_at: string;
  updated_at: string;
}

/* A client row that feeds the "Cliente" dropdown. */
export interface ClientRecord {
  id: string;
  name: string;
  default_logo_path: string | null;
  default_emails: string[] | null;
  created_at: string;
}

export type DeckCreateInput = Partial<DeckMeta> & { commercial_id: string; md?: string };
export type DeckUpdateInput = Partial<DeckMeta & { md: string }>;
export type ClientCreateInput = { name: string; default_logo_path?: string | null; default_emails?: string[] | null };

/* A client's signature on a saved deck (Acceptance page). Matches the `signatures` table. */
export interface DeckSignature {
  id: string;
  deck_id: string;
  signer_name: string;
  signer_email: string;
  signature_png: string; // PNG data URL of the drawn signature
  ip: string | null;
  user_agent: string | null;
  signed_at: string;
}

export type SignInput = { signer_name: string; signer_email: string; signature_png: string };

/* A reusable image in the gallery. `source` distinguishes manual uploads from
   AI-generated ones (future); `prompt` records the style-guide prompt used to generate it. */
export interface ImageRecord {
  id: string;
  storage_path: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  source: 'upload' | 'generated';
  prompt: string | null;
  created_at: string;
}

export type ImageCreateInput = {
  storage_path: string;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  source?: 'upload' | 'generated';
  prompt?: string | null;
};
