/* LOCAL SANDBOX — not part of the product, do not ship.

   Builds a deck out of the copy that actually shipped, so layouts get tuned against real words:
   dummy text looks fine at any size and settles nothing.

   Read live from Supabase rather than copied into the repo. The decks are client proposals with
   budgets in them and this repo is public — their words must not land in git. Reading at runtime
   also means the sandbox tracks whatever is in the tool today.

   For each layout it picks the example of MEDIAN length: the typical case, not the extreme. A
   layout has to be tuned for what a deck normally says; the longest title on record is a limit to
   survive, not a case to design for. */
import { supabaseBrowser } from '@/lib/supabase/client';
import { LAYOUT_CATALOG } from '@/lib/deck/catalog';

/* Brand pages fall back to canonical copy while the block is empty, so they stay marker-only. */
const BRAND_PAGES = new Set(['manifiesto', 'clientes', 'aceptacion']);

/* What makes an example typical differs by layout. Ranking the cover by whole-block length picks
   by image URL and client name as much as by the headline, and lands on a two-line title when the
   median headline is 54 characters and runs three. Rank the title-led layouts by their title. */
const TITLE_LED = new Set(['portada', 'enunciado', 'reto', 'split-izq', 'split-der', 'cierre']);

/* Nobody has ever written an `enunciado` or a `columnas` in nine decks, so there is no real copy to
   show — and a blank slide can't be tuned. Borrow from the sibling that shares its shape rather
   than invent lorem: `enunciado` is eyebrow + big headline, which is what `reto` already is;
   `columnas` is a title over headed columns, which is what `roadmap`'s phases already are. Real
   words, right shape. */
const BORROW: Record<string, { from: string; reshape: (body: string) => string }> = {
  /* Drop the image: a statement is the words alone. */
  enunciado: { from: 'reto', reshape: (b) => b.replace(/^!\[.*$/gm, '').trim() },
  /* Keep the title and the first three phase headings with their prose; columns take no bullets. */
  columnas: {
    from: 'roadmap',
    reshape: (b) => {
      const [head, ...phases] = b.split(/^###\s+/m);
      const title = head.split('\n').find((l) => l.startsWith('##')) ?? '## Enfoque';
      const cols = phases.slice(0, 3).map((p) => {
        const [name, ...rest] = p.split('\n');
        const prose = rest.find((l) => l.trim() && !l.startsWith('-')) ?? '';
        return `### ${name.trim()}\n${prose.trim()}`;
      });
      return [title, ...cols].join('\n\n');
    },
  },
};

const weigh = (marker: string, body: string): number =>
  TITLE_LED.has(marker) ? (body.match(/^#{1,2}\s+(.+)$/m)?.[1]?.length ?? 0) : body.length;

export type RealMix = { md: string; sources: Record<string, string> };

export async function loadRealMix(): Promise<RealMix> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from('decks').select('md');
  if (error) throw new Error(error.message);

  const blocks: Record<string, { client: string; body: string }[]> = {};
  for (const row of (data ?? []) as { md: string }[]) {
    const client = row.md.match(/>\s*cliente:\s*(.+)/i)?.[1]?.trim() ?? '?';
    for (const raw of row.md.split(/\n---+\n/)) {
      const marker = raw.match(/\[ly:\s*([a-z-]+)\]/)?.[1];
      if (!marker) continue;
      (blocks[marker] ||= []).push({ client, body: raw.trim() });
    }
  }

  const md: string[] = [];
  const sources: Record<string, string> = {};
  for (const { marker } of LAYOUT_CATALOG) {
    if (BRAND_PAGES.has(marker)) {
      md.push(`[ly: ${marker}]`);
      sources[marker] = 'contenido de marca';
      continue;
    }
    const pick = (key: string) => {
      const xs = (blocks[key] ?? []).sort((a, b) => weigh(key, a.body) - weigh(key, b.body));
      return xs.length ? xs[Math.floor(xs.length / 2)] : null;
    };

    /* Nobody has ever written this layout: borrow real copy from the sibling that shares its shape,
       so there is something true to tune against instead of a blank slide. */
    const lend = BORROW[marker];
    if (lend && !(blocks[marker] ?? []).length) {
      const donor = pick(lend.from);
      if (donor) {
        md.push(`[ly: ${marker}]\n\n${lend.reshape(donor.body).replace(/\[ly:[^\]]*\]\s*/, '')}`);
        sources[marker] = `SIN USO REAL · texto de ${lend.from} (${donor.client})`;
        continue;
      }
    }

    const median = pick(marker);
    if (!median) {
      const entry = LAYOUT_CATALOG.find((e) => e.marker === marker);
      md.push(entry?.skeleton ? `[ly: ${marker}]\n\n${entry.skeleton}` : `[ly: ${marker}]`);
      sources[marker] = 'SIN USO REAL · plantilla';
      continue;
    }
    /* Remote images resolve over the network; keep them, they are the real ones. */
    md.push(median.body);
    sources[marker] = `${median.client} · mediana de ${(blocks[marker] ?? []).length}`;
  }
  return { md: md.join('\n\n---\n\n') + '\n', sources };
}
