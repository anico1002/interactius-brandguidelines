import { cuerpoJson, equipoDeLaPeticion, json, responderError } from '@/lib/deliv/api'
import { texto, tipoValido, validarEntrada, validarRutas } from '@/lib/deliv/api-util'
import { crearBorrador } from '@/lib/deliv/operaciones'
import { crearRepoSupabase, urlsDeSubida } from '@/lib/deliv/supabase-repo'
import { supabaseAuthServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/* POST /api/deliv_r/artefactos — crea el borrador (version 1, estado «subiendo») y devuelve
   las URL firmadas para subir cada archivo directo al bucket. */
export async function POST(req: Request) {
  const equipo = await equipoDeLaPeticion(req)
  if (typeof equipo !== 'string') return equipo
  try {
    const b = await cuerpoJson(req)
    const rutas = validarRutas(b.rutas, b.tamanos)
    const d = {
      clienteNombre: texto(b.clienteNombre, 'el nombre del cliente') as string,
      cliente: texto(b.cliente, 'el cliente', true),
      titulo: texto(b.titulo, 'el título') as string,
      tipo: tipoValido(b.tipo),
      entrada: validarEntrada(b.entrada, rutas),
    }
    const sb = await supabaseAuthServer()
    const a = await crearBorrador(crearRepoSupabase(sb), d, equipo, Date.now())
    const subidas = await urlsDeSubida(sb, a.id, a.version, rutas)
    return json({ id: a.id, version: a.version, subidas })
  } catch (e) {
    return responderError(e, 'crear')
  }
}
