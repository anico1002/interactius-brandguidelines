import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { Login } from '@/components/deliv/cliente/Login';
import { ServicioNoDisponible } from '@/components/deliv/cliente/ServicioNoDisponible';
import { Visor, type SalidaVisor } from '@/components/deliv/cliente/Visor';
import { isTeamEmail } from '@/lib/auth/team';
import { clienteDeSesion, puedeVerCliente } from '@/lib/deliv/acceso';
import { secretoSesion } from '@/lib/deliv/config';
import { crearTokenArchivo } from '@/lib/deliv/file-tokens';
import { ID_ARTEFACTO_RE } from '@/lib/deliv/ids';
import type { RepoDeliv } from '@/lib/deliv/repo';
import { repoServicio } from '@/lib/deliv/servidor';
import { COOKIE_SESION } from '@/lib/deliv/session';
import type { Artefacto } from '@/lib/deliv/tipos';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Carga =
  | { estado: 'no-disponible' }
  | { estado: 'sin-sesion' }
  | { estado: 'sin-acceso' }
  | {
      estado: 'ok';
      repo: RepoDeliv;
      secreto: string;
      artefacto: Artefacto;
      email: string;
      /** El equipo no cuenta como último acceso. */
      equipo: boolean;
    };

/** Sesión de Google del equipo, o null. Un fallo aquí no tumba el visor de clientes. */
async function emailEquipo(): Promise<string | null> {
  try {
    const user = await getUser();
    return user && isTeamEmail(user.email) ? (user.email ?? null) : null;
  } catch (e) {
    console.error('[deliv] sesion de equipo', e);
    return null;
  }
}

/**
 * Todo lo que puede fallar por infraestructura, en un solo try. El notFound() va FUERA: lanza
 * una excepción de control que un catch se tragaría.
 */
async function cargar(cliente: string, publicId: string, ahora: number): Promise<Carga> {
  try {
    const repo = repoServicio();
    const secreto = secretoSesion();
    const token = (await cookies()).get(COOKIE_SESION)?.value;
    const usuario = await clienteDeSesion(repo, token, ahora, secreto);

    const leido = ID_ARTEFACTO_RE.test(publicId) ? await repo.leerArtefactoPublico(publicId) : null;
    // Misma respuesta si no existe, si el cliente de la URL no cuadra o si no está publicado.
    const artefacto = leido && leido.cliente === cliente && leido.estado === 'publicado' ? leido : null;

    // 1) Cliente con sesión y fila de acceso.
    if (usuario && artefacto && (await puedeVerCliente(repo, usuario.email, artefacto))) {
      return { estado: 'ok', repo, secreto, artefacto, email: usuario.email, equipo: false };
    }
    // 2) Equipo con su sesión de Google: cualquier artefacto publicado.
    const equipo = await emailEquipo();
    if (equipo) {
      if (!artefacto) return { estado: 'sin-acceso' };
      return { estado: 'ok', repo, secreto, artefacto, email: equipo, equipo: true };
    }
    // 3) Sin ninguna de las dos: login. Sin sesión no se revela si el enlace existe.
    return usuario ? { estado: 'sin-acceso' } : { estado: 'sin-sesion' };
  } catch (e) {
    console.error('[deliv] visor', e);
    return { estado: 'no-disponible' };
  }
}

const codificarRuta = (ruta: string) => ruta.split('/').map(encodeURIComponent).join('/');

export default async function ArtefactoPage({
  params,
  searchParams,
}: {
  params: Promise<{ cliente: string; id: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { cliente, id } = await params;
  const { error } = await searchParams;
  const volver = `/clientes/${cliente}/${id}`;
  const ahora = Date.now();

  const c = await cargar(cliente, id, ahora);
  if (c.estado === 'no-disponible') return <ServicioNoDisponible />;
  if (c.estado === 'sin-sesion') {
    return <Login next={volver} error={typeof error === 'string' ? error : undefined} />;
  }
  if (c.estado === 'sin-acceso') notFound();

  const { repo, secreto, artefacto, email, equipo } = c;
  if (!equipo) {
    await repo
      .registrarUltimoAcceso(artefacto.id, email, new Date(ahora).toISOString())
      .catch((e) => console.error('[deliv] ultimo acceso', e));
  }

  // El token firma el uuid y la versión: sustituir el archivo invalida los tokens anteriores.
  const { token, expira } = crearTokenArchivo(artefacto.id, artefacto.version, ahora, secreto);
  const salida: SalidaVisor = equipo
    ? { tipo: 'equipo', href: `/workspace/deliv_r/${artefacto.id}` }
    : { tipo: 'cliente', volver };

  return (
    <Visor
      titulo={artefacto.titulo}
      tipo={artefacto.tipo}
      src={`/clientes/archivos/${artefacto.publicId}/${token}/${codificarRuta(artefacto.entrada)}`}
      expira={expira}
      email={email}
      salida={salida}
    />
  );
}
