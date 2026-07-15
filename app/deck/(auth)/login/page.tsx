import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { LoginForm } from '@/components/deck/auth/LoginForm';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  // Already signed in → straight to the app.
  if (await getUser()) redirect(next && next.startsWith('/deck') ? next : '/deck');
  return <LoginForm next={next ?? null} />;
}
