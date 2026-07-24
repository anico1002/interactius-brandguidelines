import type { Slide, SlideSource, Column, Signer, RichNode, Token } from './types.ts';
import { themeFor } from './theme.ts';
import { parseGantt, parseBudget } from './blocks.ts';
import { LAYOUT_MAP } from './catalog.ts';
import { parseBlock, type BlockModel } from './model.ts';

// Detection (fallback when there is no explicit [ly:] marker) — returns only the kind.
// Reads the canonical model; `headings[0]` mirrors the old "first heading" signal.
function detectKind(m: BlockModel): Slide['kind'] {
  const h = m.headings[0];
  const eb = m.eyebrow?.trim().toUpperCase();
  const hk = m.title.trim().toUpperCase();

  if (m.fence && m.fence.lang === 'gantt') return 'gantt';

  if (eb === 'CONTEXTO') return 'contexto';
  if (eb === 'EL RETO') return 'elreto';
  if (hk === 'OBJETIVOS') return 'objetivos';
  if (hk === 'ROADMAP') return 'roadmapPhases';
  if (hk === 'PRESUPUESTO') return 'budget';

  if (m.isFirst && h && h.level === 1 && (m.body.length > 0 || m.client || m.image || !m.eyebrow)) return 'cover';
  if (m.isLast && h && (/gracias/i.test(m.title) || m.body.some((p) => /www\.|https?:/i.test(p)))) return 'closing';
  if (m.eyebrow && h && !m.items && m.sections.length === 0 && !m.image) return 'statement';
  if (h && m.sections.length >= 2) return 'columns';
  if (h && m.items) return 'bullets';
  if (h && m.image) return 'split';
  return 'paragraph';
}

// Ordered body flow for the free-text layouts (paragraph/split/contexto): paragraphs and bullet
// lists (`- …`) kept in document order, so a `-` list can sit between paragraphs. Quotes are
// folded into paragraphs (kept as plain body text, as before); headings/eyebrows are consumed as
// title/eyebrow elsewhere and excluded here.
function bodyFlow(tokens: Token[]): RichNode[] {
  const out: RichNode[] = [];
  for (const tk of tokens) {
    if (tk.t === 'p' || tk.t === 'quote') out.push({ t: 'p', text: tk.text });
    else if (tk.t === 'ul') out.push({ t: 'ul', items: tk.items });
  }
  return out;
}

// Plain-text length of a body flow (paragraphs + list items) — used for contexto's long/short size.
const flowText = (nodes: RichNode[]): string =>
  nodes.map((n) => (n.t === 'ul' ? n.items.join(' ') : n.t === 'p' || n.t === 'quote' || n.t === 'h' || n.t === 'caps' ? n.text : '')).join(' ');

