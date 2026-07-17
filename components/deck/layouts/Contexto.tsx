import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';
import { Flow } from '../Flow';
import { FitText } from '../FitText';

/* Ref slides 31 (long, >150 chars) / 32 (short, <150 chars): CONTEXTO eyebrow + serif text.
   The group is centred vertically in the 64–656 band, so it stays balanced at any length instead of
   hugging the top; FitText shrinks it only past the band height (592). */
export function Contexto({ slide, page }: { slide: Extract<Slide, { kind: 'contexto' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} contexto ${slide.long ? 'long' : 'short'}`}>
      <Chrome page={page} />
      <FitText className="wrap" maxHeight={592} centerTop={64}>
        <div className="eyebrow">{inline(slide.eyebrow ?? 'Contexto')}</div>
        <Flow nodes={slide.body} />
      </FitText>
    </div>
  );
}
