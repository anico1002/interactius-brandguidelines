import type { Theme } from '@/lib/deck/types';

/* Persistent brand furniture for interior slides: filete, isotipo mark, page number. */
export function Chrome({ theme, page }: { theme: Theme; page: number }) {
  const iso = theme === 'dark' ? '/logo/isotipo-negativo.svg' : '/logo/isotipo-positivo.svg';
  return (
    <>
      <div className="rule" />
      <div className="mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iso} alt="" />
        <div className="yr">2026</div>
      </div>
      <div className="pageno">{String(page).padStart(2, '0')}</div>
    </>
  );
}
