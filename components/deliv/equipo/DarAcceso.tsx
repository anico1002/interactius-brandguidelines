'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Accion } from './Cabecera';
import { enviar, useOrigen } from './api';
import { Credenciales } from './Credenciales';

interface RespuestaAcceso {
  email: string;
  nuevo: boolean;
  password: string | null;
  enlace: string;
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* «Dar acceso»: el correo, el resultado y, si la cuenta es nueva, las credenciales una sola vez. */
export function DarAcceso({
  artefactoId, personas,
}: { artefactoId: string; personas: string[] }) {
  const router = useRouter();
  const origen = useOrigen();
  const [correo, setCorreo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cred, setCred] = useState<{ email: string; password: string; enlace: string } | null>(null);

  const dar = async (e: FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    const email = correo.trim().toLowerCase();
    setCred(null);
    setInfo(null);
    if (!CORREO.test(email)) {
      setError('Escribe un correo válido.');
      return;
    }
    setError(null);
    setOcupado(true);
    const r = await enviar<RespuestaAcceso>(`/api/deliv_r/artefactos/${artefactoId}/accesos`, 'POST', { email });
    setOcupado(false);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    const d = r.datos;
    if (d.nuevo && d.password) {
      setCred({ email: d.email, password: d.password, enlace: d.enlace });
    } else if (personas.includes(d.email)) {
      setInfo('Ya tenía cuenta y ya tenía acceso a este artefacto. Su contraseña no ha cambiado.');
    } else {
      setInfo('Ya tenía cuenta. Se le ha dado acceso a este artefacto y conserva su contraseña actual.');
    }
    setCorreo('');
    router.refresh();
  };

  const enlaceAbs = cred ? `${origen}${cred.enlace}` : '';

  return (
    <>
      <form className="dq-dar" onSubmit={dar} noValidate>
        <input
          className="dc-input"
          type="email"
          placeholder="ana@cliente.test"
          aria-label="Correo de la persona"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Accion type="submit" disabled={ocupado}>{ocupado ? 'Dando acceso' : 'Dar acceso'}</Accion>
      </form>
      {error && <p className="dc-error dq-error" role="alert">{error}</p>}
      {info && <p className="dq-info" role="status">{info}</p>}
      {cred && (
        <Credenciales
          titulo={`Credenciales de ${cred.email}`}
          filas={[
            { k: 'Enlace', v: enlaceAbs },
            { k: 'Usuario', v: cred.email },
            { k: 'Contraseña', v: cred.password, pw: true },
          ]}
          nota="Solo se muestra ahora. Envíala por un canal distinto al del enlace."
          copia={`Enlace: ${enlaceAbs}\nUsuario: ${cred.email}\nContraseña: ${cred.password}`}
          onCerrar={() => setCred(null)}
        />
      )}
    </>
  );
}
