import type { Slide, SlideSource, Token, Theme, Column, Signer } from './types.ts';
import { themeFor } from './theme.ts';
import { parseGantt, parseBudget } from './blocks.ts';

const find = <T extends Token['t']>(tokens: Token[], t: T) =>
  tokens.find((x) => x.t === t) as Extract<Token, { t: T }> | undefined;
const heading = (tokens: Token[]) =>
  tokens.find((x) => x.t === 'h') as Extract<Token, { t: 'h' }> | undefined;

function extractPhases(tokens: Token[]): { name: string; body: string; items: string[] }[] {
  const phases: { name: string; body: string; items: string[] }[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.t === 'h' && t.level >= 3) {
      let body = '';
      const items: string[] = [];
      for (let j = i + 1; j < tokens.length; j++) {
        const u = tokens[j];
        if (u.t === 'h' && u.level >= 3) break;
        if (u.t === 'p' && !body) body = u.text;
        if (u.t === 'ul') items.push(...u.items);
      }
      phases.push({ name: t.text, body, items });
    }
  }
  return phases;
}

function overrideTheme(text: string): { clean: string; theme: Theme | undefined } {
  const m = text.match(/\s*\{(oscuro|dark|claro|light)\}\s*$/i);
  if (!m) return { clean: text, theme: undefined };
  const t = m[1].toLowerCase();
  return { clean: text.replace(m[0], '').trim(), theme: t === 'oscuro' || t === 'dark' ? 'dark' : 'light' };
}

