import { CABECERAS_PRIVADAS, destinoSeguro, origenValido } from '@/lib/deliv/http';
import { redirigir } from '@/lib/deliv/redirigir';
import { COOKIE_SESION } from '@/lib/deliv/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!origenValido(req)) return new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS });
  let next = '/';
  try {
    next = destinoSeguro(String((await req.formData()).get('next') ?? ''));
  } catch {
    // Cuerpo ilegible: se cierra la sesión igualmente y se vuelve a la raíz.
  }
  const res = redirigir(next);
  res.headers.append('Set-Cookie', `${COOKIE_SESION}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  return res;
}
