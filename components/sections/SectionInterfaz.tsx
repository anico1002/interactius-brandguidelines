import { getLocale, getTranslations } from 'next-intl/server';

import { SectionShell } from './SectionShell';
import {
  uiPrinciples, uiTokens, uiSizes, uiTypeScale, uiSpacingRules, uiStates, uiComponents, uiPieces,
  type UiComponent, type UiStateId, type UiVariant,
} from '@/lib/ui';
import { colorsBase, colorsFunctional } from '@/lib/tokens';
import { sections } from '@/lib/sections';
import type { Locale } from '@/lib/i18n/routing';
import { Ico } from './uiIcons';
import { UiDropdown, UiFilterBar } from './UiDropdown';
import { DeckLogo } from '@/components/studio/Wordmark';

/* 12 · Componentes — documentación del sistema de componentes.
   Todo lo que se ve son componentes reales con las clases `.ixu-*` de app/ui-kit.css. Las
   matrices fuerzan cada estado con su clase `.is-*`, que pinta lo mismo que el estado real.
   Los datos (valores, reglas, accesibilidad) salen de lib/ui.ts. */

const H3 = 'font-mono text-caption uppercase tracking-[0.08em] text-dark/60';
const H4 = 'font-mono text-body-sm font-semibold text-dark';
const P = 'font-mono text-body-sm text-dark/80 leading-relaxed max-w-3xl';
const CAP = 'font-mono text-[11px] leading-[1.45] text-dark/55';

/* Muestra de color de un token: resuelve "Warm Dark" → hex de la paleta. */
const PALETTE: Record<string, string> = Object.fromEntries(
  [...colorsBase, ...colorsFunctional].map((c) => [c.name, c.hex]),
);
function swatch(value: string): string | null {
  const tint = value.match(/^Dark (\d+)%$/);
  if (tint) return `rgba(28,26,23,${Number(tint[1]) / 100})`;
  if (value === 'Dark + Warm Light 32%') return '#615F5B';
  if (value === 'White + Dark 8%') return '#EBEBEA';
  if (value === 'White + Dark 16%') return '#D9D9D8';
  if (value === 'Error 6%') return 'rgba(180,64,46,.06)';
  return PALETTE[value] ?? null;
}

/* Clase forzada para cada estado (ver app/ui-kit.css). */
const FORCED: Record<UiStateId, string> = {
  default: '', hover: 'is-hover', pressed: 'is-pressed', focus: 'is-focus', open: 'is-open',
  selected: '', disabled: 'is-disabled', loading: 'is-loading', error: 'is-error',
};

type Demo = Record<string, string>;

/* Número de la sección, para numerar sus entradas (12.1, 12.2…) sin escribirlo a mano. */
const NUM = sections.find((x) => x.id === 'componentes')?.num ?? '';

