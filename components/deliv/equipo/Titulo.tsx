'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Accion } from './Cabecera';
import { enviar } from './api';

/* El título de la ficha, editable. Cambiarlo no toca el enlace ni los accesos: el cliente ve el
   título nuevo en su siguiente carga. */
export function Titulo({ artefactoId, titulo }: { artefactoId: string; titulo: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(titulo);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abrir = () => {
    setValor(titulo);
    setError(null);
    setEditando(true);
  };

  const cancelar = () => {
    if (ocupado) return;
    setEditando(false);
    setError(null);
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    const nuevo = valor.trim();
    if (!nuevo) {
      setError('El título no puede quedar vacío.');
      return;
    }
    if (nuevo === titulo) {
      setEditando(false);
      return;
    }
    setOcupado(true);
    setError(null);
    const r = await enviar(`/api/deliv_r/artefactos/${artefactoId}`, 'PATCH', { titulo: nuevo });
    setOcupado(false);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    setEditando(false);
    router.refresh();
  };

  if (!editando) {
    return (
      <div className="dq-titulo">
        <h1 className="dq-h1">{titulo}</h1>
        <Accion s onClick={abrir}>Cambiar nombre</Accion>
      </div>
    );
  }

  return (
    <form className="dq-titulo dq-titulo--editando" onSubmit={guardar} noValidate>
      <input
        className="dc-input dq-titulo__input"
        aria-label="Nombre del artefacto"
        autoComplete="off"
        autoFocus
        maxLength={200}
        aria-invalid={error ? true : undefined}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') cancelar(); }}
      />
      <div className="dq-acts">
        <Accion type="submit" disabled={ocupado}>{ocupado ? 'Guardando' : 'Guardar'}</Accion>
        <Accion onClick={cancelar} disabled={ocupado}>Cancelar</Accion>
      </div>
      {error && <p className="dc-error dq-error" role="alert">{error}</p>}
    </form>
  );
}
