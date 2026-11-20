import { getLocale, getTranslations } from 'next-intl/server';

import { SectionShell } from './SectionShell';
import { uiIconRules } from '@/lib/ui';
import type { Locale } from '@/lib/i18n/routing';
import { Ico } from './uiIcons';

/* 11 · Iconos — fundamento, no componente: no tiene estados ni variantes. Lo consumen los
   componentes (botón de icono, × de la etiqueta, flecha del desplegable). Los glifos viven en
   ./uiIcons y sus reglas en lib/ui.ts (uiIconRules). */

const H3 = 'font-mono text-caption uppercase tracking-[0.08em] text-dark/60';
const H4 = 'font-mono text-body-sm font-semibold text-dark';
const CAP = 'font-mono text-[11px] leading-[1.45] text-dark/55';

const GLYPHS = ['grid', 'search', 'plus', 'close', 'copy', 'trash', 'info', 'power'] as const;

export async function SectionIconos() {
  const t = await getTranslations('iconos');
  const locale = (await getLocale()) as Locale;
  const names = t.raw('names') as Record<string, string>;

  return (
    <SectionShell id="iconos" title={t('title')}>
      <div className="flex flex-col gap-5 mb-14 sm:mb-20 items-start">
        <p className="font-mono font-semibold text-body-sm text-dark leading-[1.7] max-w-[720px]">{t('lead')}</p>
        <p className="font-mono text-body-sm text-dark leading-[1.7] max-w-[720px]">{t('body')}</p>
      </div>

      <div className="flex flex-col gap-24 sm:gap-32">
        {/* ── Glifos ── */}
        <div className="flex flex-col gap-6">
          <h3 className={H3}>{t('setTitle')}</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-dark/15">
            {GLYPHS.map((k) => (
              <li key={k} className="flex flex-col items-center gap-4 py-8 border-r border-b border-dark/15">
                <span className="ixu-icon-btn" aria-hidden>{Ico[k]()}</span>
                <span className={CAP}>{names[k]}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Tallas ── */}
        <div className="flex flex-col gap-6">
          <h3 className={H3}>{t('sizesTitle')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-dark/15">
            {([['md · lg', 16, ''], ['sm', 14, 'ixu-icon-btn--sm'], ['xs', 12, '']] as const).map(([size, px, cls]) => (
              <div key={size} className="flex items-center gap-4 py-5 border-b border-dark/15 sm:border-b-0">
                {px === 12
                  ? <span className="ixu-tag">{names.close.toLowerCase()} {Ico.close(12)}</span>
                  : <span className={`ixu-icon-btn ${cls}`} aria-hidden>{Ico.search(px)}</span>}
                <span className={CAP}>{size} · {px}px</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Reglas ── */}
        <div className="flex flex-col gap-6">
          <h3 className={H3}>{t('rulesTitle')}</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 border-t border-dark/15">
            {uiIconRules.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-5 border-b border-dark/15">
                <span className={H4}>{r.title[locale]}</span>
                <p className="font-mono text-body-sm text-dark/75 leading-[1.6]">{r.body[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
