'use client';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Deck } from '@/lib/deck/types';
import { SlideThumb } from './SlideThumb';
import { colors } from './ui';

const MONO = 'var(--font-ibm-plex-mono, monospace)';

/* Vertical slide navigator: real mini-renders, active highlight synced to the preview,
   click = scroll the preview to the slide (+ jump the editor to its source block). */
export function SlideNavigator({
  deck,
  width,
  previewRef,
  onJumpToSource,
}: {
  deck: Deck;
  width: number;
  previewRef: RefObject<HTMLDivElement | null>;
  onJumpToSource: (blockIndex: number) => void;
}) {
  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const ratios = useRef<number[]>([]);
  const thumbW = width - 30;

  // Track the slide currently in view in the preview. We keep the visibility ratio of
  // EVERY slide (the observer callback only reports the ones that changed) and mark the
  // globally most-visible one — otherwise a neighbour leaving view (low ratio, but the
  // only entry in that callback) would wrongly win and the active jumps off-by-one.
  useEffect(() => {
    const root = previewRef.current?.querySelector('.ix-deck') as HTMLElement | null;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll('[data-ix-slide]')) as HTMLElement[];
    if (!sections.length) return;
    ratios.current = new Array(deck.slides.length).fill(0);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.ixSlide);
          ratios.current[idx] = e.isIntersecting ? e.intersectionRatio : 0;
        }
        let best = -1;
        let bestRatio = 0;
        ratios.current.forEach((r, i) => {
          if (r > bestRatio) {
            bestRatio = r;
            best = i;
          }
        });
        if (best >= 0) setActive(best);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [previewRef, deck]);

  // Keep the active thumbnail visible within the strip.
  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-thumb="${active}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (i: number) => {
    const root = previewRef.current?.querySelector('.ix-deck');
    const sec = root?.querySelector(`[data-ix-slide="${i}"]`) as HTMLElement | null;
    sec?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const src = deck.provenance?.[i];
    if (src != null) onJumpToSource(src);
  };

  return (
    <div
      ref={stripRef}
      aria-label="Navegador de diapositivas"
      style={{
        width, flexShrink: 0, background: colors.dark, overflowY: 'auto', overflowX: 'hidden',
        // 1px light border (negative) to separate the dark strip from dark slides.
        borderRight: '1px solid rgba(245,242,237,.18)',
        padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}
    >
      {deck.slides.map((slide, i) => {
        const isActive = i === active;
        return (
          <button
            key={i}
            data-thumb={i}
            onClick={() => go(i)}
            title={`Diapo ${i + 1}`}
            aria-current={isActive ? 'true' : undefined}
            style={{
              appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: thumbW,
            }}
          >
            <div
              style={{
                width: thumbW, lineHeight: 0,
                outline: isActive ? `2px solid ${colors.warmLight}` : '2px solid transparent',
                outlineOffset: 2, opacity: isActive ? 1 : 0.7, transition: 'opacity .2s',
              }}
            >
              <SlideThumb slide={slide} page={i + 1} width={thumbW} />
            </div>
            <span style={{ font: `500 9px/1 ${MONO}`, letterSpacing: '.06em', color: isActive ? colors.warmLight : 'rgba(245,242,237,.5)' }}>
              {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