/* `clave: valor` lines (paragraphs, quotes or list items) — used by the acceptance page. */
function kvLines(tokens: Token[]): Record<string, string> {
  const out: Record<string, string> = {};
  const lines: string[] = [];
  for (const t of tokens) {
    if (t.t === 'p' || t.t === 'quote') lines.push(t.text);
    if (t.t === 'ul') lines.push(...t.items);
  }
  for (const l of lines) {
    const m = l.match(/^([\p{L} ]+):\s*(.+)$/u);
    if (m) out[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return out;
}

// Marker name → slide kind. `split-der`/`split-izq` both map to split (image side differs).
const LAYOUT_MAP: Record<string, Slide['kind']> = {
  portada: 'cover',
  cierre: 'closing',
  enunciado: 'statement',
  texto: 'paragraph',
  lista: 'bullets',
  columnas: 'columns',
  'split-izq': 'split',
  'split-der': 'split',
  contexto: 'contexto',
  reto: 'elreto',
  objetivos: 'objetivos',
  roadmap: 'roadmapPhases',
  gantt: 'gantt',
  presupuesto: 'budget',
  manifiesto: 'manifesto',
  equipo: 'team',
  clientes: 'clients',
  aceptacion: 'acceptance',
};

type Ctx = {
  tokens: Token[];
  h: Extract<Token, { t: 'h' }> | undefined;
  caps: Extract<Token, { t: 'caps' }> | undefined;
  quote: Extract<Token, { t: 'quote' }> | undefined;
  image: Extract<Token, { t: 'image' }> | undefined;
  fence: Extract<Token, { t: 'fence' }> | undefined;
  list: Extract<Token, { t: 'ul' }> | undefined;
  subs: Extract<Token, { t: 'h' }>[];
  paras: Extract<Token, { t: 'p' }>[];
  title: string;
  T: (kind: Slide['kind']) => Theme;
  isFirst: boolean;
  isLast: boolean;
  clientLine: RegExpMatchArray | null | undefined;
};

function context(src: SlideSource, position: number, total: number): Ctx {
  const tokens = src.tokens;
  const h = heading(tokens);
  const caps = find(tokens, 'caps');
  const quote = find(tokens, 'quote');
  const image = find(tokens, 'image');
  const fence = find(tokens, 'fence');
  const list = find(tokens, 'ul');
  const subs = tokens.filter((x) => x.t === 'h' && x.level >= 3) as Extract<Token, { t: 'h' }>[];
  const paras = tokens.filter((x) => x.t === 'p') as Extract<Token, { t: 'p' }>[];
  const ov = overrideTheme(h?.text ?? '');
  return {
    tokens, h, caps, quote, image, fence, list, subs, paras,
    title: ov.clean,
    T: (kind) => themeFor(kind, ov.theme),
    isFirst: position === 0,
    isLast: position === total - 1,
    clientLine: quote?.text.match(/^cliente:\s*(.+)$/i),
  };
}

// Detection (fallback when no explicit marker) — returns only the kind.
function detectKind(c: Ctx): Slide['kind'] {
  const { h, caps, image, list, subs, paras, title, isFirst, isLast, clientLine, fence } = c;

  if (fence && fence.lang === 'gantt') return 'gantt';

  const eb = caps?.text.trim().toUpperCase();
  const hk = title.trim().toUpperCase();
  if (eb === 'CONTEXTO') return 'contexto';
  if (eb === 'EL RETO') return 'elreto';
  if (hk === 'OBJETIVOS') return 'objetivos';
  if (hk === 'ROADMAP') return 'roadmapPhases';
  if (hk === 'PRESUPUESTO') return 'budget';

  if (isFirst && h && h.level === 1 && (paras.length > 0 || clientLine || image || !caps)) return 'cover';
  if (isLast && h && (/gracias/i.test(title) || paras.some((p) => /www\.|https?:/i.test(p.text)))) return 'closing';
  if (caps && h && !list && subs.length === 0 && !image) return 'statement';
  if (h && subs.length >= 2) return 'columns';
  if (h && list) return 'bullets';
  if (h && image) return 'split';
  return 'paragraph';
}

const imageRef = (c: Ctx) => (c.image ? { src: c.image.src, alt: c.image.alt } : undefined);

// Construct the typed slide for a kind. Robust to missing tokens (explicit markers may not match content).
function buildSlide(kind: Slide['kind'], c: Ctx, marker?: string): Slide {
  const { title, paras, caps, quote, list, subs, image, tokens, clientLine } = c;
  const T = c.T;
  switch (kind) {
    case 'cover':
      return { kind, theme: T('cover'), title, subtitle: paras[0]?.text, eyebrow: caps?.text, client: clientLine?.[1]?.trim(), image: imageRef(c) };
    case 'closing':
      return { kind, theme: T('closing'), title: title || 'Gracias', url: paras.find((p) => /www\.|https?:/i.test(p.text))?.text };
    case 'statement':
      return { kind, theme: T('statement'), eyebrow: caps?.text, title };
    case 'paragraph':
      return { kind, theme: T('paragraph'), eyebrow: caps?.text, body: quote?.text ?? paras[0]?.text ?? title };
    case 'bullets':
      return { kind, theme: T('bullets'), title, items: list?.items ?? [] };
    case 'columns': {
      const columns: Column[] = subs.map((sub, i) => {
        const idx = tokens.indexOf(sub);
        const next = tokens[idx + 1];
        const body = next && next.t === 'p' ? next.text : '';
        return { label: String(i + 1).padStart(2, '0'), heading: sub.text, body };
      });
      return { kind, theme: T('columns'), title, columns };
    }
    case 'split':
      // Default (and split-der) keeps the current image-right layout; split-izq mirrors it.
      return { kind, theme: T('split'), eyebrow: caps?.text, title, body: paras[0]?.text, image: imageRef(c), imageSide: marker === 'split-izq' ? 'left' : 'right' };
    case 'gantt': {
      // The gantt spec can live in a ```fence``` OR, with the [ly: gantt] marker, as plain
      // `clave: valor` lines in the block (consistent with the rest of the label system).
      const fenceBody = c.fence?.body;
      const spec = fenceBody ?? [...paras.map((p) => p.text), ...(list?.items ?? [])].filter((l) => l.includes(':')).join('\n');
      const g = parseGantt(spec);
      // With a fence the paragraphs are subtitle/note; without, the paragraphs ARE the spec.
      return { kind, theme: T('gantt'), title: title || 'Roadmap', subtitle: fenceBody ? paras[0]?.text : undefined, weeks: g.weeks, unit: g.unit, rows: g.rows, milestones: g.milestones, note: fenceBody ? paras[1]?.text : undefined };
    }
    case 'budget':
      return { kind, theme: 'light', ...parseBudget(tokens) };
    case 'contexto': {
      const body = paras.map((p) => p.text).join(' ') || quote?.text || '';
      return { kind, theme: T('contexto'), body, long: body.length >= 150 };
    }
    case 'elreto':
      return { kind, theme: T('elreto'), title, image: imageRef(c) };
    case 'objetivos':
      return { kind, theme: T('objetivos'), title, items: list?.items ?? [], image: imageRef(c) };
    case 'roadmapPhases':
      return { kind, theme: T('roadmapPhases'), title, subtitle: paras[0]?.text, phases: extractPhases(tokens) };
    case 'manifesto':
      return { kind, theme: T('manifesto'), title: title || paras[0]?.text, subtitle: c.h ? paras[0]?.text : paras[1]?.text };
    case 'team':
      return { kind, theme: T('team'), paragraphs: paras.length ? paras.map((p) => p.text) : undefined, image: imageRef(c) };
    case 'clients':
      return { kind, theme: T('clients'), image: imageRef(c) };
    case 'acceptance': {
      const kv = kvLines(tokens);
      const signer: Signer = { name: kv['nombre'], role: kv['cargo'], company: kv['empresa'], nif: kv['nif'], address: kv['direccion'] };
      const hasSigner = Object.values(signer).some(Boolean);
      return {
        kind, theme: 'light',
        title: title || undefined,
        signer: hasSigner ? signer : undefined,
        note: kv['aviso'],
        cta: kv['cta'],
        signatureImage: image ? imageRef(c) : undefined,
      };
    }
  }
}

export function classify(src: SlideSource, position: number, total: number): Slide {
  const c = context(src, position, total);
  const marker = (find(c.tokens, 'layout') as Extract<Token, { t: 'layout' }> | undefined)?.name;
  const kind = (marker && LAYOUT_MAP[marker]) || detectKind(c);
  return buildSlide(kind, c, marker);
}

export function compile(_md: string, sources: SlideSource[]): Slide[] {
  return sources.map((s, i) => classify(s, i, sources.length));
}
