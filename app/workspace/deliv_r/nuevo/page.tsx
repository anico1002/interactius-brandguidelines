import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Aviso } from '@/components/deliv/equipo/Aviso';
import { Cabecera } from '@/components/deliv/equipo/Cabecera';
import { NO_DISPONIBLE } from '@/components/deliv/equipo/formato';
import { Subida } from '@/components/deliv/equipo/Subida';
import { esUuid } from '@/lib/deliv/api-util';
import { crearRepoSupabase } from '@/lib/deliv/supabase-repo';
import { supabaseAuthServer } from '@/lib/supabase/server';
import { exigirEquipo } from '../exigir-equipo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Deliv_r', robots: { index: false, follow: false } };

export default async function DelivNuevoPage({
  searchParams,
}: { searchParams: Promise<{ id?: string | string[] }> }) {
  const user = await exigirEquipo();
  const { id } = await searchParams;
  const idArtefacto = typeof id === 'string' ? id : undefined;
  if (id !== undefined && (!idArtefacto || !esUuid(idArtefacto))) notFound();

  let clientes: { slug: string; nombre: string }[];
  let titulo: string | null = null;
  try {
    const repo = crearRepoSupabase(await supabaseAuthServer());
    if (idArtefacto) {
      const a = await repo.leerArtefacto(idArtefacto);
      if (!a) notFound();
      titulo = a.titulo;
      clientes = [];
    } else {
      clientes = [...new Map((await repo.listarArtefactos()).map((a) => [a.cliente, a.clienteNombre])).entries()]
        .map(([slug, nombre]) => ({ slug, nombre }));
    }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e; // notFound / redirect
    console.error('[deliv_r:nuevo]', e);
    return <Aviso user={user} mensaje={NO_DISPONIBLE} />;
  }
  return (
    <>
      <Cabecera user={user} />
      <Subida id={idArtefacto} titulo={titulo} clientes={clientes} />
    </>
  );
}
