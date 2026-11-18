/* Pantallas sueltas de la zona de clientes (login y avisos). Estilos en components/deliv/deliv.css. */

/** Contenedor centrado con la firma de Interactius. */
export function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="dc-marco">
      <main>
        <div className="dc-marca">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img src="/logo/isotipo-positivo.svg" alt="interactius" />
          <span>Área de clientes</span>
        </div>
        {children}
      </main>
      <footer className="dc-pie">©2012–{new Date().getFullYear()} Interactius · Actitud Liminal</footer>
    </div>
  );
}

/** Título de pantalla en Plex Serif 300. */
export function TituloMarco({ children }: { children: React.ReactNode }) {
  return <h1 className="dc-titulo">{children}</h1>;
}
