'use client';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

/* Liquid text: shrink a text block until it fits a fixed vertical space, so no slide breaks when
   the copy runs longer than today's. The deck's canvas is always 1280×720, so fitting to a box is
   deterministic — the same text always resolves to the same scale.

   Measures the natural height, then applies one uniform transform:scale (origin top-left, so the
   block stays anchored where it sits). Scale, not font-size: it needs no iteration and can't reflow
   into a taller box mid-fit.

   No floor: the rule is that a slide never overflows, whatever the copy, so scale is always exactly
   maxHeight/natural when it would overflow. Realistic copy (up to ~2.5× today's) stays readable;
   copy long enough to shrink further is rare and still never breaks the layout. A soft warning when
   it shrinks a lot belongs in the editor (deckWarnings), not here.

   `centerTop`: when set, the block is vertically centred in the band [centerTop, centerTop+maxHeight]
   instead of sitting at a fixed top. Balances the margins at any length — short copy no longer hugs
   the top with an empty foot, long copy no longer bottom-weights. Position and scale resolve in the
   one measure, so flex + transform never fight. Requires the element to be position:absolute. */
export function FitText({
  maxHeight,
  centerTop,
  className,
  children,
}: {
  maxHeight: number;
  centerTop?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'none';
    const natural = el.scrollHeight;
    const scale = Math.min(1, maxHeight / natural);
    el.style.transformOrigin = 'top left';
    el.style.transform = `scale(${scale})`;
    if (centerTop != null) {
      const effective = natural * scale;
      el.style.top = `${centerTop + (maxHeight - effective) / 2}px`;
    }
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
