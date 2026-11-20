import type { Metadata } from 'next';
import { Aviso } from '@/components/deliv/equipo/Aviso';
import { fechaLarga, NO_DISPONIBLE } from '@/components/deliv/equipo/formato';
import { Listado, type FilaListado } from '@/components/deliv/equipo/Listado';
import { secretoSesion } from '@/lib/deliv/config';
import { crearTokenArchivo } from '@/lib/deliv/file-tokens';
import { crearRepoSupabase, urlsDePortadas } from '@/lib/deliv/supabase-repo';
import type { Artefacto } from '@/lib/deliv/tipos';
import { supabaseAuthServer } from '@/lib/supabase/server';
import { exigirEquipo } from './exigir-equipo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Deliv_r', robots: { index: false, follow: false } };

const codificarRuta = (ruta: string) => ruta.split('/').map(encodeURIComponent).join('/');

/* URL con token del archivo de entrada, para generar la portada que falta (lib/deliv/portada.ts).
   Mismo token que el visor (15 min). Sin el secreto no se genera: la tarjeta queda en blanco. */
function capturaDe(a: Artefacto, ahora: number, secreto: string | null): string | null {
  if (!secreto || a.estado !== 'publicado') return null;
  const { token } = crearTokenArchivo(a.id, a.version, ahora, secreto);
  return `/clientes/archivos/${a.publicId}/${token}/${codificarRuta(a.entrada)}`;
}

function secretoOpcional(): string | null {
  try {
    return secretoSesion();
  } catch (e) {
    console.error('[deliv_r:listado] sin secreto, sin portadas nuevas', e);
    return null;
  }
}

/* Un fallo al leer las portadas no tumba la galería: salen en blanco. */
async function portadasOpcionales(
  sb: Awaited<ReturnType<typeof supabaseAuthServer>>,
  artefactos: Artefacto[],
): Promise<Map<string, string>> {
  try {
    return await urlsDePortadas(sb, artefactos.filter((a) => a.estado === 'publicado'));
  } catch (e) {
    console.error('[deliv_r:listado] portadas', e);
    return new Map();
  }
}

export default async function DelivListadoPage() {
  const user = await exigirEquipo();
  let filas: FilaListado[];
  try {
    const sb = await supabaseAuthServer();
    const ahora = Date.now();
    const secreto = secretoOpcional();
    const artefactos = await crearRepoSupabase(sb).listarArtefactos();
    const portadas = await portadasOpcionales(sb, artefactos);
    filas = artefactos.map((a) => {
      const portada = portadas.get(a.id) ?? null;
      return {
        id: a.id,
        titulo: a.titulo,
        tipo: a.tipo,
        version: a.version,
        estado: a.estado,
        creado: fechaLarga(a.creadoEn),
        creadoEn: a.creadoEn,
        cliente: a.cliente,
        clienteNombre: a.clienteNombre,
        portada,
        captura: portada ? null : capturaDe(a, ahora, secreto),
      };
    });
  } catch (e) {
    console.error('[deliv_r:listado]', e);
    return <Aviso user={user} mensaje={NO_DISPONIBLE} />;
  }
  return <Listado user={user} artefactos={filas} />;
}
