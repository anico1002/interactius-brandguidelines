import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';
import { Flow } from '../Flow';

export function Paragraph({ slide, page }: { slide: Extract<Slide, { kind: 'paragraph' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} paragraph`}>
      <Chrome page={page} />
      <div className="wrap">
        {slide.eyebrow && <div className="eyebrow">{inline(slide.eyebrow)}</div>}
        <Flow nodes={slide.body} />
      </div>
    </div>
  );
}