/* Pinta un componente en un estado concreto. `interactive` = sin forzar nada (fila de variantes). */
function Specimen({ comp, v, state, demo }: { comp: UiComponent; v: UiVariant; state: UiStateId; demo: Demo }) {
  const forced = FORCED[state];
  const sel = state === 'selected';
  const cls = (base: string) => `${base} ${forced}`.trim();

  switch (comp.id) {
    case 'button': {
      const label = state === 'loading' ? demo.saving : v.id === 'danger' ? demo.delete : v.id === 'primary' ? demo.save : v.id === 'ghost' ? demo.cancel : demo.share;
      return (
        <button type="button" tabIndex={-1} className={cls(v.className)} aria-pressed={sel ? true : undefined} aria-busy={state === 'loading' || undefined}>
          {label}
        </button>
      );
    }
    case 'iconButton':
      return (
        <button type="button" tabIndex={-1} className={cls(v.className)} aria-pressed={sel ? true : undefined} aria-label={demo.layouts}>
          {Ico.grid()}
        </button>
      );
    case 'field': {
      const c = cls(v.className);
      if (v.id === 'search') {
        return (
          <div className={`${c} w-full max-w-[200px]`}>
            {Ico.search(14)}
            {state === 'focus'
              ? <span className="ixu-field__value">Acm<span className="ixu-field__caret" aria-hidden /></span>
              : <span className="ixu-field__value" style={{ color: 'var(--ui-text-muted)' }}>{demo.search}</span>}
          </div>
        );
      }
      if (v.id === 'select') {
        const field = (
          <div className={`${c} w-full max-w-[200px]`}>
            <span className="ixu-field__value">{demo.allClients}</span>
            {Ico.chevron()}
          </div>
        );
        if (state !== 'open') return field;
        return (
          <div className="ixu-dropdown ixu-dropdown--inline w-full max-w-[200px]">
            {field}
            <div className="ixu-menu" role="listbox" aria-label={demo.allClients}>
              <div className="ixu-menu__item" role="option" aria-selected="true">{demo.allClients}</div>
              <div className="ixu-menu__item is-hover" role="option" aria-selected="false">Acme</div>
              <div className="ixu-menu__item" role="option" aria-selected="false">Globex</div>
            </div>
          </div>
        );
      }
      return (
        <div className={`${c} w-full max-w-[200px]`}>
          <span className="ixu-field__value">
            {state === 'error' ? 'hola@' : demo.fieldValue}
            {state === 'focus' && <span className="ixu-field__caret" aria-hidden />}
          </span>
        </div>
      );
    }
    case 'choice':
      return (
        <span className={`${cls(v.className)} ${sel ? 'is-checked' : ''}`}>
          <span className="ixu-check__box">{v.id === 'checkbox' && Ico.check()}</span>
          {v.id === 'checkbox' ? demo.checkbox : demo.radio}
        </span>
      );
    case 'chip': {
      if (v.id !== 'chipList') {
        return (
          <button type="button" tabIndex={-1} className={cls(v.className)} aria-pressed={sel}>
            {demo.tag1}
          </button>
        );
      }
      const chip = (
        <button type="button" tabIndex={-1} className={cls(v.className)} aria-pressed={sel}
          aria-haspopup="listbox" aria-expanded={state === 'open'}>
          {sel ? 'Acme' : demo.allClients}{Ico.chevron(10)}
        </button>
      );
      if (state !== 'open') return chip;
      return (
        <div className="ixu-dropdown ixu-dropdown--inline">
          {chip}
          <div className="ixu-menu" role="listbox" aria-label={demo.allClients}>
            <div className="ixu-menu__item" role="option" aria-selected="true">{demo.allClients}</div>
            <div className="ixu-menu__item is-hover" role="option" aria-selected="false">Acme</div>
            <div className="ixu-menu__item" role="option" aria-selected="false">Globex</div>
          </div>
        </div>
      );
    }
    case 'segmented':
      return (
        <div className="ixu-seg">
          <button type="button" tabIndex={-1} className={forced} aria-checked={sel} role="radio">ES</button>
          <button type="button" tabIndex={-1} aria-checked={false} role="radio">EN</button>
        </div>
      );
    case 'menu':
      return (
        <div className="ixu-menu" style={{ minWidth: 160 }}>
          <button type="button" tabIndex={-1} className={cls(v.className)} aria-selected={sel || undefined}>Acme</button>
        </div>
      );
    case 'tag':
      return (
        <span className="ixu-tag">
          {demo.tag1}
          <button type="button" tabIndex={-1} className={forced || undefined} aria-label={`${demo.remove} ${demo.tag1}`}>{Ico.close(12)}</button>
        </span>
      );
    case 'card':
      return (
        <a href="#componentes" tabIndex={-1} className={`${cls(v.className)} p-5 flex flex-col gap-2 w-[220px]`}>
          <span className="ixu-title">{demo.cardTitle}</span>
          <span className="font-mono text-[12px] leading-[1.5] text-ash">{demo.cardBody}</span>
        </a>
      );
    default:
      return null;
  }
}

