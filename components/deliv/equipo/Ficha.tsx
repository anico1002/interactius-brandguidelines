'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Enlace } from './Cabecera';
import { enviar, useOrigen } from './api';
import { ConfirmarBorrado } from './ConfirmarBorrado';
import { CopiarEnlace } from './CopiarEnlace';
import { DarAcceso } from './DarAcceso';
import { TablaAccesos, type FilaAcceso } from './TablaAccesos';
import { Titulo } from './Titulo';

export interface DatosFicha {
  id: string;
  titulo: string;
  clienteNombre: string;
  tipo: string;
  estado: string;
  version: number;
  publicado: string;
  /** Relativo: /clientes/<cliente>/<public_id>. */
  enlace: string;
}

/* La ficha de un artefacto: enlace, accesos, sustituir y borrar. Pantalla única, sin editor. */
export function Ficha({ datos, accesos }: { datos: DatosFicha; accesos: FilaAcceso[] }) {
  const router = useRouter();
  const origen = useOrigen();
  const [revocados, setRevocados] = useState<string[]>([]);
  const [revocando, setRevocando] = useState<string | null>(null);
  const [errorRevocar, setErrorRevocar] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);

  /* Tras router.refresh() llega la lista del servidor: lo revocado en local ya no hace falta. */
  useEffect(() => { setRevocados([]); }, [accesos]);

  const visibles = accesos.filter((a) => !revocados.includes(a.email));
  const url = `${origen}${datos.enlace}`;

  const revocar = async (email: string) => {
    setRevocando(email);
    setErrorRevocar(null);
    const r = await enviar(
      `/api/deliv_r/artefactos/${datos.id}/accesos/${encodeURIComponent(email)}`,
      'DELETE',
    );
    setRevocando(null);
    if (!r.ok) {
      setErrorRevocar(r.mensaje);
      return;
    }
    setRevocados((l) => [...l, email]);
    router.refresh();
  };

  const borrar = async () => {
    setBorrando(true);
    setErrorBorrar(null);
    const r = await enviar(`/api/deliv_r/artefactos/${datos.id}`, 'DELETE');
    if (!r.ok) {
      setBorrando(false);
      setErrorBorrar(r.mensaje);
      return;
    }
    router.push('/workspace/deliv_r');
    router.refresh();
  };

  if (datos.estado !== 'publicado') {
    return (
      <main className="dq-ws dq-ws--ficha">
        <div className="dq-volver"><Enlace s href="/workspace/deliv_r">Volver a la galería</Enlace></div>
        <div className="dq-eyebrow">{datos.clienteNombre} · {datos.tipo.toUpperCase()} · Subiendo</div>
        <h1 className="dq-h1">{datos.titulo}</h1>
        <p className="dq-nota">La subida no llegó a publicarse. Bórrala para no dejar archivos sueltos.</p>
        <div className="dq-bloque">
          <h2>Borrar</h2>
          <ConfirmarBorrado titulo={datos.titulo} personas={0} sinAccesos ocupado={borrando} error={errorBorrar} onBorrar={borrar} />
        </div>
      </main>
    );
  }

  return (
    <main className="dq-ws dq-ws--ficha">
      <div className="dq-volver"><Enlace s href="/workspace/deliv_r">Volver a la galería</Enlace></div>
      <div className="dq-eyebrow">
        {datos.clienteNombre} · {datos.tipo.toUpperCase()} · versión {datos.version} · publicado {datos.publicado}
      </div>
      <Titulo artefactoId={datos.id} titulo={datos.titulo} />

      <div className="dq-bloque" style={{ marginTop: 28 }}>
        <div className="dq-enlace">
          <div className="dq-caja" title={url}>{url}</div>
          <CopiarEnlace texto={url} />
          <Enlace href={datos.enlace} blank>Ver</Enlace>
        </div>
      </div>

      <div className="dq-bloque">
        <h2>Dar acceso</h2>
        <DarAcceso artefactoId={datos.id} personas={visibles.map((a) => a.email)} />
      </div>

      <div className="dq-bloque">
        <h2>Accesos · {visibles.length}</h2>
        {errorRevocar && <p className="dc-error dq-error" role="alert">{errorRevocar}</p>}
        <TablaAccesos accesos={visibles} ocupado={revocando} onRevocar={revocar} />
      </div>

      <div className="dq-bloque">
        <h2>Archivo</h2>
        <div className="dq-acts">
          <Enlace href={`/workspace/deliv_r/nuevo?id=${datos.id}`}>Sustituir archivo</Enlace>
        </div>
        <p className="dq-nota">
          El enlace no cambia. Las personas con acceso ven la versión nueva en su siguiente carga.
        </p>
      </div>

      <div className="dq-bloque">
        <h2>Borrar</h2>
        <ConfirmarBorrado
          titulo={datos.titulo}
          personas={visibles.length}
          ocupado={borrando}
          error={errorBorrar}
          onBorrar={borrar}
        />
      </div>
    </main>
  );
}
