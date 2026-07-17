import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { ImageSlot } from '../ImageSlot';
import { inline } from '../inline';
import { Flow } from '../Flow';
import { FitText } from '../FitText';

/* .txt sits at top:150 with a ~60px bottom safe zone on the 720 canvas. */
const TXT_MAX_H = 510;

export function Split({ slide, page }: { slide: Extract<Slide, { kind: 'split' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} split${slide.imageSide === 'left' ? ' img-left' : ''}`}>
      <Chrome page={page} />
      <ImageSlot image={slide.image} className="photo" slideIndex={page - 1} />
      <FitText className="txt" maxHeight={TXT_MAX_H}>
        {slide.eyebrow && <div className="eyebrow">{inline(slide.eyebrow)}</div>}
        <h2>{inline(slide.title)}</h2>
        {slide.body && slide.body.length > 0 && (
          <div className="body"><Flow nodes={slide.body} /></div>
        )}
      </FitText>
    </div>
  );
}
