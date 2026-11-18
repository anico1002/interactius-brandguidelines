import { secretoSesion } from '@/lib/deliv/config';
import { verificarTokenArchivo } from '@/lib/deliv/file-tokens';
import { CABECERAS_PRIVADAS, CSP_ARTEFACTO, noDisponible, rutaSegura } from '@/lib/deliv/http';
import { ID_ARTEFACTO_RE } from '@/lib/deliv/ids';
import { clienteServicio } from '@/lib/deliv/servidor';
import { crearRepoSupabase, descargar } from '@/lib/deliv/supabase-repo';

export const dynamic = 'force-dynamic';

const prohibido = () => new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS });
const noEncontrado = () => new Response('Not found', { status: 404, headers: CABECERAS_PRIVADAS });

/*
 * Archivos de un artefacto, autorizados por el token HMAC de 15 min de la ruta (el iframe HTML
 * corre con origen opaco y no manda la cookie). La URL lleva el public_id; el token firma el uuid
 * y la versión, así que sustituir el archivo invalida los tokens emitidos antes.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; token: string; ruta: string[] }> },
) {
  const { id, token, ruta } = await params;
  const rutaArchivo = rutaSegura(ruta);
  if (!ID_ARTEFACTO_RE.test(id) || !rutaArchivo) return prohibido();

  try {
    const secreto = secretoSesion();
    const sb = clienteServicio();
    const art = await crearRepoSupabase(sb).leerArtefactoPublico(id);
    if (
      !art ||
      art.estado !== 'publicado' ||
      !verificarTokenArchivo(token, art.id, art.version, Date.now(), secreto)
    ) {
      return prohibido();
    }

    if (art.tipo === 'pdf') {
      // Un PDF es un único archivo: solo se sirve la entrada.
      if (rutaArchivo !== art.entrada) return noEncontrado();
      const archivo = await descargar(sb, art.id, art.version, rutaArchivo);
      if (!archivo) return noEncontrado();
      // Sin sandbox (Chrome no abre su visor en un iframe aislado): por eso aquí no va la CSP
      // del artefacto, sino solo frame-ancestors. Content-Type fijo y nosniff (CABECERAS_PRIVADAS).
      return new Response(archivo.datos, {
        headers: {
          ...CABECERAS_PRIVADAS,
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Content-Security-Policy': "frame-ancestors 'self'",
        },
      });
    }

    const archivo = await descargar(sb, art.id, art.version, rutaArchivo);
    if (!archivo) return noEncontrado();
    return new Response(archivo.datos, {
      headers: {
        ...CABECERAS_PRIVADAS,
        'Content-Type': archivo.tipoMime,
        'Content-Security-Policy': CSP_ARTEFACTO,
        // El documento enmarcado tiene origen opaco: sus scripts de módulo y fuentes piden CORS.
        // La autorización es el token de la ruta, no la cookie: abrir el origen no amplía el acceso.
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('[deliv] archivo', e);
    return noDisponible();
  }
}
