export type Theme = 'dark' | 'light';
export type Accent = 'opal' | 'bordeaux' | 'emerald';

export type ImageRef = { src?: string; alt?: string; prompt?: string };
export type GanttRow = { label: string; start: number; end: number; accent: Accent };
export type Column = { label: string; heading: string; body: string };
export type Phase = { name: string; body: string; items: string[] };
export type BudgetItem = { label: string; amount: string };
export type Signer = { name?: string; role?: string; company?: string; nif?: string; address?: string };

/* An ordered rich-text flow: paragraphs, lists, quotes, sub-headings and eyebrows kept in
   document order, each supporting inline formatting. Used where a layout renders free-form
   markdown (the team text column). */
export type RichNode =
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'quote'; text: string }
  | { t: 'h'; level: number; text: string }
  | { t: 'caps'; text: string };

export type Slide =
  | { kind: 'cover'; theme: Theme; title: string; subtitle?: string; eyebrow?: string; client?: string; image?: ImageRef; footer?: string }
  | { kind: 'statement'; theme: Theme; eyebrow?: string; title: string }
  | { kind: 'bullets'; theme: Theme; title: string; items: string[] }
  | { kind: 'columns'; theme: Theme; title: string; columns: Column[] }
  | { kind: 'split'; theme: Theme; eyebrow?: string; title: string; body?: string; image?: ImageRef; imageSide?: 'left' | 'right' }
  | { kind: 'gantt'; theme: Theme; title: string; subtitle?: string; weeks: number; unit?: string; rows: GanttRow[]; milestones: number[]; milestoneLabel?: string; note?: string }
  | { kind: 'paragraph'; theme: Theme; eyebrow?: string; body: string }
  | { kind: 'closing'; theme: Theme; title: string; url?: string }
  // Brand pages: content is editable from the markdown; missing fields fall back to defaults.
  | { kind: 'manifesto'; theme: Theme; title?: string; subtitle?: string }
  | { kind: 'team'; theme: Theme; content?: RichNode[]; image?: ImageRef }
  | { kind: 'clients'; theme: Theme; image?: ImageRef }
  | { kind: 'budget'; theme: Theme; title?: string; items: BudgetItem[]; total: string; conditions: string[]; conditionsLabel?: string }
  | { kind: 'acceptance'; theme: Theme; title?: string; signer?: Signer; note?: string; cta?: string; signatureImage?: ImageRef }
  // Keyword-mapped commercial sections (ref slides 22/29/31/32/35)
  | { kind: 'contexto'; theme: Theme; eyebrow?: string; body: string; long: boolean }
  | { kind: 'elreto'; theme: Theme; eyebrow?: string; title: string; image?: ImageRef }
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
  | { t: 'fence'; lang: string; body: string }
  | { t: 'layout'; name: string };

export type SlideSource = { tokens: Token[]; index: number };
