import { BotonSalir } from '@/components/deliv/cliente/BotonSalir';
import { Marco, TituloMarco } from '@/components/deliv/cliente/Marco';

/** Misma respuesta para «no existe», «no está publicado» y «no es tuyo»: no revela qué existe. */
export default function NoTienesAcceso() {
  return (
    <Marco>
      <TituloMarco>No tienes acceso a este contenido.</TituloMarco>
      <p className="dc-lead">
        Tu usuario no tiene permiso para este enlace. Pide a Interactius que te lo dé o entra con otra
        cuenta.
      </p>
      <div className="dc-acciones">
        <BotonSalir />
      </div>
    </Marco>
  );
}
