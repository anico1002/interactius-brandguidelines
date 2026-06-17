import type { Slide, SlideSource, Column, Signer } from './types.ts';
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
    case 'paragraph':
      return { kind, theme: T('paragraph'), eyebrow: m.eyebrow, body: m.quotes[0] ?? m.body[0] ?? m.title };
    case 'bullets':
      return { kind, theme: T('bullets'), title: m.title, items: m.items ?? [] };
    case 'columns': {
      const columns: Column[] = m.sections.map((s, i) => ({ label: String(i + 1).padStart(2, '0'), heading: s.heading, body: s.body[0] ?? '' }));
      return { kind, theme: T('columns'), title: m.title, columns };
    }
    case 'split':
      // Default (and split-der) keeps the image-right layout; split-izq mirrors it.
      return { kind, theme: T('split'), eyebrow: m.eyebrow, title: m.title, body: m.body[0], image: m.image, imageSide: marker === 'split-izq' ? 'left' : 'right' };
    case 'gantt': {
      // The spec can live in a ```gantt fence``` OR as plain `clave: valor` lines in the block.
      const spec = m.fence?.body ?? [...m.body, ...(m.items ?? [])].filter((l) => l.includes(':')).join('\n');
      const g = parseGantt(spec);
      // With a fence the paragraphs are subtitle/note; without, they ARE the spec.
      return { kind, theme: T('gantt'), title: m.title || 'Roadmap', subtitle: m.fence ? m.body[0] : undefined, weeks: g.weeks, unit: g.unit, rows: g.rows, milestones: g.milestones, milestoneLabel: g.milestoneLabel, note: m.fence ? m.body[1] : undefined };
    }
    case 'budget':
      return { kind, theme: 'light', title: m.title || undefined, ...parseBudget(m.tokens) };
    case 'contexto': {
      const body = m.body.join(' ') || m.quotes[0] || '';
      return { kind, theme: T('contexto'), eyebrow: m.eyebrow, body, long: body.length >= 150 };
    }
    case 'elreto':
      return { kind, theme: T('elreto'), eyebrow: m.eyebrow, title: m.title, image: m.image };
    case 'objetivos':
      return { kind, theme: T('objetivos'), title: m.title, items: m.items ?? [], image: m.image };
    case 'roadmapPhases':
      return { kind, theme: T('roadmapPhases'), title: m.title, subtitle: m.subtitle ?? m.body[0], phases: m.sections.map((s) => ({ name: s.heading, body: s.body[0] ?? '', items: s.items })) };
    case 'manifesto':
      return { kind, theme: T('manifesto'), title: m.title || m.body[0], subtitle: m.subtitle ?? (m.hasHeading ? m.body[0] : m.body[1]) };
    case 'team':
      return { kind, theme: T('team'), paragraphs: m.body.length ? m.body : undefined, items: m.items, image: m.image };
    case 'clients':
      return { kind, theme: T('clients'), image: m.image };
    case 'acceptance': {
      const signer: Signer = { name: m.meta['nombre'], role: m.meta['cargo'], company: m.meta['empresa'], nif: m.meta['nif'], address: m.meta['direccion'] };
      const hasSigner = Object.values(signer).some(Boolean);
      return {
        kind, theme: 'light',
        title: m.title || undefined,
        signer: hasSigner ? signer : undefined,
        note: m.meta['aviso'],
        cta: m.meta['cta'],
        signatureImage: m.image,
      };
    }
  }
}

export function classify(src: SlideSource, position: number, total: number): Slide {
  const m = parseBlock(src.tokens, position, total);
  const kind = (m.marker && LAYOUT_MAP[m.marker]) || detectKind(m);
  return buildSlide(m, kind, m.marker);
}

export function compile(_md: string, sources: SlideSource[]): Slide[] {
  return sources.map((s, i) => classify(s, i, sources.length));
}
