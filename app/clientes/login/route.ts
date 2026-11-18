import { autenticar } from '@/lib/deliv/auth';
import { secretoSesion } from '@/lib/deliv/config';
import { CABECERAS_PRIVADAS, destinoSeguro, noDisponible, origenValido } from '@/lib/deliv/http';
import { redirigir } from '@/lib/deliv/redirigir';
import { repoServicio } from '@/lib/deliv/servidor';
import { COOKIE_SESION, DURACION_SESION_MS, crearTokenSesion } from '@/lib/deliv/session';

export const dynamic = 'force-dynamic';

const prohibido = () => new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS });

export async function POST(req: Request) {
  // CSRF antes que nada: ni se lee el cuerpo de un POST de otro sitio.
  if (!origenValido(req)) return prohibido();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response('Bad Request', { status: 400, headers: CABECERAS_PRIVADAS });
  }
  // `next` validado por destinoSeguro: solo /clientes/<slug>/<publicId>, sin query.
  const next = destinoSeguro(String(form.get('next') ?? ''));
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');

  try {
    const secreto = secretoSesion();
    const ahora = Date.now();
    const r = await autenticar(repoServicio(), email, password, ahora);
    if (!r.ok) return redirigir(`${next}?error=${r.motivo}`);

    const res = redirigir(next);
    const token = crearTokenSesion(r.usuario.email, ahora, secreto);
    res.headers.append(
      'Set-Cookie',
      `${COOKIE_SESION}=${token}; Path=/; Max-Age=${DURACION_SESION_MS / 1000}; HttpOnly; Secure; SameSite=Lax`,
    );
    return res;
  } catch (e) {
    console.error('[deliv] login', e);
    return noDisponible();
  }
}
