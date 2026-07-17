import type { Slide, RichNode } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

const DEFAULT_PARAS = [
  '**En el centro no pasa nada nuevo**. Es previsible, cómodo y hoy, la forma más rápida de volverse irrelevante.',
  'Por eso decidimos operar en los márgenes, lo ambiguo, lo incierto. Ahí están las verdades humanas. Y ahí decidimos quedarnos.',
  'Trabajamos desde ese **espacio liminal**, entre lo que es y lo que está por venir. Lo hacemos cuestionando lo evidente y desplazando el foco, con criterio y perspectiva humana.',
  '**No encajamos en etiquetas ni vestimos de ellas.**',
  'Somos un **compañero**: cercano, implicado y enfocado en lo que realmente importa. Trabajamos con rigor, naturalidad y criterio.',
];
const DEFAULT_FLOW: RichNode[] = DEFAULT_PARAS.map((text) => ({ t: 'p', text }));
const DEFAULT_IMG = '/presentaciones/team.png';

/* Brand page (ref p.11): the tribe — free-form voice copy left, portrait right. The text column
   renders an ordered rich flow (paragraphs, lists, quotes, sub-headings, eyebrows) so every
   markdown formatting element is supported, with inline **negrita** / énfasis everywhere.
   Falls back to the canonical copy when the block is empty. */
export function Team({ slide, page }: { slide: Extract<Slide, { kind: 'team' }>; page: number }) {
  const flow = slide.content?.length ? slide.content : DEFAULT_FLOW;
  return (
    <div className="frame theme-light team">
      <Chrome page={page} />
      <div className="txt">
        {flow.map((node, i) => {
          switch (node.t) {
            case 'p':
              return <p key={i}>{inline(node.text)}</p>;
            case 'caps':
              return <div key={i} className="eyebrow">{inline(node.text)}</div>;
            case 'h':
              return <h3 key={i} className="th">{inline(node.text)}</h3>;
            case 'quote':
              return <blockquote key={i} className="quote">{inline(node.text)}</blockquote>;
            case 'ul':
              return (
                <ul key={i} className="list">
                  {node.items.map((it, k) => (
                    <li key={k}>
                      <span className="dia">◆</span>
                      <span className="body">{inline(it)}</span>
                    </li>
                  ))}
                </ul>
              );
          }
        })}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="grid" src={slide.image?.src ?? DEFAULT_IMG} alt={slide.image?.alt ?? 'Equipo Interactius'} />
    </div>
  );
}
