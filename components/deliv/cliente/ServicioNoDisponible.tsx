import { Marco, TituloMarco } from './Marco';

/** Fail-closed: sin secretos o con la infraestructura caída, nadie entra. */
export function ServicioNoDisponible() {
  return (
    <Marco>
      <TituloMarco>Servicio no disponible.</TituloMarco>
      <p className="dc-lead">Inténtalo de nuevo en unos minutos.</p>
    </Marco>
  );
}
