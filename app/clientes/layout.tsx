/* Layout del segmento /clientes (Deliv_r). Anidado bajo el layout raíz, que ya pone <html>,
   las fuentes y globals.css. Aquí: el envoltorio con los estilos propios y los metadatos de
   privacidad, que cubren TODO el segmento, la 404 incluida (un not-found.tsx no exporta metadatos).

   Título genérico: no revela qué hay dentro antes del login. `referrer: same-origin` y no
   `no-referrer`: con no-referrer Chrome envía `Origin: null` en el POST del login y el control
   de CSRF lo rechaza. El middleware pone además las cabeceras equivalentes. */

import type { Metadata } from 'next';

import '@/components/deliv/deliv.css';

export const metadata: Metadata = {
  title: 'Interactius · Área de clientes',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'same-origin',
};

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  return <div className="deliv-cliente">{children}</div>;
}
