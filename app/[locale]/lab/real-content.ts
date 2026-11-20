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
  /* Take the first three phase headings with their prose; columns take no bullets. The donor's own
     title does NOT come along: it says "Roadmap", which is the wrong word over a columns slide and
     names a different layout — the borrowing is meant to be invisible, and a title reading Roadmap
     announces it. The columns slide is the approach, so it is titled "Enfoque". */
  columnas: {
    from: 'roadmap',
    reshape: (b) => {
      const phases = b.split(/^###\s+/m).slice(1);
      const title = '## Enfoque';
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

/* For some layouts the strain is not how much prose a slide holds but how many repeated elements
   it splits into: the roadmap grid stretches every phase card to the tallest, so four phases is a
   different problem from two, not a longer version of it. The real decks run 2, 3 and 4 phases and
   the median lands on 3 — which hides the case that actually breaks. So for these, first keep only
   the examples with the MOST elements, then take the median length within that group: still a
   typical slide, but of the shape worth tuning against. */
const BY_COUNT: Record<string, RegExp> = { roadmap: /^###\s+/gm };

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
      let xs = blocks[key] ?? [];
      const counter = BY_COUNT[key];
      if (counter && xs.length) {
        const n = (b: string) => (b.match(counter) ?? []).length;
        const most = Math.max(...xs.map((x) => n(x.body)));
        xs = xs.filter((x) => n(x.body) === most);
      }
      xs = [...xs].sort((a, b) => weigh(key, a.body) - weigh(key, b.body));
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
    const all = blocks[marker] ?? [];
    const counter = BY_COUNT[marker];
    sources[marker] = counter
      ? `${median.client} · ${(median.body.match(counter) ?? []).length} elementos (el máximo real) de ${all.length} usos`
      : `${median.client} · mediana de ${all.length}`;
  }
  return { md: md.join('\n\n---\n\n') + '\n', sources };
}
