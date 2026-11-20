import { getLocale, getTranslations } from 'next-intl/server';

import { SectionShell } from './SectionShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { getTonePrompt } from '@/lib/prompts';
import {
  brandVocabulary,
  channelGuides,
  colorsAccent,
  lengthGuide,
  pillarKeywords,
  punctuationRules,
  toneByChannel,
  voiceAxes,
  voiceAxesIntro,
  voiceDefinition,
  voiceInclusive,
  voiceIsNot,
  voicePrinciple,
  voiceProfile,
  voiceValues,
  writingExamples,
  writingStructure,
  type WritingRule,
} from '@/lib/tokens';
import type { Locale } from '@/lib/i18n/routing';

/* 02 · Tono de marca — la identidad verbal (documento «Identidad verbal», noviembre 2026).
   Todo el contenido sale de lib/tokens.ts, que es lo mismo que leen /llms.txt, /api/brand.json,
   ReWrit_r, IMG_r y el evaluador. Aquí solo viven los títulos de bloque (messages · tonoMarca). */

const H3 = 'font-serif text-[22px] sm:text-[26px] leading-[1.25] tracking-tight max-w-[720px]';
const BODY = 'font-mono text-body-sm text-dark leading-[1.7]';
const CAPTION = 'font-mono text-caption uppercase tracking-[0.08em] text-dark/40';
const ROW_KEY = 'font-mono font-semibold text-body-sm text-dark py-5 border-b border-dark/15';
const ROW_VAL = `${BODY} pb-5 sm:py-5 sm:border-b border-dark/15`;

function Block({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 max-w-[720px]">
        <h3 className={H3}>{title}</h3>
        {intro && <p className={BODY}>{intro}</p>}
      </div>
      {children}
    </div>
  );
}

