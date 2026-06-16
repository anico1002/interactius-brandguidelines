import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

const DEFAULT_PARAS = [
  'En el centro no pasa nada nuevo. Es previsible, cómodo y hoy, la forma más rápida de volverse irrelevante.',
  'Por eso decidimos operar en los márgenes, lo ambiguo, lo incierto. Ahí están las verdades humanas. Y ahí decidimos quedarnos.',
  'Trabajamos desde ese espacio liminal, entre lo que es y lo que está por venir. Lo hacemos cuestionando lo evidente y desplazando el foco, con criterio y perspectiva humana.',
  '**No encajamos en etiquetas ni vestimos de ellas.**',
  'Somos un compañero: cercano, implicado y enfocado en lo que realmente importa. Trabajamos con rigor, naturalidad y criterio.',
];
const DEFAULT_IMG = '/presentaciones/team.png';

/* Brand page (ref p.11): the tribe — voice copy left, portrait right. Editable from the
   markdown (paragraphs + image); falls back to the canonical copy when absent. */
export function Team({ slide, page }: { slide: Extract<Slide, { kind: 'team' }>; page: number }) {
  const paras = slide.paragraphs?.length ? slide.paragraphs : DEFAULT_PARAS;
  return (
    <div className="frame theme-light team">
      <Chrome page={page} />
      <div className="txt">
        {paras.map((p, i) => (
          <p key={i}>{inline(p)}</p>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="grid" src={slide.image?.src ?? DEFAULT_IMG} alt={slide.image?.alt ?? 'Equipo Interactius'} />
    </div>
  );
}
