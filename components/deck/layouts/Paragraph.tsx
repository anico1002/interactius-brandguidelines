import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';
import { Flow } from '../Flow';
import { FitText } from '../FitText';

/* Group centred vertically in the 64–656 band (same as contexto — the serif-body twin), balanced at
   any length; FitText shrinks it only past the band height (592). */
export function Paragraph({ slide, page }: { slide: Extract<Slide, { kind: 'paragraph' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} paragraph`}>
      <Chrome page={page} />
      <FitText className="wrap" maxHeight={592} centerTop={64}>
        {slide.eyebrow && <div className="eyebrow">{inline(slide.eyebrow)}</div>}
        <Flow nodes={slide.body} />
      </FitText>
    </div>
  );
}
