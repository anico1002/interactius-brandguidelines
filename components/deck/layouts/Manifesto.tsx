import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

const DEFAULT_TITLE = (
  <>Ayudamos a las organizaciones en momentos de <span className="emph">/ transformación /</span> a decidir con criterio.</>
);
const DEFAULT_SUB = 'Convertimos la estrategia en soluciones que perduran.';

/* Brand page (ref p.10): centred serif manifesto. Content is editable from the markdown.
   The canonical copy is an all-or-nothing fallback: it only fills an EMPTY block; once the
   user writes anything, we render exactly what they wrote (no default leaking into the gaps). */
export function Manifesto({ slide, page }: { slide: Extract<Slide, { kind: 'manifesto' }>; page: number }) {
  const empty = !slide.title && !slide.subtitle;
  const subtitle = slide.subtitle ?? (empty ? DEFAULT_SUB : null);
  return (
    <div className="frame theme-light manifesto">
      <Chrome page={page} />
      <div className="wrap">
        <h2>{slide.title ? inline(slide.title) : empty ? DEFAULT_TITLE : null}</h2>
        {subtitle && <p className="sub">{inline(subtitle)}</p>}
      </div>
    </div>
  );
}
