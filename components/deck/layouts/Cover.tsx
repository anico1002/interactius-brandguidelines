'use client';
import { useContext } from 'react';
import type { Slide } from '@/lib/deck/types';
import { ImageSlot } from '../ImageSlot';
import { ClientLogoContext } from '../viewer';
import { inline } from '../inline';
import { typesetHeadline } from '@/lib/deck/typeset';

/* The measure steps with the headline instead of being fixed. A long title in a narrow box stacks
   into five lines with half the slide empty beside it; a short one across a wide box stops reading
   as a block anchored left. Two steps hold every title on record (25–79 characters) at two or
   three lines — see .lockup in deck.css for the widths. Counted in characters, so the deck stays
   deterministic: no measuring, no reflow, same markdown same result. */
const SHORT_TITLE = 40;

export function Cover({ slide, page }: { slide: Extract<Slide, { kind: 'cover' }>; page: number }) {
  const clientLogo = useContext(ClientLogoContext);
  const measure = slide.title.length > SHORT_TITLE ? 'long' : 'short';
  return (
    <div className={`frame theme-${slide.theme} cover`}>
      <ImageSlot image={slide.image} className="photo" slideIndex={page - 1} />
      <div className="scrim" />
      <div className="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/interactius-negativo.svg" alt="interactīus" />
      </div>
      {/* Bottom lockup as a single flow, anchored at the bottom: title, subtitle and the client logo
          (or the name chip) stack with one equal gap, so the logo's height pushes the text up and the
          spacing between the three stays uniform whatever the logo's proportions. */}
      <div className="lockup" data-measure={measure}>
        <h1>{inline(typesetHeadline(slide.title))}</h1>
        {slide.subtitle && <div className="sub">{inline(slide.subtitle)}</div>}
        {/* The client's uploaded logo stands in for the name chip; without one, the name as before.
            Third-party SVG, so it stays an <img src> and is never inlined. */}
        {clientLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="clientlogo" src={clientLogo} alt={slide.client ?? 'Cliente'} />
        ) : (
          (slide.footer || slide.client) && (
            <div className="foot">
              {slide.footer && inline(slide.footer)}
              {slide.footer && slide.client && ' · '}
              {slide.client && <b>{inline(slide.client)}</b>}
            </div>
          )
        )}
      </div>
    </div>
  );
}