/* Muestra de una pieza sin matriz: solo lo suyo, sin repetir componentes ya documentados. */
function PieceSpecimen({ id, demo }: { id: string; demo: Demo }) {
  switch (id) {
    case 'header':
      return (
        <div className="ixu-header w-full max-w-[560px] border border-dark/15">
          <DeckLogo height={22} />
          <span className="ixu-title mr-auto ml-4">{demo.deckTitle}</span>
          <button type="button" className="ixu-btn ixu-btn--secondary">{demo.share}</button>
        </div>
      );
    case 'dialog':
      return (
        <div className="ixu-scrim p-6 sm:p-10 w-full flex justify-center">
          <div className="ixu-dialog" role="group" aria-label={demo.dialogTitle}>
            <h4 className="ixu-title">{demo.dialogTitle}</h4>
            <p className="ixu-dialog__body">{demo.dialogBody}</p>
            <div className="ixu-dialog__actions">
              <button type="button" className="ixu-btn ixu-btn--secondary">{demo.cancel}</button>
              <button type="button" className="ixu-btn ixu-btn--danger">{demo.delete}</button>
            </div>
          </div>
        </div>
      );
    case 'tooltip':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 w-full">
          <div className="flex flex-col items-center gap-3 p-8">
            <span className="ixu-tooltip">{demo.tooltip}</span>
            <span className={CAP}>{demo.onLight}</span>
          </div>
          <div className="flex flex-col items-center gap-3 p-8 bg-dark">
            <span className="ixu-tooltip ixu-tooltip--light">{demo.tooltip}</span>
            <span className="font-mono text-[11px] leading-[1.45] text-warm-light/60">{demo.onDark}</span>
          </div>
        </div>
      );
    case 'badge':
      return (
        <div className="flex gap-2">
          <span className="ixu-badge ixu-badge--on">{demo.published}</span>
          <span className="ixu-badge">{demo.draft}</span>
        </div>
      );
    case 'alert':
      return (
        <div className="flex flex-col gap-10 w-full max-w-[480px]">
          <div className="flex flex-col gap-4">
            <span className={CAP}>{demo.alertInline}</span>
            <div>
              <span className="ixu-label">{demo.emailLabel}</span>
              <div className="ixu-field is-error"><span className="ixu-field__value">ana@</span></div>
              <p className="ixu-message ixu-message--error">{demo['type_ui-text']}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="ixu-btn ixu-btn--secondary">{demo.share}</button>
              <span className="ixu-message ixu-message--success !mt-0">{demo.copied}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className={CAP}>{demo.alertBanner}</span>
            <div className="ixu-alert">{demo.alert}</div>
            <div className="ixu-alert ixu-alert--success">{demo.success}</div>
            <div className="ixu-alert ixu-alert--neutral">{demo.notice}</div>
          </div>
          <div className="flex flex-col gap-3 items-start">
            <span className={CAP}>{demo.alertToast}</span>
            <div className="ixu-toast" role="status">{demo.success}</div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

/* Matriz de estados: filas = estados, columnas = variantes (máx. 4, siempre caben).
   Cada celda: el componente forzado a ese estado + sus valores de fondo, texto y filete. */
function StateMatrix({ comp, locale, demo, t }: { comp: UiComponent; locale: Locale; demo: Demo; t: (k: string) => string }) {
  const label = (id: UiStateId) => uiStates.find((s) => s.id === id)?.label[locale] ?? id;
  const cols = comp.variants.length;
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-full table-fixed min-w-[560px]">
        <colgroup>
          <col className="w-[112px]" />
          {comp.variants.map((v) => <col key={v.id} />)}
        </colgroup>
        <thead>
          <tr>
            <th />
            {comp.variants.map((v) => (
              <th key={v.id} scope="col" className="text-left font-mono text-body-sm font-medium text-dark pb-4 pr-4">
                {v.label[locale]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comp.states.map((s) => (
            <tr key={s} className="border-t border-dark/15 align-top">
              <th scope="row" className="text-left font-mono text-caption uppercase tracking-[0.08em] text-dark/50 font-normal py-5 pr-4">
                {label(s)}
              </th>
              {comp.variants.map((v) => {
                const cell = v.cells[s];
                return (
                  <td key={v.id} className="py-5 pr-4">
                    {cell ? (
                      <div className="flex flex-col gap-3 items-stretch">
                        <div className="min-h-[36px] flex items-center pl-[3px] pr-[3px]">
                          <Specimen comp={comp} v={v} state={s} demo={demo} />
                        </div>
                        <dl className={`${CAP} grid grid-cols-[auto_1fr] gap-x-2`}>
                          <dt className="text-dark/35">{t('matrix.fill')}</dt><dd>{cell.fill}</dd>
                          <dt className="text-dark/35">{t('matrix.text')}</dt><dd>{cell.text}</dd>
                          <dt className="text-dark/35">{t('matrix.border')}</dt><dd>{cell.border}</dd>
                        </dl>
                      </div>
                    ) : (
                      <span className={CAP}>{t('matrix.na')}</span>
                    )}
                  </td>
                );
              })}
              {cols < 2 && <td />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className={H3}>{title}</h3>
      {intro && <p className={P}>{intro}</p>}
      {children}
    </div>
  );
}

export async function SectionInterfaz() {
  const t = await getTranslations('interfaz');
  const locale = (await getLocale()) as Locale;
  const demo = t.raw('demo') as Demo;

  return (
    <SectionShell id="componentes" title={t('title')}>
      <div className="flex flex-col gap-5 mb-14 sm:mb-20 items-start">
        <p className="font-mono font-semibold text-body-sm text-dark leading-[1.7] max-w-[720px]">{t('lead')}</p>
        <p className="font-mono text-body-sm text-dark leading-[1.7] max-w-[720px]">{t('body')}</p>
      </div>

      <div className="flex flex-col gap-24 sm:gap-32">
        {/* ── Principios ── */}
        <Block title={t('principlesTitle')}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 border-t border-dark/15 pt-8">
            {uiPrinciples.map((p, i) => (
              <div key={p.id} className="flex flex-col gap-3">
                <div className="font-mono text-caption text-dark/40 tabular-nums">{String(i + 1).padStart(2, '0')}</div>
                <div className={H4}>{p.title[locale]}</div>
                <p className="font-mono text-body-sm text-dark/75 leading-[1.6]">{p.body[locale]}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* ── Tokens semánticos ── */}
        <Block title={t('tokensTitle')} intro={t('tokensIntro')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 border-t border-dark/15">
            {uiTokens.map((tk) => {
              const sw = swatch(tk.value);
              return (
                <div key={tk.name} className="grid grid-cols-[20px_1fr] gap-4 py-4 border-b border-dark/15 items-start">
                  <span className="mt-[3px] w-5 h-5 border border-dark/15" style={{ background: sw ?? 'transparent' }} aria-hidden />
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-mono text-body-sm font-medium text-dark">{tk.name}</span>
                      <span className={CAP}>{tk.value} · {tk.cssVar}</span>
                    </div>
                    <span className="font-mono text-body-sm text-dark/70 leading-[1.5]">{tk.role[locale]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Block>

        {/* ── Medidas ── */}
        <Block title={t('sizesTitle')} intro={t('sizesIntro')}>
          <div className="border-t border-dark/15">
            {uiSizes.map((s) => (
              <div key={s.id} className="grid grid-cols-[48px_1fr] sm:grid-cols-[64px_220px_1fr] gap-x-6 gap-y-3 items-center py-5 border-b border-dark/15">
                <span className="font-mono text-caption uppercase tracking-[0.08em] text-dark/50">{s.id}</span>
                <div className="flex items-center gap-4">
                  <span className="block bg-dark/10 border border-dark/25" style={{ width: s.height, height: s.height }} aria-hidden />
                  <span className="font-mono text-[11px] leading-[1.5] text-dark/70 tabular-nums">
                    {s.height}px<br />
                    <span className="text-dark/45">pad {s.paddingX} · {t('iconLabel')} {s.icon}</span>
                  </span>
                </div>
                <span className="col-span-2 sm:col-span-1 font-mono text-body-sm text-dark/75 leading-[1.5]">{s.usage[locale]}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="ixu-btn ixu-btn--secondary">{demo.share}</button>
            <div className="ixu-field w-[200px]">{Ico.search(14)}<input placeholder={demo.search} aria-label={demo.search} /></div>
            <UiDropdown className="w-[180px]" label={demo.allClients} options={[demo.allClients, 'Acme', 'Globex']} />
            <button type="button" className="ixu-icon-btn" aria-label={demo.layouts}>{Ico.grid()}</button>
            <button type="button" className="ixu-btn ixu-btn--primary">{demo.save}</button>
          </div>
          <p className={CAP}>{t('sizesProof')}</p>
        </Block>

        {/* ── Tipografía de interfaz + espaciado ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <Block title={t('typeTitle')} intro={t('typeIntro')}>
            <div className="border-t border-dark/15">
              {uiTypeScale.map((s) => (
                <div key={s.id} className="flex flex-col gap-2 py-4 border-b border-dark/15">
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      className="text-dark"
                      style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: s.size, lineHeight: s.lineHeight, fontWeight: s.weight, letterSpacing: s.tracking, textTransform: s.uppercase ? 'uppercase' : 'none' }}
                    >
                      {demo[`type_${s.id}`]}
                    </span>
                    <span className={`${CAP} whitespace-nowrap tabular-nums`}>
                      {s.id} · {s.size}/{s.lineHeight} · {s.weight}{s.tracking !== '0' ? ` · ${s.tracking}` : ''}
                    </span>
                  </div>
                  <span className="font-mono text-caption text-dark/60 leading-[1.5]">{s.usage[locale]}</span>
                </div>
              ))}
            </div>
          </Block>
          <Block title={t('spacingTitle')} intro={t('spacingIntro')}>
            <div className="border-t border-dark/15">
              {uiSpacingRules.map((r) => (
                <div key={r.id} className="grid grid-cols-[56px_1fr] gap-4 items-center py-4 border-b border-dark/15">
                  <span className="flex items-center gap-2">
                    <span className="block h-3 bg-dark/70" style={{ width: r.value }} aria-hidden />
                    <span className="font-mono text-[11px] text-dark/60 tabular-nums">{r.value}</span>
                  </span>
                  <span className="font-mono text-body-sm text-dark/75 leading-[1.5]">{r.rule[locale]}</span>
                </div>
              ))}
            </div>
          </Block>
        </div>

        {/* ── Modelo de estados ── */}
        <Block title={t('statesTitle')} intro={t('statesIntro')}>
          <div className="border-t border-dark/15">
            {uiStates.map((s) => (
              <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[160px_220px_1fr] gap-x-8 gap-y-1 py-4 border-b border-dark/15">
                <span className={H4}>{s.label[locale]}</span>
                <span className={`${CAP} sm:pt-[3px]`}>{s.trigger}</span>
                <span className="font-mono text-body-sm text-dark/75 leading-[1.6]">{s.rule[locale]}</span>
              </div>
            ))}
          </div>
        </Block>

        {/* ── Componentes ── */}
        {uiComponents.map((comp, i) => (
          <div key={comp.id} className="flex flex-col gap-8 border-t border-dark pt-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-caption text-dark/40 tabular-nums">{NUM}.{i + 1}</span>
                <h3 className="font-serif font-normal text-[24px] sm:text-[28px] leading-[1.15] text-dark">{comp.name[locale]}</h3>
              </div>
              <p className={P}>{comp.summary[locale]}</p>
              {comp.sizes.length > 0 && (
                <p className={CAP}>
                  {t('sizesLabel')}: {comp.sizes.map((id) => `${id} ${uiSizes.find((s) => s.id === id)?.height}px`).join(' · ')}
                </p>
              )}
            </div>

            <StateMatrix comp={comp} locale={locale} demo={demo} t={t} />

            {comp.id === 'chip' && (
              <div className="flex flex-col gap-3">
                <span className={H3}>{t('liveLabel')}</span>
                <UiFilterBar clientLabel={demo.allClients} clients={['Acme', 'Globex']} tags={[demo.tag1, demo.tag2, demo.tag3]} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-dark/15 pt-6">
              <div className="flex flex-col gap-2">
                <span className={H3}>{t('a11yLabel')}</span>
                <p className="font-mono text-body-sm text-dark/75 leading-[1.6]">{comp.a11y[locale]}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={H3}>{t('doLabel')}</span>
                <p className="font-mono text-body-sm text-dark/75 leading-[1.6]">{comp.do[locale]}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={H3}>{t('dontLabel')}</span>
                <p className="font-mono text-body-sm text-dark/75 leading-[1.6]">{comp.dont[locale]}</p>
              </div>
            </div>
          </div>
        ))}

        {/* ── Piezas sin matriz: no tienen estados propios, se especifican por medidas ── */}
        {uiPieces.map((p, i) => (
          <div key={p.id} className="flex flex-col gap-6 border-t border-dark pt-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-caption text-dark/40 tabular-nums">{NUM}.{uiComponents.length + i + 1}</span>
                <h3 className="font-serif font-normal text-[24px] sm:text-[28px] leading-[1.15] text-dark">{p.name[locale]}</h3>
              </div>
              <p className={P}>{p.spec[locale]}</p>
            </div>
            <div className={`bg-warm-light border border-dark/15 flex items-center justify-center ${p.id === 'dialog' || p.id === 'tooltip' ? '' : 'p-6 sm:p-8'}`}>
              <PieceSpecimen id={p.id} demo={demo} />
            </div>
          </div>
        ))}

      </div>
    </SectionShell>
  );
}
