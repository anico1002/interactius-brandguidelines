import type { Slide } from '@/lib/deck/types';
import { inline } from '../inline';

/* Authors write the URL bare (`www.interactius.com`), which an href would resolve as a relative
   path. Prefix a scheme unless one is already there. */
const href = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

export function Closing({ slide }: { slide: Extract<Slide, { kind: 'closing' }> }) {
  return (
    <div className={`frame theme-${slide.theme} closing`}>
      <div className="wm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/interactius-negativo.svg" alt="interactīus" />
      </div>
      <h2>{inline(slide.title)}</h2>
      {slide.url && (
        <a className="url" href={href(slide.url)} target="_blank" rel="noopener noreferrer">
          {slide.url}
        </a>
      )}
    </div>
  );
}
