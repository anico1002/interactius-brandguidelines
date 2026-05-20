/* Graphic system — SSOT bilingüe para formas y recursos gráficos de la marca.
   Single source of truth for the brand's graphic assets. Empieza con las tres
   formas asociadas a los servicios; crecerá con patterns, marcas decorativas y
   otros recursos que la marca produzca en el futuro.

   Consumido por:
   - components/sections/SectionSistemaGrafico.tsx (spec visible)
   - lib/llms.ts (ingesta IA)
   - app/api/brand.json/route.ts (programático) */

export type ShapeServiceId = 'pensamiento' | 'experiencias' | 'transformacion';

export type GraphicShape = {
  id: string;                       // 'polygon' | 'ellipse' | 'wave'
  name: string;                     // display name
  assetPath: string;                // public URL of the SVG
  downloadFileName: string;
  fillColor: string;                // hex
  colorName: string;                // 'Opal' | 'Bordeaux' | 'Emerald'
  serviceId: ShapeServiceId;
  serviceLabel: { es: string; en: string; ca: string };
  usage: { es: string; en: string; ca: string };
};

export const serviceShapes: readonly GraphicShape[] = [
  {
    id: 'polygon',
    name: 'polygon',
    assetPath: '/sistema-grafico/shape-polygon.svg',
    downloadFileName: 'interactius-shape-polygon.svg',
    fillColor: '#B0B5B0',
    colorName: 'Opal',
    serviceId: 'pensamiento',
    serviceLabel: { es: 'Pensamiento estratégico', en: 'Strategic thinking', ca: 'Pensament estratègic' },
    usage: {
      es: 'Estructura angular que materializa la solidez del análisis. La usamos en composiciones que asocian la marca al pensamiento estratégico.',
      en: 'Angular structure that materialises the solidity of analysis. We use it in compositions that link the brand to strategic thinking.',
      ca: 'Estructura angular que materialitza la solidesa de l\'anàlisi. La fem servir en composicions que associen la marca al pensament estratègic.',
    },
  },
  {
    id: 'ellipse',
    name: 'ellipse',
    assetPath: '/sistema-grafico/shape-ellipse.svg',
    downloadFileName: 'interactius-shape-ellipse.svg',
    fillColor: '#99335F',
    colorName: 'Bordeaux',
    serviceId: 'experiencias',
    serviceLabel: { es: 'Diseño de experiencias', en: 'Experience design', ca: 'Disseny d\'experiències' },
    usage: {
      es: 'Curva cerrada que sugiere envolvimiento y continuidad. Acompaña piezas vinculadas al diseño de experiencias y a su lectura humana.',
      en: 'Closed curve that suggests envelopment and continuity. It accompanies pieces tied to experience design and its human reading.',
      ca: 'Corba tancada que suggereix embolcall i continuïtat. Acompanya peces vinculades al disseny d\'experiències i a la seva lectura humana.',
    },
  },
  {
    id: 'wave',
    name: 'wave',
    assetPath: '/sistema-grafico/shape-wave.svg',
    downloadFileName: 'interactius-shape-wave.svg',
    fillColor: '#5999A6',
    colorName: 'Emerald',
    serviceId: 'transformacion',
    serviceLabel: { es: 'Transformación cultural', en: 'Cultural transformation', ca: 'Transformació cultural' },
    usage: {
      es: 'Onda abierta que materializa el cambio en marcha. Aparece en piezas asociadas a procesos de transformación cultural y a su naturaleza progresiva.',
      en: 'Open wave that materialises change in progress. It appears in pieces associated with cultural transformation processes and their progressive nature.',
      ca: 'Ona oberta que materialitza el canvi en marxa. Apareix en peces associades a processos de transformació cultural i a la seva naturalesa progressiva.',
    },
  },
];
