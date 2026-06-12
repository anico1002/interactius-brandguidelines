import type { Accent, GanttRow } from './types.ts';

const ACCENTS: Accent[] = ['opal', 'bordeaux', 'emerald'];

export function parseGantt(body: string): { weeks: number; rows: GanttRow[]; milestones: number[] } {
  let weeks = 8;
  const rows: GanttRow[] = [];
  let milestones: number[] = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const [keyPart, valPart] = splitOnce(line, ':');
    const key = keyPart.trim().toLowerCase();
    const val = (valPart ?? '').trim();
    if (key === 'semanas') { weeks = parseInt(val, 10) || weeks; continue; }
    if (key.startsWith('hitos')) {
      milestones = val.split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
      continue;
    }
    const [start, end] = parseRange(val);
    rows.push({ label: keyPart.trim(), start, end, accent: ACCENTS[rows.length % ACCENTS.length] });
  }
  return { weeks, rows, milestones };
}

function splitOnce(s: string, sep: string): [string, string | undefined] {
  const idx = s.indexOf(sep);
  return idx === -1 ? [s, undefined] : [s.slice(0, idx), s.slice(idx + 1)];
}

function parseRange(v: string): [number, number] {
  const m = v.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const n = parseInt(v, 10) || 1;
  return [n, n];
}
