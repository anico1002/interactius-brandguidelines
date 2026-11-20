import { NextResponse } from 'next/server';

import {
  colorsBase,
  colorsAccent,
  colorsFunctional,
  typography,
  brand,
  logoMinSize,
  voicePrinciple,
  voiceAxes,
  forbiddenVocabulary,
  substitutionMatrix,
  punctuationRules,
  sentenceLength,
  examples,
} from '@/lib/tokens';
import { sections } from '@/lib/sections';
import { uiPrinciples, uiTokens, uiTypeScale, uiSizes, uiSpacingRules, uiStates, uiComponents, uiPieces, uiIconRules } from '@/lib/ui';
import { getMasterPrompt, getTonePrompt } from '@/lib/prompts';
import { typeScale } from '@/lib/typeScale';
import { easings, durations, heroReferenceUrl } from '@/lib/motion';
import { serviceShapes } from '@/lib/graphics';

export const dynamic = 'force-static';

const SITE = 'https://brand.interactius.com';

export function GET() {
  const payload = {
    brand: {
      name: brand.name,
      wordmark: brand.wordmark,
      tagline: brand.tagline,
      version: brand.version,
      versionDate: brand.versionDate,
      concept: brand.concept,
      visualUniverse: brand.visualUniverse,
    },
    voice: {
      principle: voicePrinciple,
      sentenceLength,
      axes: voiceAxes,
      forbiddenVocabulary,
      substitutionMatrix,
      punctuation: {
        noExclamation: punctuationRules.noExclamation,
        noEllipsis: punctuationRules.noEllipsis,
      },
    },
    colors: {
      base: colorsBase,
      accent: colorsAccent,
      functional: colorsFunctional,
      rules: {
        onLightBg: '#1C1A17',
        onDarkBg: '#F5F2ED',
      },
    },
    typography: {
      brand: typography.brand,
      contrast: typography.contrast,
      italicsAllowed: false,
    },
    typeScale,
    interface: {
      principles: uiPrinciples,
      tokens: uiTokens,
      sizes: uiSizes,
      typeScale: uiTypeScale,
      spacing: uiSpacingRules,
      states: uiStates,
      components: uiComponents,
      pieces: uiPieces,
      icons: uiIconRules,
      stylesheet: 'app/ui-kit.css',
    },
    motion: {
      easings,
      durations,
      heroReferenceUrl,
    },
    graphics: {
      serviceShapes: serviceShapes.map((s) => ({
        ...s,
        assetUrl: `${SITE}${s.assetPath}`,
      })),
    },
    logo: {
      minSize: logoMinSize,
      clearSpace: 'Equivalente a la altura de la "a" minúscula del logotipo.',
      assets: {
        positive: `${SITE}/logo/interactius-positivo.svg`,
        negative: `${SITE}/logo/interactius-negativo.svg`,
        isotypePositive: `${SITE}/logo/isotipo-positivo.svg`,
        isotypeNegative: `${SITE}/logo/isotipo-negativo.svg`,
      },
    },
    prompts: {
      master: { es: getMasterPrompt('es'), en: getMasterPrompt('en'), ca: getMasterPrompt('ca') },
      tone: { es: getTonePrompt('es'), en: getTonePrompt('en'), ca: getTonePrompt('ca') },
    },
    examples: {
      approved: examples.filter((e) => e.status === 'approved'),
      rejected: examples.filter((e) => e.status === 'rejected'),
    },
    sections: sections.map((s) => ({
      id: s.id,
      num: s.num,
      label: s.label,
      url: `${SITE}/#${s.id}`,
    })),
    documents: {
      llms: `${SITE}/llms.txt`,
    },
  };

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  });
}
