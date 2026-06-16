export type Theme = 'dark' | 'light';
export type Accent = 'opal' | 'bordeaux' | 'emerald';

export type ImageRef = { src?: string; alt?: string; prompt?: string };
export type GanttRow = { label: string; start: number; end: number; accent: Accent };
export type Column = { label: string; heading: string; body: string };
export type Phase = { name: string; body: string; items: string[] };
export type BudgetItem = { label: string; amount: string };

export type Slide =
  | { kind: 'cover'; theme: Theme; title: string; subtitle?: string; eyebrow?: string; client?: string; image?: ImageRef; footer?: string }
  | { kind: 'statement'; theme: Theme; eyebrow?: string; title: string }
  | { kind: 'bullets'; theme: Theme; title: string; items: string[] }
  | { kind: 'columns'; theme: Theme; title: string; columns: Column[] }
  | { kind: 'split'; theme: Theme; eyebrow?: string; title: string; body?: string; image?: ImageRef }
  | { kind: 'gantt'; theme: Theme; title: string; subtitle?: string; weeks: number; rows: GanttRow[]; milestones: number[]; note?: string }
  | { kind: 'paragraph'; theme: Theme; eyebrow?: string; body: string }
  | { kind: 'closing'; theme: Theme; title: string; url?: string }
  // Fixed brand pages (auto-inserted for commercial proposals; content is boilerplate).
  | { kind: 'manifesto'; theme: Theme }
  | { kind: 'team'; theme: Theme }
  | { kind: 'clients'; theme: Theme }
  | { kind: 'budget'; theme: Theme; items: BudgetItem[]; total: string; conditions: string[] }
  | { kind: 'acceptance'; theme: Theme }
  // Keyword-mapped commercial sections (ref slides 22/29/31/32/35)
  | { kind: 'contexto'; theme: Theme; body: string; long: boolean }
  | { kind: 'elreto'; theme: Theme; title: string; image?: ImageRef }
  | { kind: 'objetivos'; theme: Theme; title: string; items: string[]; image?: ImageRef }
  | { kind: 'roadmapPhases'; theme: Theme; title: string; subtitle?: string; phases: Phase[] };

export type DeckType = 'comercial' | 'informe' | 'generica';

export type SlideKind = Slide['kind'];
/* `provenance[i]` is the source-block index that produced slide i, or null when the
   slide was injected by compileDeck (manifesto/team/clients/acceptance). */
export type Deck = { slides: Slide[]; provenance?: (number | null)[] };

// Intermediate produced by parse.ts, consumed by classify.ts
export type Token =
  | { t: 'h'; level: number; text: string }
  | { t: 'caps'; text: string }
  | { t: 'p'; text: string }
  | { t: 'quote'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'image'; alt: string; src: string }
  | { t: 'fence'; lang: string; body: string };

export type SlideSource = { tokens: Token[]; index: number };
