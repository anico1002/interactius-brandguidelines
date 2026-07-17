import type { SlideSource, Token } from './types.ts';

const isCaps = (l: string) =>
  l.length > 0 && l.length <= 48 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(l) && !/[.;:]/.test(l);

export function parse(md: string): SlideSource[] {
  const chunks = md.replace(/\r\n/g, '\n').split(/\n-{3,}\n/);
  return chunks.map((chunk, index) => ({ index, tokens: tokenize(chunk) }));
}

function tokenize(chunk: string): Token[] {
  const lines = chunk.split('\n');
  const tokens: Token[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    // Explicit layout marker: `[ly: nombre]`, optional background `{blanco|warm-dark|…}` after it.
    const ly = trimmed.match(/^\[ly:?\s+([a-z0-9-]+)\]\s*(?:\{([a-z-]+)\})?$/i);
    if (ly) { tokens.push({ t: 'layout', name: ly[1].toLowerCase(), mod: ly[2]?.toLowerCase() }); i++; continue; }

    const fence = trimmed.match(/^```(\w+)?\s*$/);
    if (fence) {
      const lang = fence[1] ?? '';
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) { body.push(lines[i]); i++; }
      i++; // closing fence
      tokens.push({ t: 'fence', lang, body: body.join('\n').trim() });
      continue;
    }

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) { tokens.push({ t: 'h', level: h[1].length, text: h[2].trim() }); i++; continue; }

    const img = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (img) { tokens.push({ t: 'image', alt: img[1], src: img[2] }); i++; continue; }

    if (trimmed.startsWith('> ')) { tokens.push({ t: 'quote', text: trimmed.slice(2).trim() }); i++; continue; }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++;
      }
      tokens.push({ t: 'ul', items });
      continue;
    }

    if (isCaps(trimmed)) { tokens.push({ t: 'caps', text: trimmed }); i++; continue; }

    tokens.push({ t: 'p', text: trimmed });
    i++;
  }
  return tokens;
}
