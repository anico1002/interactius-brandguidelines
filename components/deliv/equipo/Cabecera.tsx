import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandMark, MarkDivider } from '@/components/studio/BrandMark';
import { UserMenu } from '@/components/studio/UserMenu';
import { Wordmark } from '@/components/studio/Wordmark';
import type { SessionUser } from '@/lib/auth/sessionUser';

/* Cabecera de Deliv_r: la de las demás galerías del workspace (imagotipo, wordmark, menú de usuario),
   con el buscador centrado si lo hay. */
export function Cabecera({ user, busqueda }: { user: SessionUser; busqueda?: ReactNode }) {
  return (
    <header className="dq-cab">
      <BrandMark height={20} href="/workspace" label="Ir a la landing de aplicaciones" />
      <MarkDivider />
      <Link href="/workspace/deliv_r" aria-label="Deliv_r" style={{ display: 'inline-flex' }}>
        <Wordmark before="Deliv" after="r" height={22} title="Deliv_r" />
      </Link>
      <span className="dq-cab__der" />
      <UserMenu user={user} />
      {busqueda ? <div className="dq-cab__busca">{busqueda}</div> : null}
    </header>
  );
}

/* Enlace subrayado con hover-wipe (un <a>). */
export function Enlace({
  href, children, s, peligro, blank,
}: { href: string; children: ReactNode; s?: boolean; peligro?: boolean; blank?: boolean }) {
  const cls = `dc-link${s ? ' dc-link--s' : ''}${peligro ? ' dc-link--peligro' : ''}`;
  return (
    <Link className={cls} href={href} {...(blank ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <span>{children}</span>
    </Link>
  );
}

/* Acción subrayada con hover-wipe (un <button>). */
export function Accion({
  children, onClick, s, peligro, disabled, type = 'button',
}: {
  children: ReactNode; onClick?: () => void; s?: boolean; peligro?: boolean; disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const cls = `dc-link${s ? ' dc-link--s' : ''}${peligro ? ' dc-link--peligro' : ''}`;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
    </button>
  );
}