// Construct the typed slide for a kind by mapping the canonical model into the layout's slots.
// Robust to missing roles (explicit markers may not match the content).
function buildSlide(m: BlockModel, kind: Slide['kind'], marker?: string): Slide {
  const T = (k: Slide['kind']) => themeFor(k, m.themeOverride);
  switch (kind) {
    case 'cover':
      return { kind, theme: T('cover'), title: m.title, subtitle: m.subtitle ?? m.body[0], eyebrow: m.eyebrow, client: m.client, image: m.image };
    case 'closing':
      return { kind, theme: T('closing'), title: m.title || 'Gracias', url: m.body.find((p) => /www\.|https?:/i.test(p)) };
    case 'statement':
      return { kind, theme: T('statement'), eyebrow: m.eyebrow, title: m.title };
    case 'paragraph': {
      // Body is an ordered flow of paragraphs and `-` lists (in document order), falling back to
      // the title when empty.
      const flow = bodyFlow(m.tokens);
      return { kind, theme: T('paragraph'), eyebrow: m.eyebrow, body: flow.length ? flow : [{ t: 'p', text: m.title }] };
    }
    case 'bullets':
      return { kind, theme: T('bullets'), title: m.title, items: m.items ?? [] };
    case 'columns': {
      const columns: Column[] = m.sections.map((s, i) => ({ label: String(i + 1).padStart(2, '0'), heading: s.heading, body: s.body[0] ?? '' }));
      return { kind, theme: T('columns'), title: m.title, columns };
    }
    case 'split': {
      // Default (and split-der) keeps the image-right layout; split-izq mirrors it. The text
      // column renders an ordered flow of paragraphs and `-` lists beside the image.
      const flow = bodyFlow(m.tokens);
      return { kind, theme: T('split'), eyebrow: m.eyebrow, title: m.title, body: flow.length ? flow : undefined, image: m.image, imageSide: marker === 'split-izq' ? 'left' : 'right' };
    }
    case 'gantt': {
      // The spec can live in a ```gantt fence``` OR as plain `clave: valor` lines in the block.
      const spec = m.fence?.body ?? [...m.body, ...(m.items ?? [])].filter((l) => l.includes(':')).join('\n');
      const g = parseGantt(spec);
      // Prose vs spec: with a fence, every paragraph is prose (the spec lives in the fence);
      // without one, the spec lines carry a `clave: valor` colon, so the paragraphs WITHOUT a
      // colon are free prose — the first is the subtitle (normal text below the title), the
      // second the bottom-right note.
      const prose = m.fence ? m.body : m.body.filter((l) => !l.includes(':'));
      // Untitled fallback is "Calendario", not "Roadmap": that is what the real decks call this
      // slide (7 of 10 — Calendario/Calendari), and "Roadmap" is the name of a DIFFERENT layout
      // (roadmapPhases), so borrowing it here made two layouts answer to one word.
      return { kind, theme: T('gantt'), title: m.title || 'Calendario', subtitle: prose[0], weeks: g.weeks, unit: g.unit, rows: g.rows, milestones: g.milestones, milestoneLabel: g.milestoneLabel, note: prose[1] };
    }
    case 'budget':
      return { kind, theme: 'light', title: m.title || undefined, ...parseBudget(m.tokens) };
    case 'contexto': {
      // Ordered flow of paragraphs and `-` lists; long/short sizing keys off the total text length.
      const flow = bodyFlow(m.tokens);
      return { kind, theme: T('contexto'), eyebrow: m.eyebrow, body: flow, long: flowText(flow).length >= 150 };
    }
    case 'elreto':
      return { kind, theme: T('elreto'), eyebrow: m.eyebrow, title: m.title, image: m.image };
    case 'objetivos':
      return { kind, theme: T('objetivos'), title: m.title, items: m.items ?? [], image: m.image };
    case 'roadmapPhases': {
      // Per phase: first paragraph = body, a second paragraph = the tasks header (e.g. "¿Qué
      // hacemos?"), so the header is authored in the markdown and translates. The "Fase" label
      // above each phase is authored via a `fase: …` line (defaults to "Fase" in the component),
      // so it can be changed/translated; that meta line is kept out of the subtitle.
      const subtitle = m.subtitle ?? m.body.find((p) => !/^[\p{L} ]+:\s*.+$/u.test(p));
      return { kind, theme: T('roadmapPhases'), title: m.title, subtitle, faseLabel: m.meta['fase'], phases: m.sections.map((s) => ({ name: s.heading, body: s.body[0] ?? '', itemsHeader: s.body[1], items: s.items })) };
    }
    case 'manifesto':
      return { kind, theme: T('manifesto'), title: m.title || m.body[0], subtitle: m.subtitle ?? (m.hasHeading ? m.body[0] : m.body[1]) };
    case 'team': {
      // The team text column renders a free-form flow (paragraphs/lists/quotes/sub-headings/
      // eyebrows) in document order, so every formatting element is supported.
      const content: RichNode[] = m.tokens.flatMap((tk): RichNode[] => {
        if (tk.t === 'p') return [{ t: 'p', text: tk.text }];
        if (tk.t === 'ul') return [{ t: 'ul', items: tk.items }];
        if (tk.t === 'quote') return [{ t: 'quote', text: tk.text }];
        if (tk.t === 'h') return [{ t: 'h', level: tk.level, text: tk.text }];
        if (tk.t === 'caps') return [{ t: 'caps', text: tk.text }];
        return [];
      });
      return { kind, theme: T('team'), content: content.length ? content : undefined, image: m.image };
    }
    case 'clients':
      // Category labels come from the block's list, in order — they map to the fixed slots the
      // component draws over the logo wall. As markdown list items they translate with the deck.
      // A marker-only block yields no list → the component fills in the canonical categories.
      return { kind, theme: T('clients'), labels: m.items ?? [], image: m.image };
    case 'acceptance': {
      const signer: Signer = { name: m.meta['nombre'], role: m.meta['cargo'], company: m.meta['empresa'], nif: m.meta['nif'], address: m.meta['direccion'] };
      const hasSigner = Object.values(signer).some(Boolean);
      return {
        kind, theme: 'light',
        title: m.title || undefined,
        signer: hasSigner ? signer : undefined,
        // The note is the `aviso:` line or, failing that, the first free paragraph — so a note
        // written as plain text (not a key:value) is captured and translated.
        note: m.meta['aviso'] ?? m.body[0],
        cta: m.meta['cta'],
        signatureImage: m.image,
      };
    }
  }
}

/* The resolved kind for a block: explicit [ly:] marker wins, else inference. */
export function blockKind(m: BlockModel): Slide['kind'] {
  return (m.marker && LAYOUT_MAP[m.marker]) || detectKind(m);
}

export function classify(src: SlideSource, position: number, total: number): Slide {
  const m = parseBlock(src.tokens, position, total);
  const slide = buildSlide(m, blockKind(m), m.marker);
  // bg rides on every kind via the Slide intersection — attach once here (only when non-default).
  return m.bg && m.bg !== 'warm-light' ? { ...slide, bg: m.bg } : slide;
}

export function compile(_md: string, sources: SlideSource[]): Slide[] {
  return sources.map((s, i) => classify(s, i, sources.length));
}
