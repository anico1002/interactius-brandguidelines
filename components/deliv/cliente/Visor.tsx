import { BotonSalir } from './BotonSalir';
import { RecargaAlCaducar } from './RecargaAlCaducar';
import { SANDBOX_HTML } from '../sandbox';

/* El HTML del artefacto corre aislado: sandbox sin allow-same-origin (lo refuerza la CSP de la
   ruta de archivos), así que no puede leer la sesión ni actuar como el sitio. El PDF va SIN
   sandbox: Chrome no abre su visor de PDF dentro de un iframe aislado. Un PDF no ejecuta código
   del sitio, y la ruta lo sirve con nosniff y frame-ancestors 'self'. */

export type SalidaVisor =
  /** Cliente: cierra su sesión y vuelve al login del mismo enlace. */
  | { tipo: 'cliente'; volver: string }
  /** Equipo: su sesión es la de Google; vuelve a la ficha del artefacto. */
  | { tipo: 'equipo'; href: string };

export function Visor({
  titulo,
  src,
  tipo,
  expira,
  email,
  salida,
}: {
  titulo: string;
  src: string;
  tipo: 'html' | 'pdf';
  expira: number;
  email: string;
  salida: SalidaVisor;
}) {
  return (
    <div className="dc-visor">
      <header className="dc-barra">
        <span className="dc-barra__izq">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img src="/logo/isotipo-positivo.svg" alt="interactius" />
          <span className="dc-barra__sep">|</span>
          <span className="dc-barra__titulo">{titulo}</span>
        </span>
        <span className="dc-barra__der">
          <span className="dc-barra__email">{email}</span>
          {salida.tipo === 'cliente' ? (
            <BotonSalir next={salida.volver} />
          ) : (
            <a href={salida.href} className="dc-link">
              <span>Volver a la ficha</span>
            </a>
          )}
        </span>
      </header>
      {tipo === 'pdf' ? (
        <iframe src={src} title={titulo} referrerPolicy="no-referrer" className="dc-frame" />
      ) : (
        <iframe
          src={src}
          title={titulo}
          sandbox={SANDBOX_HTML}
          referrerPolicy="no-referrer"
          className="dc-frame"
        />
      )}
      <RecargaAlCaducar expira={expira} />
    </div>
  );
}
