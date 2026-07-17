'use client';
import type { CSSProperties } from 'react';
import type { Slide } from '@/lib/deck/types';
import { renderSlide } from '../DeckRenderer';
import { ViewerContext } from '../viewer';

/* A faithful miniature of a single slide: a one-slide `.ix-deck` with a small `--s`,
   reusing the exact same render + scaling mechanism as the preview (deck.css). */
export function SlideThumb({ slide, page, width }: { slide: Slide; page: number; width: number }) {
  const s = width / 1280;
  // Override the base .ix-deck (height:100vh; overflow:auto) so the thumb is just one slide.
  const style = { ['--s']: s, width, height: Math.round(720 * s), overflow: 'hidden' } as CSSProperties;
  return (
    <ViewerContext.Provider value={true}>
      <div className="ix-deck" style={style}>
        <section className="slide">
          <div className="fwrap">{renderSlide(slide, page)}</div>
        </section>
      </div>
    </ViewerContext.Provider>
  );
}
