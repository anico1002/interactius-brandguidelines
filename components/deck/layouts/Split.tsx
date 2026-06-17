import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { ImageSlot } from '../ImageSlot';
import { inline } from '../inline';

export function Split({ slide, page }: { slide: Extract<Slide, { kind: 'split' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} split${slide.imageSide === 'left' ? ' img-left' : ''}`}>
      <Chrome page={page} />
      <ImageSlot image={slide.image} className="photo" slideIndex={page - 1} />
      <div className="txt">
        {slide.eyebrow && <div className="eyebrow">{inline(slide.eyebrow)}</div>}
        <h2>{inline(slide.title)}</h2>
        {slide.body && <div className="body">{inline(slide.body)}</div>}
      </div>
    </div>
  );
}
