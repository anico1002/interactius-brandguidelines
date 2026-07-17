import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

export function Bullets({ slide, page }: { slide: Extract<Slide, { kind: 'bullets' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} bullets`}>
      <Chrome page={page} />
      <div className="title">{inline(slide.title)}</div>
      <div className="list">
        {slide.items.map((item, i) => (
          <div className="item" key={i}>
            <div className="dia">◆</div>
            <div className="body">{inline(item)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
