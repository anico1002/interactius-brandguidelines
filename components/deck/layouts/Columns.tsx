import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

export function Columns({ slide, page }: { slide: Extract<Slide, { kind: 'columns' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} cols`}>
      <Chrome page={page} />
      <div className="title">{inline(slide.title)}</div>
      <div className="grid">
        {slide.columns.map((col, i) => (
          <div className="col" key={i}>
            <div className="num">{col.label}</div>
            <div className="colhd">{inline(col.heading)}</div>
            <div className="colbody">{inline(col.body)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
