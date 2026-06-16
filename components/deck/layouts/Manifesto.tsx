import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

const DEFAULT_TITLE = (
  <>Ayudamos a las organizaciones en momentos de <span className="emph">/ transformación /</span> a decidir con criterio.</>
);
const DEFAULT_SUB = 'Convertimos la estrategia en soluciones que perduran.';

/* Brand page (ref p.10): centred serif manifesto. Content editable from the markdown,
   falling back to the canonical copy when a field is absent. */
export function Manifesto({ slide, page }: { slide: Extract<Slide, { kind: 'manifesto' }>; page: number }) {
  return (
    <div className="frame theme-light manifesto">
      <Chrome page={page} />
      <div className="wrap">
        <h2>{slide.title ? inline(slide.title) : DEFAULT_TITLE}</h2>
        <p className="sub">{slide.subtitle ?? DEFAULT_SUB}</p>
      </div>
    </div>
  );
}
