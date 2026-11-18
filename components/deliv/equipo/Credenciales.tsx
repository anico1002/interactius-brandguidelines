'use client';
import { Accion } from './Cabecera';
import { CopiarEnlace } from './CopiarEnlace';

/* Recuadro con las credenciales: se muestran una sola vez (prototipo, detalles 8 y 11). */
export function Credenciales({
  titulo, filas, nota, copia, onCerrar,
}: {
  titulo: string;
  filas: { k: string; v: string; pw?: boolean }[];
  nota: string;
  /** Lo que copia «Copiar datos». */
  copia: string;
  onCerrar: () => void;
}) {
  return (
    <div className="dq-creds" role="status">
      <div className="dq-eyebrow" style={{ marginBottom: 10 }}>{titulo}</div>
      <dl>
        {filas.map((f) => (
          <div key={f.k} style={{ display: 'contents' }}>
            <dt>{f.k}</dt>
            <dd className={f.pw ? 'dq-pw' : undefined}>{f.v}</dd>
          </div>
        ))}
      </dl>
      <div className="dq-nota">{nota}</div>
      <div className="dq-acts">
        <CopiarEnlace texto={copia} etiqueta="Copiar datos" />
        <Accion onClick={onCerrar}>Cerrar</Accion>
      </div>
    </div>
  );
}
