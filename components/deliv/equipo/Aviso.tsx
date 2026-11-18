import type { SessionUser } from '@/lib/auth/sessionUser';
import { Cabecera } from './Cabecera';

/* Cabecera y un aviso en Burdeos: cuando el servicio no responde. */
export function Aviso({ user, mensaje }: { user: SessionUser; mensaje: string }) {
  return (
    <>
      <Cabecera user={user} />
      <main className="dq-ws">
        <p className="dc-error" role="alert">{mensaje}</p>
      </main>
    </>
  );
}
