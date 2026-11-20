import { NextResponse, type NextRequest } from 'next/server';

import { evalText } from '@/lib/eval';

export const dynamic = 'force-dynamic';

const DOCS = {
  endpoint: '/api/eval',
  methods: ['GET', 'POST'],
  GET: 'Returns this documentation block.',
  POST: {
    body: { text: 'string (required) — the copy to evaluate', type: 'string (optional) — "copy" | "headline" | "lead" — currently informational only' },
    returns: {
      score: '0..100 — 100 minus 10 per violation, floored at 0',
      violations: 'array of { rule, ... }',
      sentenceCount: 'number',
      wordCount: 'number',
      hardFail: 'boolean — kept for compatibility; always false since 2026-11-20 (no non-negotiable rules)',
    },
    rules: {
      'length:under_min': 'Sentence shorter than tokens.sentenceLength.min (15 words).',
      'length:over_max': 'Sentence longer than tokens.sentenceLength.max (22 words).',
      'punctuation:exclamation': 'Use of ¡ or ! — advisable to avoid, not strict.',
    },
    example: {
      request: { text: '¡Diseñamos soluciones para empresas!' },
      response: { score: 80, hardFail: false, violations: [{ rule: 'length:under_min', sentence: 1, count: 4, limit: 15 }, { rule: 'punctuation:exclamation', index: 0 }] },
    },
  },
};

export function GET() {
  return NextResponse.json(DOCS, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body. Expecting { text: string }.' },
      { status: 400 },
    );
  }

  const text =
    typeof body === 'object' && body !== null && 'text' in body && typeof (body as { text: unknown }).text === 'string'
      ? (body as { text: string }).text
      : null;

  if (text === null) {
    return NextResponse.json(
      { error: 'Missing required field "text" (string).' },
      { status: 400 },
    );
  }

  const result = evalText(text);

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
