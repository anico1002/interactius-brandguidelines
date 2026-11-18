import type { Metadata } from 'next';
import { Aviso } from '@/components/deliv/equipo/Aviso';
import { fechaCorta, NO_DISPONIBLE } from '@/components/deliv/equipo/formato';
import { Listado, type FilaListado } from '@/components/deliv/equipo/Listado';
import { crearRepoSupabase } from '@/lib/deliv/supabase-repo';
import { supabaseAuthServer } from '@/lib/supabase/server';
import { exigirEquipo } from './exigir-equipo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Deliv_r', robots: { index: false, follow: false } };

export default async function DelivListadoPage() {
  const user = await exigirEquipo();
  let filas: FilaListado[];
  try {
    const repo = crearRepoSupabase(await supabaseAuthServer());
    const publicados = (await repo.listarArtefactos());
    filas = await Promise.all(
      publicados.map(async (a) => ({
        id: a.id,
        titulo: a.titulo,
        tipo: a.tipo,
        estado: a.estado,
        fecha: fechaCorta(a.publicadoEn ?? a.creadoEn),
        cliente: a.cliente,
        clienteNombre: a.clienteNombre,
        personas: a.estado === 'publicado' ? (await repo.accesosDeArtefacto(a.id)).length : 0,
      })),
    );
  } catch (e) {
    console.error('[deliv_r:listado]', e);
    return <Aviso user={user} mensaje={NO_DISPONIBLE} />;
  }
  return <Listado user={user} artefactos={filas} />;
}
