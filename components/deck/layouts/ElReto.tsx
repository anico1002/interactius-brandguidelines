import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { ImageSlot } from '../ImageSlot';
import { inline } from '../inline';

/* Ref slide 29: image left column + EL RETO eyebrow + serif title right. */
export function ElReto({ slide, page }: { slide: Extract<Slide, { kind: 'elreto' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} elreto`}>
      <Chrome page={page} />
      <ImageSlot image={slide.image} className="photo" slideIndex={page - 1} />
      <div className="txt">
        <div className="eyebrow">{inline(slide.eyebrow ?? 'El reto')}</div>
        <h2>{inline(slide.title)}</h2>
      </div>
    </div>
  );
}
