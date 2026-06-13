import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { ImageSlot } from '../ImageSlot';

export function Split({ slide, page }: { slide: Extract<Slide, { kind: 'split' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} split`}>
      <Chrome page={page} />
      <ImageSlot image={slide.image} className="photo" />
      <div className="txt">
        {slide.eyebrow && <div className="eyebrow">{slide.eyebrow}</div>}
        <h2>{slide.title}</h2>
        {slide.body && <div className="body">{slide.body}</div>}
      </div>
    </div>
  );
}
