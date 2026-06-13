import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';

/* Ref slides 31 (long, >150 chars) / 32 (short, <150 chars): CONTEXTO eyebrow + serif text. */
export function Contexto({ slide, page }: { slide: Extract<Slide, { kind: 'contexto' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} contexto ${slide.long ? 'long' : 'short'}`}>
      <Chrome page={page} />
      <div className="wrap">
        <div className="eyebrow">Contexto</div>
        <p>{slide.body}</p>
      </div>
    </div>
  );
}
