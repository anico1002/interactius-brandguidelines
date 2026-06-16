import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // seconds (Netlify function budget for the translation call)

const LANGS: Record<string, string> = {
  es: 'Spanish (castellano)',
  ca: 'Catalan (català)',
  en: 'English',
};

function systemPrompt(lang: string): string {
  return `You translate the user-visible text of a Markdown slide deck to ${lang}.
Output ONLY the translated Markdown — no preamble, no commentary, and do not wrap the whole document in a code fence.

Preserve the document EXACTLY otherwise:
- Keep every line break, blank line and the \`---\` slide separators.
- Keep all Markdown syntax: #, ##, ###, "- " lists, "> " quotes, **bold**, and fenced \`\`\` blocks.
- NEVER translate or alter a line that starts with \`[ly:\` — copy it verbatim (it is a layout marker).
- Keep these tokens verbatim (do not translate them): the literal word \`cliente\` in a \`> cliente: …\` line, and the literal word \`hitos\` in a gantt line.
- Keep verbatim: URLs, e-mails, file paths, numbers, currency amounts, and proper nouns / brand names (e.g. Interactius) and person/company names.

Translate everything else into ${lang}: titles, eyebrows (UPPERCASE lines), paragraphs, list items, "Label: value" labels, the \`### Condiciones\` heading, and the unit word on a gantt axis line (e.g. \`semanas:\` → its ${lang} equivalent). Keep the translation natural and professional; never add or remove content.`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Falta ANTHROPIC_API_KEY en el servidor' }, { status: 500 });
  }

  let body: { md?: string; target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const md = body.md ?? '';
  const lang = LANGS[body.target ?? ''];
  if (!md.trim()) return NextResponse.json({ error: 'md vacío' }, { status: 400 });
  if (!lang) return NextResponse.json({ error: 'target inválido (es|ca|en)' }, { status: 400 });

  const client = new Anthropic({ apiKey });
  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      system: systemPrompt(lang),
      messages: [{ role: 'user', content: md }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    if (!text.trim()) return NextResponse.json({ error: 'Traducción vacía' }, { status: 502 });
    return NextResponse.json({ md: text }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude API: ${e.message}` }, { status: e.status ?? 502 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error de traducción' }, { status: 500 });
  }
}
