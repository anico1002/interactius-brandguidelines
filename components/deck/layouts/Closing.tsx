import type { Slide } from '@/lib/deck/types';
import { inline } from '../inline';

export function Closing({ slide }: { slide: Extract<Slide, { kind: 'closing' }> }) {
  return (
    <div className={`frame theme-${slide.theme} closing`}>
      <div className="wm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/interactius-negativo.svg" alt="interactīus" />
      </div>
      <h2>{inline(slide.title)}</h2>
      {slide.url && <div className="url">{slide.url}</div>}
    </div>
  );
}
