import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

export function Statement({ slide, page }: { slide: Extract<Slide, { kind: 'statement' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} statement`}>
      <Chrome page={page} />
      <div className="wrap">
        {slide.eyebrow && <div className="eyebrow">{inline(slide.eyebrow)}</div>}
        <h2>{inline(slide.title)}</h2>
      </div>
    </div>
  );
}
