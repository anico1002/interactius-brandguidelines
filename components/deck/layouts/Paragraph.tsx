import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

export function Paragraph({ slide, page }: { slide: Extract<Slide, { kind: 'paragraph' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} paragraph`}>
      <Chrome page={page} />
      <div className="wrap">
        {slide.eyebrow && <div className="eyebrow">{inline(slide.eyebrow)}</div>}
        {slide.body.map((p, i) => (
          <p key={i}>{inline(p)}</p>
        ))}
      </div>
    </div>
  );
}
