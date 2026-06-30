import type { Slide } from '@/lib/deck/types';
import { ImageSlot } from '../ImageSlot';
import { inline } from '../inline';

export function Cover({ slide, page }: { slide: Extract<Slide, { kind: 'cover' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} cover`}>
      <ImageSlot image={slide.image} className="photo" slideIndex={page - 1} />
      <div className="scrim" />
      <div className="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/interactius-negativo.svg" alt="interactīus" />
      </div>
      <div className="lockup">
        <h1>{inline(slide.title)}</h1>
        {slide.subtitle && <div className="sub">{inline(slide.subtitle)}</div>}
      </div>
      {(slide.footer || slide.client) && (
        <div className="foot">
          {slide.footer && inline(slide.footer)}
          {slide.footer && slide.client && ' · '}
          {slide.client && <b>{inline(slide.client)}</b>}
        </div>
      )}
    </div>
  );
}
