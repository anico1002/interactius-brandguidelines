'use client';
import { useState } from 'react';
import { Accion } from './Cabecera';

/* «Borrar artefacto»: hay que escribir el título para confirmar (prototipo, detalle 10). */
export function ConfirmarBorrado({
  titulo, personas, sinAccesos, ocupado, error, onBorrar,
}: {
  titulo: string;
  personas: number;
  /** Subida a medias: no hay accesos que mencionar. */
  sinAccesos?: boolean;
  ocupado: boolean;
  error: string | null;
  onBorrar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [escrito, setEscrito] = useState('');
  const coincide = escrito.trim() === titulo;

  return (
    <>
      <div className="dq-acts">
        <Accion peligro onClick={() => setAbierto(true)}>Borrar artefacto</Accion>
      </div>
      {abierto && (
        <div className="dq-borrar">
          <p>
            {sinAccesos
              ? 'Se borrarán los archivos subidos.'
              : `Se borrarán el archivo y ${personas === 1 ? 'el acceso de 1 persona' : `los ${personas} accesos`}.`}{' '}
            No se puede deshacer. Escribe el título para confirmar.
          </p>
          <div className="dq-nota" style={{ marginTop: 0 }}>{titulo}</div>
          <input
            className="dc-input"
            autoComplete="off"
            aria-label="Título para confirmar"
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
          />
          {error && <p className="dc-error" role="alert">{error}</p>}
          <div className="dq-acts">
            <Accion peligro disabled={!coincide || ocupado} onClick={onBorrar}>
              {ocupado ? 'Borrando' : 'Borrar definitivamente'}
            </Accion>
            <Accion onClick={() => { setAbierto(false); setEscrito(''); }}>Cancelar</Accion>
          </div>
        </div>
      )}
    </>
  );
}
