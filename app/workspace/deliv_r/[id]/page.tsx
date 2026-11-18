import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Aviso } from '@/components/deliv/equipo/Aviso';
import { Cabecera } from '@/components/deliv/equipo/Cabecera';
import { Ficha, type DatosFicha } from '@/components/deliv/equipo/Ficha';
import { fechaCorta, NO_DISPONIBLE } from '@/components/deliv/equipo/formato';
import type { FilaAcceso } from '@/components/deliv/equipo/TablaAccesos';
import { esUuid, enlaceDe } from '@/lib/deliv/api-util';
import { crearRepoSupabase } from '@/lib/deliv/supabase-repo';
import { supabaseAuthServer } from '@/lib/supabase/server';
import { exigirEquipo } from '../exigir-equipo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Deliv_r', robots: { index: false, follow: false } };

export default async function DelivFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await exigirEquipo();
  const { id } = await params;
  if (!esUuid(id)) notFound();

  let datos: DatosFicha;
  let accesos: FilaAcceso[];
  try {
    const repo = crearRepoSupabase(await supabaseAuthServer());
    const a = await repo.leerArtefacto(id);
    if (!a) notFound();
    datos = {
      id: a.id,
      titulo: a.titulo,
      clienteNombre: a.clienteNombre,
      tipo: a.tipo,
      estado: a.estado,
      version: a.version,
      publicado: fechaCorta(a.publicadoEn ?? a.creadoEn),
      enlace: enlaceDe(a),
    };
    accesos = (a.estado !== 'publicado' ? [] : await repo.accesosDeArtefacto(id)).map((x) => ({
      email: x.email,
      por: x.concedidoPor,
      cuando: fechaCorta(x.concedidoEn),
      ultimo: fechaCorta(x.ultimoAcceso),
    }));
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e; // notFound / redirect
    console.error('[deliv_r:ficha]', e);
    return <Aviso user={user} mensaje={NO_DISPONIBLE} />;
  }
  return (
    <>
      <Cabecera user={user} />
      <Ficha datos={datos} accesos={accesos} />
    </>
  );
}
