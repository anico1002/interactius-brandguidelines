import type { SlideKind, Theme } from './types.ts';

const DARK_BY_ROLE: SlideKind[] = ['cover', 'statement', 'closing'];

export function themeFor(kind: SlideKind, override: Theme | undefined): Theme {
  if (override) return override;
  return DARK_BY_ROLE.includes(kind) ? 'dark' : 'light';
}
