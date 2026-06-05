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
      es: 'Red de vectores planos en un sistema triangular asimétrico. Simboliza la estructura, el marco analítico y la delimitación estricta de los problemas.',
      en: 'Network of flat vectors in an asymmetric triangular system. It symbolises structure, the analytical frame and the strict delimitation of problems.',
      ca: 'Xarxa de vectors plans en un sistema triangular asimètric. Simbolitza l\'estructura, el marc analític i la delimitació estricta dels problemes.',
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
      es: 'Secuencia orbital elíptica en rotación constante. Representa los ciclos de interacción, la adaptabilidad y el comportamiento humano en movimiento.',
      en: 'Elliptical orbital sequence in constant rotation. It represents cycles of interaction, adaptability and human behaviour in motion.',
      ca: 'Seqüència orbital el·líptica en rotació constant. Representa els cicles d\'interacció, l\'adaptabilitat i el comportament humà en moviment.',
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
      es: 'Vórtice toroidal donde las líneas convergen y se expanden. Ilustra los sistemas organizacionales orgánicos y el impacto del cambio en los equipos.',
      en: 'Toroidal vortex where lines converge and expand. It illustrates organic organisational systems and the impact of change on teams.',
      ca: 'Vòrtex toroïdal on les línies convergeixen i s\'expandeixen. Il·lustra els sistemes organitzacionals orgànics i l\'impacte del canvi en els equips.',
    },
  },
];
