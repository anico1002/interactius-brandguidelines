import { notFound } from 'next/navigation';
import { LabClient } from './LabClient';

/* Layout sandbox — committed so it syncs across machines and any teammate can use it, but DEV-ONLY:
   the route sits outside /deck and has no auth guard, so it must never be reachable on the public
   site. Any production build (Netlify) 404s it here; UI retouching happens locally anyway (edit a
   component, hot-reload). Run `npm run dev` and open /lab to review every layout at editor size. */
export default function LabPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <LabClient />;
}