/* Tabla de dos columnas (término · explicación). En móvil se apila. */
function Rows({ rows }: { rows: { key: string; value: string; tag?: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-x-8 sm:gap-x-12 border-t border-dark/15">
      {rows.map((r) => (
        <div key={r.key} className="contents">
          <div className={ROW_KEY}>{r.key}</div>
          <div className={ROW_VAL}>
            {r.value}
            {r.tag && <span className={`${CAPTION} ml-3 whitespace-nowrap`}>{r.tag}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function YesNo({ yes, no, yesLabel, noLabel }: { yes: string; no: string; yesLabel: string; noLabel: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-4 border-t border-dark/15 pt-5">
      <div className="flex flex-col gap-2">
        <span className={CAPTION}>{yesLabel}</span>
        <p className="font-serif text-[18px] leading-[1.45] text-dark">{yes}</p>
      </div>
      <div className="flex flex-col gap-2">
        <span className={CAPTION}>{noLabel}</span>
        <p className="font-serif text-[18px] leading-[1.45] text-dark">{no}</p>
      </div>
    </div>
  );
}

export async function SectionTonoMarca() {
  const t = await getTranslations('tonoMarca');
  const l = (await getLocale()) as Locale;
  const promptText = getTonePrompt(l);
  const advisory = t('advisory');
  const ruleRows = (rules: readonly WritingRule[]) =>
    rules.map((r) => ({ key: r.title[l], value: r.body[l], tag: r.advisory ? advisory : undefined }));
  const accentHex = (name: string) => colorsAccent.find((c) => c.name === name)?.hex;

  return (
    <SectionShell id="tono-marca" title={t('title')}>
      <div className="flex flex-col gap-12 sm:gap-16">
        {/* La voz */}
        <div className="flex flex-col gap-5 max-w-[720px]">
          <span className={CAPTION}>{t('voiceTitle')}</span>
          <h3 className={H3}>{voicePrinciple[l]}</h3>
          <p className={BODY}>{voiceDefinition[l]}</p>
          <div className="flex flex-col gap-3 border-l border-dark/15 pl-6 mt-2">
            <span className={CAPTION}>{t('profileLabel')}</span>
            <p className="font-serif text-[18px] sm:text-[20px] leading-[1.45] text-dark">{voiceProfile[l]}</p>
          </div>
        </div>

        <Block title={t('isNotTitle')}>
          <Rows rows={voiceIsNot.map((n) => ({ key: n.title[l], value: n.body[l] }))} />
        </Block>

        <Block title={t('inclusiveTitle')} intro={voiceInclusive[l]}>{null}</Block>

        <Block title={t('valuesTitle')}>
          <ul className="flex flex-col gap-8">
            {voiceValues.map((v, i) => (
              <li key={v.id} className="flex flex-col gap-2 max-w-[720px]">
                <div className="flex items-baseline gap-3">
                  <span className={CAPTION}>{String(i + 1).padStart(2, '0')}/</span>
                  <h4 className="font-mono font-semibold text-body-sm text-dark">{v.title[l]}</h4>
                </div>
                <p className={BODY}>{v.body[l]}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block title={t('axesTitle')} intro={voiceAxesIntro[l]}>
          <ul className="flex flex-col gap-10">
            {voiceAxes.map((a, i) => (
              <li key={a.id} className="flex flex-col gap-3 max-w-[720px]">
                <div className="flex items-baseline gap-3">
                  <span className={CAPTION}>{String(i + 1).padStart(2, '0')}/</span>
                  <h4 className="font-mono font-semibold text-body-sm text-dark">{a.title[l]}</h4>
                </div>
                <p className={BODY}>{a.body[l]}</p>
                <dl className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-6 gap-y-2 mt-1">
                  {a.more.map((m) => (
                    <div key={m.pole.es} className="contents">
                      <dt className={`${CAPTION} pt-[3px]`}>{m.pole[l]}</dt>
                      <dd className={`${BODY} mb-2 sm:mb-0`}>{m.in[l]}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </Block>

        <Block title={t('tableTitle')} intro={t('tableBody')}>
          {/* La tabla puede ser más ancha que el móvil: se desplaza ella, no la página. */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-y border-dark/15">
                  <th className={`${CAPTION} font-normal py-4 pr-6`}>{t('tableHeadChannel')}</th>
                  {voiceAxes.map((a) => (
                    <th key={a.id} className={`${CAPTION} font-normal py-4 pr-6`}>{a.title[l]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toneByChannel.map((r) => (
                  <tr key={r.channel.es} className="border-b border-dark/15">
                    <th scope="row" className="font-mono font-semibold text-body-sm text-dark py-4 pr-6 align-top">{r.channel[l]}</th>
                    {r.axes.map((x, i) => (
                      <td key={i} className={`${BODY} py-4 pr-6 align-top`}>{x[l]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>

        <Block title={t('structureTitle')} intro={t('writingBody')}>
          <Rows rows={ruleRows(writingStructure)} />
        </Block>

        <Block title={t('lengthTitle')}>
          <Rows rows={ruleRows(lengthGuide)} />
        </Block>

        <Block title={t('puncTitle')}>
          <Rows rows={ruleRows(punctuationRules)} />
        </Block>

        <Block title={t('examplesTitle')}>
          <div className="flex flex-col gap-8">
            {writingExamples.map((e, i) => (
              <YesNo key={i} yes={e.yes[l]} no={e.no[l]} yesLabel={t('yes')} noLabel={t('no')} />
            ))}
          </div>
        </Block>

        <Block title={t('vocabTitle')} intro={t('vocabBody')}>
          <Rows rows={brandVocabulary.map((w) => ({ key: w.term[l], value: w.meaning[l] }))} />
        </Block>

        <Block title={t('pillarsTitle')} intro={t('pillarsBody')}>
          <div className="flex flex-col gap-12">
            {pillarKeywords.map((p, i) => (
              <div key={p.id} className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  {/* El acento identifica el servicio: es su uso legítimo, no decoración. */}
                  <span aria-hidden className="inline-block w-3 h-3" style={{ background: accentHex(p.accent) }} />
                  <span className={CAPTION}>{t('pillarLabel', { n: String(i + 1).padStart(2, '0') })}</span>
                  <h4 className="font-mono font-semibold text-body-sm text-dark">{p.title[l]}</h4>
                </div>
                <Rows rows={p.keywords.map((k) => ({ key: k.term[l], value: k.body[l] }))} />
              </div>
            ))}
          </div>
        </Block>

        <Block title={t('channelsTitle')} intro={t('channelsBody')}>
          <div className="flex flex-col gap-12">
            {channelGuides.map((c) => (
              <div key={c.id} className="flex flex-col gap-5">
                <h4 className="font-mono font-semibold text-body-sm text-dark">{c.title[l]}</h4>
                <Rows rows={c.rules.map((r) => ({ key: r.label[l], value: r.body[l] }))} />
                {c.example && <YesNo yes={c.example.yes[l]} no={c.example.no[l]} yesLabel={t('yes')} noLabel={t('no')} />}
              </div>
            ))}
          </div>
        </Block>

        <CopyButton
          value={promptText}
          toastMessage={t('copyPromptToast')}
          label={t('copyPromptLabel')}
          className="group inline-flex items-center gap-3 font-mono text-body-sm text-dark normal-case tracking-normal w-fit"
        >
          <span aria-hidden className="opacity-60 transition-opacity duration-500 ease-expo group-hover:opacity-100">⧉</span>
          <span className="hover-wipe-underline">{t('copyPromptLabel')}</span>
        </CopyButton>
      </div>
    </SectionShell>
  );
}
