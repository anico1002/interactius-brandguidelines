'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/auth/sessionUser';
import { Accion, Cabecera, Enlace } from './Cabecera';
import { enviar } from './api';
import { Credenciales } from './Credenciales';

export interface FilaUsuario {
  email: string;
  artefactos: number;
  ultimo: string;
  activo: boolean;
}

/* Usuarios de cliente: regenerar (la contraseña nueva sale una vez), desactivar y reactivar
   (primero lista lo que recupera y pide confirmar). Prototipo, detalles 11 y 12. */
export function Usuarios({ user, usuarios }: { user: SessionUser; usuarios: FilaUsuario[] }) {
  const router = useRouter();
  const [pw, setPw] = useState<Record<string, string>>({});
  const [recupera, setRecupera] = useState<{ email: string; titulos: string[] } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = (email: string) => `/api/deliv_r/usuarios/${encodeURIComponent(email)}`;
  const quitarPw = (email: string) => setPw(({ [email]: _quitada, ...resto }) => resto);

  const regenerar = async (email: string) => {
    setOcupado(email); setError(null);
    const r = await enviar<{ password: string }>(`${base(email)}/password`, 'POST');
    setOcupado(null);
    if (!r.ok) return setError(r.mensaje);
    setRecupera(null);
    setPw((p) => ({ ...p, [email]: r.datos.password }));
    router.refresh();
  };

  const desactivar = async (email: string) => {
    setOcupado(email); setError(null);
    const r = await enviar(`${base(email)}/desactivar`, 'POST');
    setOcupado(null);
    if (!r.ok) return setError(r.mensaje);
    quitarPw(email);
    router.refresh();
  };

  const pedirReactivar = async (email: string) => {
    setOcupado(email); setError(null);
    const r = await enviar<{ recupera: { id: string; titulo: string }[] }>(`${base(email)}/reactivar`, 'POST', {});
    setOcupado(null);
    if (!r.ok) return setError(r.mensaje);
    setRecupera({ email, titulos: r.datos.recupera.map((a) => a.titulo) });
  };

  const confirmarReactivar = async (email: string) => {
    setOcupado(email); setError(null);
    const r = await enviar<{ password: string }>(`${base(email)}/reactivar`, 'POST', { confirmar: true });
    setOcupado(null);
    if (!r.ok) return setError(r.mensaje);
    setRecupera(null);
    setPw((p) => ({ ...p, [email]: r.datos.password }));
    router.refresh();
  };

  return (
    <>
      <Cabecera user={user} />
      <main className="dq-ws">
        <div className="dq-volver"><Enlace s href="/workspace/deliv_r">Volver a la galería</Enlace></div>
        <div className="dq-intro"><h1 className="dc-titulo">Usuarios de cliente</h1></div>
        {error && <p className="dc-error dq-error" role="alert">{error}</p>}
        {usuarios.length === 0 ? (
          <p className="dq-nota">Todavía no hay usuarios de cliente. Se crean al dar acceso a un artefacto.</p>
        ) : (
          <div className="dq-tabla">
            <table style={{ minWidth: 680 }}>
              <thead>
                <tr><th>Correo</th><th className="n">Artefactos</th><th>Último acceso</th><th>Estado</th><th /></tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <FilaConDetalle key={u.email}>
                    <tr>
                      <td>{u.email}</td>
                      <td className="n">{u.artefactos}</td>
                      <td>{u.ultimo}</td>
                      <td className={u.activo ? undefined : 'dq-alerta'}>{u.activo ? 'Activo' : 'Desactivado'}</td>
                      <td>
                        <div className="dq-fila-acc" style={{ gap: '0 20px', minHeight: 32 }}>
                          {u.activo ? (
                            <>
                              <Accion s disabled={ocupado === u.email} onClick={() => regenerar(u.email)}>Regenerar contraseña</Accion>
                              <Accion s peligro disabled={ocupado === u.email} onClick={() => desactivar(u.email)}>Desactivar</Accion>
                            </>
                          ) : (
                            <Accion s disabled={ocupado === u.email} onClick={() => pedirReactivar(u.email)}>Reactivar</Accion>
                          )}
                        </div>
                      </td>
                    </tr>
                    {pw[u.email] && (
                      <tr>
                        <td colSpan={5} className="dq-detalle">
                          <Credenciales
                            titulo={`Contraseña nueva de ${u.email}`}
                            filas={[
                              { k: 'Usuario', v: u.email },
                              { k: 'Contraseña', v: pw[u.email], pw: true },
                            ]}
                            nota="Solo se muestra ahora. La sesión que tuviera abierta vuelve al login. Envíala por un canal distinto al del enlace."
                            copia={`Usuario: ${u.email}\nContraseña: ${pw[u.email]}`}
                            onCerrar={() => quitarPw(u.email)}
                          />
                        </td>
                      </tr>
                    )}
                    {recupera?.email === u.email && (
                      <tr>
                        <td colSpan={5} className="dq-detalle">
                          <div className="dq-recupera">
                            <div className="dq-eyebrow">Al reactivar a {u.email} recupera acceso a</div>
                            <ul>
                              {recupera.titulos.length
                                ? recupera.titulos.map((t, i) => <li key={i}>{t}</li>)
                                : <li>Ningún artefacto.</li>}
                            </ul>
                            <div className="dq-nota">Se genera una contraseña nueva y se muestra una sola vez.</div>
                            <div className="dq-acts">
                              <Accion disabled={ocupado === u.email} onClick={() => confirmarReactivar(u.email)}>Confirmar reactivación</Accion>
                              <Accion onClick={() => setRecupera(null)}>Cancelar</Accion>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </FilaConDetalle>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

/* Varias filas por usuario bajo una sola key. */
function FilaConDetalle({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
