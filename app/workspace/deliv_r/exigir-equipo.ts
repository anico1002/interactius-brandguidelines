import { redirect } from 'next/navigation';
import { getSessionUser, type SessionUser } from '@/lib/auth/sessionUser';
import { isTeamEmail } from '@/lib/auth/team';

/* El middleware ya protege /workspace; estas páginas leen datos de usuarios con la service role,
   así que comprueban la sesión de equipo por su cuenta antes de leer nada. */
export async function exigirEquipo(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!isTeamEmail(user.email)) redirect('/workspace/login');
  return user;
}
