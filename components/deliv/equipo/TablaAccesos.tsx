'use client';
import { Accion } from './Cabecera';

export interface FilaAcceso {
  email: string;
  por: string;
  cuando: string;
  ultimo: string;
}

/* Persona · dado por · cuándo · último acceso · Revocar. La fila desaparece sin recargar (detalle 9). */
export function TablaAccesos({
  accesos, ocupado, onRevocar,
}: { accesos: FilaAcceso[]; ocupado: string | null; onRevocar: (email: string) => void }) {
  if (!accesos.length) {
    return <p className="dq-nota">Nadie tiene acceso todavía. Da acceso a una persona con su correo.</p>;
  }
  return (
    <div className="dq-tabla">
      <table>
        <thead>
          <tr><th>Persona</th><th>Dado por</th><th>Cuándo</th><th>Último acceso</th><th /></tr>
        </thead>
        <tbody>
          {accesos.map((a) => (
            <tr key={a.email}>
              <td>{a.email}</td>
              <td className="dq-suave">{a.por}</td>
              <td>{a.cuando}</td>
              <td>{a.ultimo}</td>
              <td>
                <Accion s peligro disabled={ocupado === a.email} onClick={() => onRevocar(a.email)}>Revocar</Accion>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
