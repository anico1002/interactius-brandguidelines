import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';

const DEFAULT_IMG = '/presentaciones/clients.png';

/* Brand page (ref p.41): client logo wall. The image already includes the category labels,
   so it is placed contained within the margins. Image overridable from the markdown. */
export function Clients({ slide, page }: { slide: Extract<Slide, { kind: 'clients' }>; page: number }) {
  return (
    <div className="frame theme-light clients">
      <Chrome page={page} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logos" src={slide.image?.src ?? DEFAULT_IMG} alt={slide.image?.alt ?? 'Clientes de Interactius'} />
    </div>
  );
}
