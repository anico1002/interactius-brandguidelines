import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DeckLogo } from '@/components/deck/studio/DeckLogo';
import { colors } from '@/components/deck/studio/ui';

export const metadata: Metadata = {
  title: 'Acceso · DeckMakr',
  robots: { index: false, follow: false },
};

/* Shared chrome for the auth screens (login / forgot / reset): centered card on the
   warm-light brand background, DeckMakr wordmark on top. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh', background: colors.warmLight, color: colors.dark,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24, gap: 28,
      }}
    >
      <DeckLogo height={30} />
      <div style={{ width: 'min(380px, 100%)' }}>{children}</div>
    </div>
  );
}
