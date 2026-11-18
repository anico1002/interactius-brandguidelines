import { cuerpoJson, equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { decidirPublicacion, enlaceDe, validarId, validarRutas, validarVersion } from '@/lib/deliv/api-util'
import { ErrorDeliv, publicar } from '@/lib/deliv/operaciones'
import { detectarAvisos, esTextoEscaneable } from '@/lib/deliv/subida'
import type { ArchivoSubida } from '@/lib/deliv/subida'
import { mapConLimite } from '@/lib/deliv/concurrencia'
import {
  archivosSubidos,
  borrarVersion,
  CONCURRENCIA_STORAGE,
  crearRepoSupabase,
  leerTexto,
} from '@/lib/deliv/supabase-repo'
import { supabaseAuthServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/* POST /api/deliv_r/artefactos/:id/publicar
   Cuerpo: { version, rutas, aceptarAvisos?, tipo?, entrada? }.
   Las rutas declaradas NO se guardan entre la subida y la publicacion: el cliente las repite
   aqui. La decision (version valida, archivos que faltan, avisos) es pura y vive en
   decidirPublicacion; este handler solo hace el IO alrededor.
   - Primera publicacion: version = la de la ficha; tipo y entrada salen de la ficha.
   - Reemplazo: version = la de la ficha + 1, con tipo y entrada de /version; al guardar se
     borra la version anterior. */
export async function POST(req: Request, { params }: Ctx) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const id = validarId((await params).id)
    const b = await cuerpoJson(req)
    const version = validarVersion(b.version)
    const rutas = validarRutas(b.rutas)
    const sb = await supabaseAuthServer()
    const repo = crearRepoSupabase(sb)

    const ficha = await repo.leerArtefacto(id)
    if (!ficha) throw new ErrorDeliv('El artefacto no existe.')

    const d = await decidirPublicacion({
      ficha,
      version,
      rutas,
      subidos: await archivosSubidos(sb, id, version),
      tipo: b.tipo as never,
      entrada: b.entrada as never,
      aceptarAvisos: b.aceptarAvisos === true,
      leerAvisos: async (presentes) => {
        // De 8 en 8, y se para en cuanto aparece un aviso: solo importa el conjunto de avisos, y
        // detectarAvisos produce como mucho uno. Un error de lectura lanza (503), como antes.
        const archivos: ArchivoSubida[] = []
        let hayAviso = false
        await mapConLimite(
          presentes.filter(esTextoEscaneable),
          CONCURRENCIA_STORAGE,
          async (ruta) => {
            const t = await leerTexto(sb, id, version, ruta)
            if (t === null) return
            const archivo = { ruta, datos: new TextEncoder().encode(t), tipoMime: '' }
            archivos.push(archivo)
            if (detectarAvisos([archivo]).length > 0) hayAviso = true
          },
          () => hayAviso,
        )
        return detectarAvisos(archivos)
      },
    })
    if (d.accion === 'rechazar') throw new ErrorDeliv(d.mensaje)
    if (d.accion === 'faltan') return json({ ok: false, faltan: d.faltan }, 409)
    if (d.accion === 'confirmar') return json({ publicado: false, avisos: d.avisos })

    const p = await publicar(
      repo,
      id,
      { version: d.version, avisos: d.avisos, tipo: d.tipo, entrada: d.entrada },
      Date.now(),
    )
    if (d.versionAnteriorABorrar) {
      // La ficha ya apunta a la nueva: si esto falla solo sobran archivos.
      try {
        await borrarVersion(sb, id, d.versionAnteriorABorrar)
      } catch (e) {
        console.error('[deliv_r:publicar] no se pudo borrar la version anterior', e)
      }
    }
    return json({ publicado: true, enlace: enlaceDe(p) })
  } catch (e) {
    return responderError(e, 'publicar')
  }
}
