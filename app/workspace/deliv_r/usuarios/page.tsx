import type { Metadata } from 'next';
import { Aviso } from '@/components/deliv/equipo/Aviso';
import { fechaCorta, NO_DISPONIBLE } from '@/components/deliv/equipo/formato';
import { Usuarios, type FilaUsuario } from '@/components/deliv/equipo/Usuarios';
import { repoServicio } from '@/lib/deliv/servidor';
import { exigirEquipo } from '../exigir-equipo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Deliv_r', robots: { index: false, follow: false } };

export default async function DelivUsuariosPage() {
  const user = await exigirEquipo();
  let filas: FilaUsuario[];
  try {
    const repo = repoServicio();
    const usuarios = await repo.listarUsuarios();
    filas = await Promise.all(
      usuarios.map(async (u) => {
        const accesos = await repo.accesosDeUsuario(u.email);
        const ultimo = accesos
          .map((a) => a.ultimoAcceso)
          .filter((x): x is string => !!x)
          .sort()
          .pop();
        return { email: u.email, artefactos: accesos.length, ultimo: fechaCorta(ultimo), activo: !!u.hash };
      }),
    );
  } catch (e) {
    console.error('[deliv_r:usuarios]', e);
    return <Aviso user={user} mensaje={NO_DISPONIBLE} />;
  }
  return <Usuarios user={user} usuarios={filas} />;
}
