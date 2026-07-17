import { colors } from './ui';

const MONO = 'var(--font-ibm-plex-mono, monospace)';

/* DeckMakr wordmark. Inline SVG so it renders with the page's loaded IBM Plex
   Mono 700 instead of an external @import, and uses the brand cursor accent
   (brick). Background rect and brackets dropped — plain wordmark on the host
   chrome (already warm-light). */
export function DeckLogo({ height = 30, title = 'DeckMakr' }: { height?: number; title?: string }) {
  return (
    <svg
      viewBox="0 0 250 80"
      height={height}
      width={(height * 250) / 80}
      role="img"
      aria-label={title}
      style={{ display: 'block' }}
    >
      <text x="0" y="49" fontFamily={MONO} fontWeight={700} fill={colors.dark} fontSize="40" letterSpacing="0.05em">
        DeckMak<tspan fill={colors.brick}>_</tspan>r
      </text>
    </svg>
  );
}
