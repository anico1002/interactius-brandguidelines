import type { Slide } from '@/lib/deck/types';
import { ImageSlot } from '../ImageSlot';

export function Cover({ slide }: { slide: Extract<Slide, { kind: 'cover' }> }) {
  return (
    <div className={`frame theme-${slide.theme} cover`}>
      <ImageSlot image={slide.image} className="photo" />
      <div className="scrim" />
      <div className="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/interactius-negativo.svg" alt="interactīus" />
      </div>
      <div className="lockup">
        <h1>{slide.title}</h1>
        {slide.subtitle && <div className="sub">{slide.subtitle}</div>}
      </div>
      {(slide.footer || slide.client) && (
        <div className="foot">
          {slide.footer ?? 'Propuesta de colaboración'}
          {slide.client && (
            <>
              {' · '}
              <b>{slide.client}</b>
            </>
          )}
        </div>
      )}
    </div>
  );
}
