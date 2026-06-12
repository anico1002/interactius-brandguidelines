import type { Slide, SlideSource, Token, Theme, Column } from './types.ts';
import { themeFor } from './theme.ts';
import { parseGantt } from './blocks.ts';

const find = <T extends Token['t']>(tokens: Token[], t: T) =>
  tokens.find((x) => x.t === t) as Extract<Token, { t: T }> | undefined;
const heading = (tokens: Token[]) =>
  tokens.find((x) => x.t === 'h') as Extract<Token, { t: 'h' }> | undefined;

function overrideTheme(text: string): { clean: string; theme: Theme | undefined } {
  const m = text.match(/\s*\{(oscuro|dark|claro|light)\}\s*$/i);
  if (!m) return { clean: text, theme: undefined };
  const t = m[1].toLowerCase();
  return { clean: text.replace(m[0], '').trim(), theme: t === 'oscuro' || t === 'dark' ? 'dark' : 'light' };
}

export function classify(src: SlideSource, position: number, total: number): Slide {
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
  const title = ov.clean;
  const T = (kind: Slide['kind']) => themeFor(kind, ov.theme);

  const isFirst = position === 0;
  const isLast = position === total - 1;
  const clientLine = quote?.text.match(/^cliente:\s*(.+)$/i);

  // 1. Explicit data blocks
  if (fence && fence.lang === 'gantt') {
    const g = parseGantt(fence.body);
    return { kind: 'gantt', theme: T('gantt'), title: title || 'Roadmap', subtitle: paras[0]?.text, weeks: g.weeks, rows: g.rows, milestones: g.milestones, note: paras[1]?.text };
  }

  // 2. Cover: first slide with an H1 that carries a subtitle/client/image, or simply no caps eyebrow.
  if (isFirst && h && h.level === 1 && (paras.length > 0 || clientLine || image || !caps)) {
    return { kind: 'cover', theme: T('cover'), title, subtitle: paras[0]?.text, eyebrow: caps?.text, client: clientLine?.[1]?.trim(), image: image ? { src: image.src, alt: image.alt } : undefined };
  }

  // 3. Closing: last slide titled Gracias, or H1 with a url-looking line.
  if (isLast && h && (/gracias/i.test(title) || paras.some((p) => /www\.|https?:/i.test(p.text)))) {
    const url = paras.find((p) => /www\.|https?:/i.test(p.text))?.text;
    return { kind: 'closing', theme: T('closing'), title: title || 'Gracias', url };
  }

  // 4. Statement: caps eyebrow + heading, nothing structured.
  if (caps && h && !list && subs.length === 0 && !image) {
    return { kind: 'statement', theme: T('statement'), eyebrow: caps.text, title };
  }

  // 5. Columns: heading + 2+ subheads.
  if (h && subs.length >= 2) {
    const columns: Column[] = subs.map((sub, i) => {
      const idx = tokens.indexOf(sub);
      const next = tokens[idx + 1];
      const body = next && next.t === 'p' ? next.text : '';
      return { label: String(i + 1).padStart(2, '0'), heading: sub.text, body };
    });
    return { kind: 'columns', theme: T('columns'), title, columns };
  }

  // 6. Bullets: heading + list.
  if (h && list) {
    return { kind: 'bullets', theme: T('bullets'), title, items: list.items };
  }

  // 7. Image + text split.
  if (h && image) {
    return { kind: 'split', theme: T('split'), eyebrow: caps?.text, title, body: paras[0]?.text, image: { src: image.src, alt: image.alt } };
  }

  // 8. Paragraph fallback (also covers "contexto": heading + lead paragraph).
  const body = quote?.text ?? paras[0]?.text ?? title;
  return { kind: 'paragraph', theme: T('paragraph'), eyebrow: caps?.text, body };
}

export function compile(_md: string, sources: SlideSource[]): Slide[] {
  return sources.map((s, i) => classify(s, i, sources.length));
}
