export type ColorToken = {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  /* Servicio asociado. Solo en colores de acento — cada acento identifica
     uno de los tres servicios canónicos de Interactius. */
  service?: { es: string; en: string; ca: string };
  /* Rol funcional. Solo en los colores funcionales (error, éxito): comunican un estado del
     sistema y nada más. Nunca decoran ni identifican un servicio. */
  role?: { es: string; en: string; ca: string };
};

export const colorsBase: ColorToken[] = [
  { name: 'Dark',       hex: '#1C1A17', rgb: '28,26,23',    cmyk: '0,7,18,89' },
  { name: 'Pure White', hex: '#FFFFFF', rgb: '255,255,255', cmyk: '0,0,0,0'   },
  { name: 'Grey',       hex: '#E8E6E3', rgb: '232,230,227', cmyk: '0,1,2,9'   },
  { name: 'Warm Light', hex: '#F5F2ED', rgb: '245,242,237', cmyk: '0,1,3,4'   },
  { name: 'Warm Dark',  hex: '#E0DAD2', rgb: '224,218,210', cmyk: '0,3,6,12'  },
  { name: 'Ash',        hex: '#75706B', rgb: '117,112,107', cmyk: '0,4,9,54'  },
  { name: 'Ash Dark',   hex: '#46433F', rgb: '70,67,63',    cmyk: '0,4,10,73' },
];

export const colorsAccent: ColorToken[] = [
  { name: 'Opal',     hex: '#B0B5B0', rgb: '176,181,176', cmyk: '3,0,3,29',   service: { es: 'Pensamiento estratégico',  en: 'Strategic thinking',       ca: 'Pensament estratègic' } },
  { name: 'Bordeaux', hex: '#99335F', rgb: '153,51,95',   cmyk: '0,67,38,40', service: { es: 'Diseño de experiencias',   en: 'Experience design',        ca: 'Disseny d\'experiències' } },
  { name: 'Emerald',  hex: '#5999A6', rgb: '89,153,166',  cmyk: '46,8,0,35',  service: { es: 'Transformación cultural',  en: 'Cultural transformation',  ca: 'Transformació cultural' } },
];

/* ─── Acentos de los iconos de herramienta (workspace interno) ───

   NO son colores de marca y no entran en la paleta: no salen en /api/brand.json, ni en /llms.txt,
   ni en la sección de color del manual — esos tres consumidores nombran `colorsBase` y
   `colorsAccent` uno a uno, así que este export no se cuela en ninguno. Están aquí, y no sueltos
   en el componente, porque una norma que solo vive en el CSS de una pieza no es una norma.

   Decisión de Alberto, agosto de 2026, al entregar los iconos del dispatcher. Los iconos usan
   acentos saturados ajenos al sistema cromático. Es deliberado y tiene motivo: los tres acentos de
   marca identifican SERVICIOS (Opal, Burdeos, Esmeralda) y una herramienta interna no es un
   servicio, así que usarlos aquí habría roto esa lectura.

   Un acento NO identifica una herramienta: dos pueden compartirlo, como hacen ReWrit_r y DSMak_r.
   Es color de familia, no etiqueta.

   El alcance es estricto: components/workspace/AppIcon.tsx y nada más. No se usan como color de
   interfaz, ni de texto, ni de fondo, ni salen de la home. Para alertas mandan los colores funcionales (Error), no Burdeos ni estos.

   Ojo con los nombres: el verde de FormMak_r NO es la Esmeralda de marca (#5999A6) aunque se le
   parezca de lejos. Son colores distintos con orígenes distintos. */

export const toolIconAccents: { app: string; hex: string; note: string }[] = [
  { app: 'rewritr',  hex: '#00D1FF', note: 'Cian — transformación del texto y nodos de IA' },
  { app: 'deckmakr', hex: '#FF6B6B', note: 'Coral — crecimiento y generación de la diapositiva' },
  { app: 'formmakr', hex: '#10B981', note: 'Verde — validación y envío del formulario' },
  /* DSMak_r comparte el cian de ReWrit_r a propósito — confirmado por Alberto en agosto de 2026.
     El acento no es un identificador único por herramienta: dos pueden compartirlo. */
  { app: 'dsmakr',   hex: '#00D1FF', note: 'Cian — tokens de diseño y componente maestro' },
  /* IMG_r, octubre de 2026. Decisión de CARLOS, con Alberto informado después; queda anotada así para
     que él pueda revocarla sin reconstruir el porqué. Aviso dado y asumido: a 72 px el magenta queda
     cerca del coral de DeckMak_r (#FF6B6B). Alcance: AppIcon.tsx y nada más. */
  { app: 'imgr',     hex: '#EC4899', note: 'Magenta — la imagen y el revelado' },
  /* Deliv_r, noviembre de 2026. Decisión de MARTINA al recibir el icono definitivo: coral, compartido
     con DeckMak_r a propósito (sustituye al magenta provisional). Aviso dado y asumido: dos
     herramientas con el mismo acento en la misma rejilla. */
  { app: 'delivr',   hex: '#FF6B6B', note: 'Coral — compartido con DeckMak_r' },
  /* SocialMak_r, noviembre de 2026. Decisión de MARTINA; comparte el verde de FormMak_r a propósito. */
  { app: 'socialmakr', hex: '#10B981', note: 'Verde — compartido con FormMak_r' },
];

/* Colores funcionales — noviembre de 2026. Comunican estado en interfaz y nada más.
   Sustituyen el rol de alerta que Burdeos tuvo de julio a noviembre de 2026: un acento identifica
   un servicio y no puede significar además "error".
   - Error: el rojo que el Deck Maker ya usaba para el fallo de guardado. hsl(8, 59%, 44%).
   - Success: el mismo H girado a verde (140°) y la misma S (59%). La L baja a 29% porque el verde
     se percibe mucho más luminoso: a 44% daba 2,7:1 sobre blanco. A 29% da 5,66:1, el mismo
     contraste que el rojo (AA sobre White y sobre Warm Light). */
export const colorsFunctional: ColorToken[] = [
  { name: 'Error',   hex: '#B4402E', rgb: '180,64,46',  cmyk: '0,64,74,29',
    role: { es: 'Error, acción destructiva y alerta en interfaz', en: 'Error, destructive action and alert in UI', ca: 'Error, acció destructiva i alerta en interfície' } },
  { name: 'Success', hex: '#1E763B', rgb: '30,118,59',  cmyk: '75,0,50,54',
    role: { es: 'Confirmación y éxito en interfaz', en: 'Confirmation and success in UI', ca: 'Confirmació i èxit en interfície' } },
];

export const typography = {
  brand: {
    family: 'IBM Plex Mono',
    role: 'Tipografía de marca',
    weights: [400, 500, 600],
    italics: false,
    notes: 'Uso preferente de pesos Regular y Semibold para destacados. Evitar el uso de cursiva.',
    download: 'https://fonts.google.com/specimen/IBM+Plex+Mono',
  },
  contrast: {
    family: 'IBM Plex Serif',
    role: 'Tipografía de contraste',
    weights: [300, 400],
    italics: false,
    notes: 'Uso preferente de pesos Light y Regular para destacados. Evitar el uso de cursiva.',
    download: 'https://fonts.google.com/specimen/IBM+Plex+Serif',
  },
} as const;

/* ───────────────────────────── Voice / verbal identity ─────────────────────────────
   Fuente: documento «Identidad verbal · Cómo escribe Interactius» (noviembre 2026), solo la
   primera parte (identidad verbal). La capa SEO/GEO/AEO, el test final y los checklists quedan
   fuera por decisión de Alberto (2026-11-20).

   Lo pinta la sección 02 · Tono de marca y lo leen /llms.txt, /api/brand.json, los prompts de
   lib/prompts.ts, ReWrit_r (lib/rewriter/prompt.ts), el análisis de IMG_r y el evaluador
   (lib/eval.ts). Cualquier cambio aquí se propaga a todos.

   Ya NO hay lista roja ni matriz de sustitución (retiradas el 2026-11-20): el documento nuevo
   no veta palabras. Las del equipo que antes se vetaban, como «innovación», se pueden usar. Lo
   que el documento pide es criterio (adjetivos de superioridad fuera de los titulares web), no
   un filtro de vocabulario. */

export type Trilingual = { es: string; en: string; ca: string };

/** La frase que resume la voz. Es también el subtítulo del documento. */
export const voicePrinciple: Trilingual = {
  es: 'Escribimos para activar el pensamiento crítico de quien nos lee, no para demostrar el nuestro.',
  en: "We write to activate our reader's critical thinking, not to display our own.",
  ca: 'Escrivim per activar el pensament crític de qui ens llegeix, no per demostrar el nostre.',
};

/** Qué es la voz y su arquetipo: la Exploradora, con la Sabia como contrapunto. */
export const voiceDefinition: Trilingual = {
  es: 'La voz es la personalidad del texto: cómo pensamos, qué priorizamos, qué elegimos decir y qué decidimos no decir. No es el estilo de una persona concreta: es el carácter colectivo de Interactius. Nuestra voz tiene un arquetipo principal, la Exploradora: busca nuevos caminos, cuestiona lo establecido y no se detiene ante la incertidumbre. Como contrapunto, la Sabia aporta profundidad y serenidad cuando el contexto lo pide. Pero el impulso de base es siempre la exploración.',
  en: "Voice is the personality of the text: how we think, what we prioritise, what we choose to say and what we decide to leave unsaid. It is not one person's style: it is the collective character of Interactius. Our voice has one main archetype, the Explorer: she looks for new paths, questions what is established and does not stop at uncertainty. As a counterpoint, the Sage brings depth and calm when the context calls for it. But the underlying drive is always exploration.",
  ca: "La veu és la personalitat del text: com pensem, què prioritzem, què triem dir i què decidim no dir. No és l'estil d'una persona concreta: és el caràcter col·lectiu d'Interactius. La nostra veu té un arquetip principal, l'Exploradora: busca camins nous, qüestiona el que està establert i no s'atura davant la incertesa. Com a contrapunt, la Sàvia aporta profunditat i serenor quan el context ho demana. Però l'impuls de base és sempre l'exploració.",
};

/** La voz es constante; el tono cambia según el contexto. */
export const voiceVsTone: Trilingual = {
  es: 'La voz es constante. El tono cambia según el contexto.',
  en: 'The voice is constant. The tone changes with the context.',
  ca: 'La veu és constant. El to canvia segons el context.',
};

export const voiceProfile: Trilingual = {
  es: 'Interactius escribe como quien llega a una reunión con criterio propio, escucha antes de hablar y nombra lo que otros aún no han formulado.',
  en: 'Interactius writes like someone who arrives at a meeting with a view of their own, listens before speaking and names what others have not yet put into words.',
  ca: "Interactius escriu com qui arriba a una reunió amb criteri propi, escolta abans de parlar i anomena el que d'altres encara no han formulat.",
};

export const voiceIsNot: readonly { title: Trilingual; body: Trilingual }[] = [
  {
    title: { es: 'No es creativa por defecto', en: 'Not creative by default', ca: 'No és creativa per defecte' },
    body: { es: 'La originalidad no es un objetivo; la claridad sí.', en: 'Originality is not a goal; clarity is.', ca: "L'originalitat no és un objectiu; la claredat, sí." },
  },
  {
    title: { es: 'No es académica', en: 'Not academic', ca: 'No és acadèmica' },
    body: { es: 'El rigor no requiere distancia ni jerga.', en: 'Rigour needs neither distance nor jargon.', ca: 'El rigor no requereix distància ni argot.' },
  },
  {
    title: { es: 'No es comercial', en: 'Not commercial', ca: 'No és comercial' },
    body: { es: 'No vendemos: mostramos cómo pensamos.', en: "We don't sell: we show how we think.", ca: 'No venem: mostrem com pensem.' },
  },
  {
    title: { es: 'No es suave', en: 'Not soft', ca: 'No és suau' },
    body: { es: 'Decimos lo que es, aunque incomode.', en: 'We say what is, even when it is uncomfortable.', ca: 'Diem el que és, encara que incomodi.' },
  },
  {
    title: { es: 'No es yo', en: 'Not "I"', ca: 'No és jo' },
    body: {
      es: 'Siempre es nosotros: en conceptos, redes sociales, presentaciones comerciales y artefactos de empresa. No se aplica a los artículos del blog Miradas, donde la experiencia es propia de la persona.',
      en: 'It is always "we": in concepts, social media, sales presentations and company artefacts. It does not apply to articles on the Miradas blog, where the experience belongs to the author.',
      ca: "Sempre és nosaltres: en conceptes, xarxes socials, presentacions comercials i artefactes d'empresa. No s'aplica als articles del blog Miradas, on l'experiència és pròpia de la persona.",
    },
  },
];

export const voiceInclusive: Trilingual = {
  es: 'Usamos un lenguaje neutro en género siempre que sea posible. Preferimos construcciones que incluyan a todas las personas: «el equipo», «quien lidera», «las personas que participan». Evitamos el masculino genérico cuando hay una alternativa natural.',
  en: 'We use gender-neutral language wherever possible. We prefer constructions that include everyone: "the team", "whoever leads", "the people taking part". This matters most in Spanish and Catalan, where we avoid the generic masculine whenever there is a natural alternative.',
  ca: "Fem servir un llenguatge neutre en gènere sempre que és possible. Preferim construccions que incloguin totes les persones: «l'equip», «qui lidera», «les persones que hi participen». Evitem el masculí genèric quan hi ha una alternativa natural.",
};

export const voiceValues: readonly { id: string; title: Trilingual; body: Trilingual }[] = [
  {
    id: 'tribu',
    title: { es: 'Tribu', en: 'Tribe', ca: 'Tribu' },
    body: {
      es: 'Escribimos en primera persona del plural. No hay ego individual en los textos de Interactius. El «nosotros» no es retórico: refleja que el trabajo es colectivo y que el cliente forma parte del proceso. Solo se habla en primera persona en experiencias personales.',
      en: 'We write in the first person plural. There is no individual ego in Interactius texts. The "we" is not rhetorical: it reflects that the work is collective and that the client is part of the process. The first person singular is kept for personal experiences.',
      ca: "Escrivim en primera persona del plural. No hi ha ego individual en els textos d'Interactius. El «nosaltres» no és retòric: reflecteix que la feina és col·lectiva i que el client forma part del procés. Només es parla en primera persona en experiències personals.",
    },
  },
  {
    id: 'humana',
    title: { es: 'Humana', en: 'Human', ca: 'Humana' },
    body: {
      es: 'La complejidad humana es nuestro punto de partida. Los textos no hablan de usuarios ni de stakeholders: hablan de personas que toman decisiones en contextos concretos.',
      en: 'Human complexity is our starting point. Our texts do not talk about users or stakeholders: they talk about people making decisions in specific contexts.',
      ca: "La complexitat humana és el nostre punt de partida. Els textos no parlen d'usuaris ni de stakeholders: parlen de persones que prenen decisions en contextos concrets.",
    },
  },
  {
    id: 'honesta',
    title: { es: 'Honesta', en: 'Honest', ca: 'Honesta' },
    body: {
      es: 'Nombramos lo que está pasando, no lo que sería más fácil escuchar. No maquillamos diagnósticos. La claridad, aunque incómoda, es una forma de respeto.',
      en: 'We name what is happening, not what would be easier to hear. We do not dress up diagnoses. Clarity, even when uncomfortable, is a form of respect.',
      ca: 'Anomenem el que està passant, no el que seria més fàcil d\'escoltar. No maquillem diagnòstics. La claredat, encara que incòmoda, és una forma de respecte.',
    },
  },
  {
    id: 'critica',
    title: { es: 'Crítica', en: 'Critical', ca: 'Crítica' },
    body: {
      es: 'Cuestionamos. No solo la primera respuesta: también la nuestra. Los textos de Interactius no confirman lo que el lector ya sabe: lo invitan a pensar diferente.',
      en: 'We question. Not only the first answer: our own as well. Interactius texts do not confirm what the reader already knows: they invite them to think differently.',
      ca: "Qüestionem. No només la primera resposta: també la nostra. Els textos d'Interactius no confirmen el que el lector ja sap: el conviden a pensar diferent.",
    },
  },
];

/* Los cuatro ejes de tono. `body` junta los dos polos en un párrafo (es lo que leen los prompts);
   `more` dice dónde pesa más cada polo, que es lo que pinta la sección. */
export type VoiceAxis = {
  id: string;
  title: Trilingual;
  body: Trilingual;
  more: readonly [{ pole: Trilingual; in: Trilingual }, { pole: Trilingual; in: Trilingual }];
};

export const voiceAxesIntro: Trilingual = {
  es: 'La voz es fija. El tono se ajusta. Cada eje expresa una tensión que sostenemos: no elegimos un polo ni el otro, nos movemos entre los dos según el contexto.',
  en: 'The voice is fixed. The tone adjusts. Each axis expresses a tension we hold: we do not pick one pole or the other, we move between the two according to the context.',
  ca: "La veu és fixa. El to s'ajusta. Cada eix expressa una tensió que sostenim: no triem un pol ni l'altre, ens movem entre tots dos segons el context.",
};

export const voiceAxes: readonly VoiceAxis[] = [
  {
    id: 'directa-reflexiva',
    title: { es: 'Directa, pero reflexiva', en: 'Direct, but reflective', ca: 'Directa, però reflexiva' },
    body: {
      es: 'Directa cuando la situación exige claridad inmediata: una propuesta, un diagnóstico, un CTA. Reflexiva cuando el contexto invita al pensamiento: un artículo, una introducción conceptual. Nunca tan directa que resulte brusca. Nunca tan reflexiva que se pierda el hilo.',
      en: 'Direct when the situation demands immediate clarity: a proposal, a diagnosis, a CTA. Reflective when the context invites thought: an article, a conceptual introduction. Never so direct that it turns blunt. Never so reflective that the thread gets lost.',
      ca: "Directa quan la situació exigeix claredat immediata: una proposta, un diagnòstic, un CTA. Reflexiva quan el context convida a pensar: un article, una introducció conceptual. Mai tan directa que resulti brusca. Mai tan reflexiva que es perdi el fil.",
    },
    more: [
      {
        pole: { es: 'Más directa en', en: 'More direct in', ca: 'Més directa en' },
        in: { es: 'LinkedIn y redes, propuestas comerciales, web (home y servicios), CTAs.', en: 'LinkedIn and social media, sales proposals, website (home and services), CTAs.', ca: 'LinkedIn i xarxes, propostes comercials, web (home i serveis), CTA.' },
      },
      {
        pole: { es: 'Más reflexiva en', en: 'More reflective in', ca: 'Més reflexiva en' },
        in: { es: 'Artículos del blog Miradas y newsletter Liminal Thinkers, El Entre y concepto de marca, presentaciones estratégicas.', en: 'Miradas blog articles and the Liminal Thinkers newsletter, El Entre and the brand concept, strategic presentations.', ca: "Articles del blog Miradas i newsletter Liminal Thinkers, El Entre i concepte de marca, presentacions estratègiques." },
      },
    ],
  },
  {
    id: 'cercana-profesional',
    title: { es: 'Cercana, pero profesional', en: 'Close, but professional', ca: 'Propera, però professional' },
    body: {
      es: 'Cercana porque hablamos de tú, usamos oraciones cortas cuando importa y no fingimos distancia institucional. Profesional porque la calidez no sacrifica el rigor. Sin emojis. Sin jerga de agencia creativa. Sin informalidad que reste criterio.',
      en: 'Close because we address the reader informally, use short sentences when it matters and do not fake institutional distance. Professional because warmth does not sacrifice rigour. No emojis. No creative-agency jargon. No informality that undermines judgement.',
      ca: "Propera perquè parlem de tu, fem servir oracions curtes quan importa i no fingim distància institucional. Professional perquè la calidesa no sacrifica el rigor. Sense emojis. Sense argot d'agència creativa. Sense informalitat que resti criteri.",
    },
    more: [
      {
        pole: { es: 'Más cercana en', en: 'Closer in', ca: 'Més propera en' },
        in: { es: 'Newsletter, posts de LinkedIn.', en: 'Newsletter, LinkedIn posts.', ca: 'Newsletter, posts de LinkedIn.' },
      },
      {
        pole: { es: 'Más profesional en', en: 'More professional in', ca: 'Més professional en' },
        in: { es: 'Propuestas y documentos, web corporativa, casos de éxito.', en: 'Proposals and documents, corporate website, case studies.', ca: "Propostes i documents, web corporativa, casos d'èxit." },
      },
    ],
  },
  {
    id: 'segura-humilde',
    title: { es: 'Segura, pero humilde', en: 'Confident, but humble', ca: 'Segura, però humil' },
    body: {
      es: 'Segura porque tenemos criterio y lo expresamos sin rodeos. Humilde porque ese criterio viene de la escucha y de la exploración, no de la presunción. No decimos «creemos que» si lo sabemos. No decimos «sabemos que» si es una hipótesis.',
      en: 'Confident because we have judgement and state it plainly. Humble because that judgement comes from listening and exploring, not from presumption. We do not say "we believe" if we know. We do not say "we know" if it is a hypothesis.',
      ca: "Segura perquè tenim criteri i l'expressem sense embuts. Humil perquè aquest criteri ve de l'escolta i de l'exploració, no de la presumpció. No diem «creiem que» si ho sabem. No diem «sabem que» si és una hipòtesi.",
    },
    more: [
      {
        pole: { es: 'Más segura en', en: 'More confident in', ca: 'Més segura en' },
        in: { es: 'Titulares y afirmaciones de marca, diagnósticos y propuestas, posicionamiento.', en: 'Headlines and brand statements, diagnoses and proposals, positioning.', ca: 'Titulars i afirmacions de marca, diagnòstics i propostes, posicionament.' },
      },
      {
        pole: { es: 'Más humilde en', en: 'More humble in', ca: 'Més humil en' },
        in: { es: 'Artículos de opinión, casos donde el aprendizaje es el valor, contenido de proceso.', en: 'Opinion pieces, cases where the learning is the value, process content.', ca: "Articles d'opinió, casos on l'aprenentatge és el valor, contingut de procés." },
      },
    ],
  },
  {
    id: 'filosofica-practica',
    title: { es: 'Filosófica, pero práctica', en: 'Philosophical, but practical', ca: 'Filosòfica, però pràctica' },
    body: {
      es: 'Filosófica porque operamos en El Entre: el espacio entre disciplinas donde los conceptos importan. Práctica porque todo concepto debe servir para algo. Nunca filosofía decorativa. Nunca practicidad sin marco de sentido.',
      en: 'Philosophical because we operate in El Entre: the space between disciplines where concepts matter. Practical because every concept must be useful. Never decorative philosophy. Never practicality without a frame of meaning.',
      ca: "Filosòfica perquè operem a El Entre: l'espai entre disciplines on els conceptes importen. Pràctica perquè tot concepte ha de servir per a alguna cosa. Mai filosofia decorativa. Mai practicitat sense marc de sentit.",
    },
    more: [
      {
        pole: { es: 'Más filosófica en', en: 'More philosophical in', ca: 'Més filosòfica en' },
        in: { es: 'El Entre y concepto de marca, artículos del blog, presentaciones de visión.', en: 'El Entre and the brand concept, blog articles, vision presentations.', ca: 'El Entre i concepte de marca, articles del blog, presentacions de visió.' },
      },
      {
        pole: { es: 'Más práctica en', en: 'More practical in', ca: 'Més pràctica en' },
        in: { es: 'Casos de éxito, web de servicios, propuestas y metodología.', en: 'Case studies, services pages, proposals and methodology.', ca: "Casos d'èxit, web de serveis, propostes i metodologia." },
      },
    ],
  },
];

/* Tabla de referencia rápida: cómo se coloca el tono en cada pieza. Las cuatro columnas siguen
   el orden de voiceAxes. «Equilibrio» = a medio camino entre los dos polos. */
export const toneByChannel: readonly { channel: Trilingual; axes: readonly [Trilingual, Trilingual, Trilingual, Trilingual] }[] = [
  {
    channel: { es: 'Web · home y servicios', en: 'Website · home and services', ca: 'Web · home i serveis' },
    axes: [
      { es: 'Muy directa', en: 'Very direct', ca: 'Molt directa' },
      { es: 'Cercana', en: 'Close', ca: 'Propera' },
      { es: 'Segura', en: 'Confident', ca: 'Segura' },
      { es: 'Práctica', en: 'Practical', ca: 'Pràctica' },
    ],
  },
  {
    channel: { es: 'Web · El Entre y concepto', en: 'Website · El Entre and concept', ca: 'Web · El Entre i concepte' },
    axes: [
      { es: 'Reflexiva', en: 'Reflective', ca: 'Reflexiva' },
      { es: 'Profesional', en: 'Professional', ca: 'Professional' },
      { es: 'Humilde', en: 'Humble', ca: 'Humil' },
      { es: 'Filosófica', en: 'Philosophical', ca: 'Filosòfica' },
    ],
  },
  {
    channel: { es: 'LinkedIn · posts', en: 'LinkedIn · posts', ca: 'LinkedIn · posts' },
    axes: [
      { es: 'Directa', en: 'Direct', ca: 'Directa' },
      { es: 'Muy cercana', en: 'Very close', ca: 'Molt propera' },
      { es: 'Segura', en: 'Confident', ca: 'Segura' },
      { es: 'Práctica', en: 'Practical', ca: 'Pràctica' },
    ],
  },
  {
    channel: { es: 'Propuesta comercial', en: 'Sales proposal', ca: 'Proposta comercial' },
    axes: [
      { es: 'Directa', en: 'Direct', ca: 'Directa' },
      { es: 'Profesional', en: 'Professional', ca: 'Professional' },
      { es: 'Segura', en: 'Confident', ca: 'Segura' },
      { es: 'Práctica', en: 'Practical', ca: 'Pràctica' },
    ],
  },
  {
    channel: { es: 'Artículo y newsletter', en: 'Article and newsletter', ca: 'Article i newsletter' },
    axes: [
      { es: 'Reflexiva', en: 'Reflective', ca: 'Reflexiva' },
      { es: 'Cercana', en: 'Close', ca: 'Propera' },
      { es: 'Humilde', en: 'Humble', ca: 'Humil' },
      { es: 'Filosófica', en: 'Philosophical', ca: 'Filosòfica' },
    ],
  },
  {
    channel: { es: 'Presentación (deck)', en: 'Presentation (deck)', ca: 'Presentació (deck)' },
    axes: [
      { es: 'Directa', en: 'Direct', ca: 'Directa' },
      { es: 'Profesional', en: 'Professional', ca: 'Professional' },
      { es: 'Segura', en: 'Confident', ca: 'Segura' },
      { es: 'Equilibrio', en: 'Balanced', ca: 'Equilibri' },
    ],
  },
  {
    channel: { es: 'Bio del equipo', en: 'Team bio', ca: "Bio de l'equip" },
    axes: [
      { es: 'Directa', en: 'Direct', ca: 'Directa' },
      { es: 'Cercana', en: 'Close', ca: 'Propera' },
      { es: 'Humilde', en: 'Humble', ca: 'Humil' },
      { es: 'Práctica', en: 'Practical', ca: 'Pràctica' },
    ],
  },
];

/* ─── Marco de escritura ─── */

export type WritingRule = { title: Trilingual; body: Trilingual; advisory?: boolean };

export const writingStructure: readonly WritingRule[] = [
  {
    title: { es: 'Lo más importante, primero', en: 'Most important first', ca: 'El més important, primer' },
    body: {
      es: 'No guardamos el argumento principal para el final. La primera frase debe justificar que el lector siga leyendo. Aplica a los artículos del blog Miradas y a las publicaciones en redes.',
      en: 'We do not save the main argument for the end. The first sentence must justify reading on. This applies to Miradas blog articles and social media posts.',
      ca: "No guardem l'argument principal per al final. La primera frase ha de justificar que el lector continuï llegint. S'aplica als articles del blog Miradas i a les publicacions a xarxes.",
    },
  },
  {
    title: { es: 'Una idea por párrafo', en: 'One idea per paragraph', ca: 'Una idea per paràgraf' },
    body: {
      es: 'Cada párrafo tiene un núcleo. Si puedes identificar dos ideas independientes, sepáralas. Los párrafos de más de 6 líneas casi siempre pueden dividirse.',
      en: 'Each paragraph has one core. If you can spot two independent ideas, split them. Paragraphs longer than 6 lines can almost always be divided.',
      ca: 'Cada paràgraf té un nucli. Si pots identificar dues idees independents, separa-les. Els paràgrafs de més de 6 línies gairebé sempre es poden dividir.',
    },
  },
  {
    title: { es: 'El título hace trabajo real', en: 'The headline does real work', ca: 'El títol fa feina real' },
    body: {
      es: 'Un titular de Interactius no describe: plantea. No dice «Cómo mejorar la toma de decisiones» sino «Las decisiones que no se cuestionan se repiten». Debe funcionar solo, sin el resto de la página.',
      en: 'An Interactius headline does not describe: it poses. Not "How to improve decision-making" but "Decisions that go unquestioned get repeated". It must work on its own, without the rest of the page.',
      ca: "Un titular d'Interactius no descriu: planteja. No diu «Com millorar la presa de decisions» sinó «Les decisions que no es qüestionen es repeteixen». Ha de funcionar sol, sense la resta de la pàgina.",
    },
  },
  {
    title: { es: 'Las listas tienen criterio', en: 'Lists have a reason', ca: 'Les llistes tenen criteri' },
    body: {
      es: 'Usamos listas cuando los elementos son genuinamente paralelos y discretos. Si los puntos necesitan conectores lógicos para tener sentido, deberían ser prosa.',
      en: 'We use lists when the items are genuinely parallel and discrete. If the points need logical connectors to make sense, they should be prose.',
      ca: 'Fem servir llistes quan els elements són genuïnament paral·lels i discrets. Si els punts necessiten connectors lògics per tenir sentit, haurien de ser prosa.',
    },
  },
];

/** Frases: 15–22 palabras DE MEDIA. Más cortas para enfatizar. Lo usa lib/eval.ts. */
export const sentenceLength = { min: 15, max: 22, unit: 'words' } as const;

export const lengthGuide: readonly WritingRule[] = [
  {
    title: { es: 'Frases', en: 'Sentences', ca: 'Frases' },
    body: { es: `${sentenceLength.min}–${sentenceLength.max} palabras de media. Más cortas para enfatizar.`, en: `${sentenceLength.min}–${sentenceLength.max} words on average. Shorter for emphasis.`, ca: `${sentenceLength.min}–${sentenceLength.max} paraules de mitjana. Més curtes per emfatitzar.` },
  },
  {
    title: { es: 'Párrafos', en: 'Paragraphs', ca: 'Paràgrafs' },
    body: { es: '3–5 frases. Máximo 6 líneas en pantalla.', en: '3–5 sentences. At most 6 lines on screen.', ca: '3–5 frases. Màxim 6 línies en pantalla.' },
  },
  {
    title: { es: 'Titulares', en: 'Headlines', ca: 'Titulars' },
    body: { es: '6–10 palabras.', en: '6–10 words.', ca: '6–10 paraules.' },
  },
  {
    title: { es: 'Posts de LinkedIn', en: 'LinkedIn posts', ca: 'Posts de LinkedIn' },
    body: { es: '700–1.000 caracteres. La primera frase, visible sin expandir, es el gancho.', en: '700–1,000 characters. The first sentence, visible without expanding, is the hook.', ca: "700–1.000 caràcters. La primera frase, visible sense desplegar, és el ganxo." },
    advisory: true,
  },
  {
    title: { es: 'Artículos', en: 'Articles', ca: 'Articles' },
    body: { es: 'Entre 6.000 y 8.000 caracteres.', en: 'Between 6,000 and 8,000 characters.', ca: 'Entre 6.000 i 8.000 caràcters.' },
    advisory: true,
  },
  {
    title: { es: 'Propuestas', en: 'Proposals', ca: 'Propostes' },
    body: { es: 'Máximo 2 páginas de texto corrido. El resto, tablas y esquemas.', en: 'At most 2 pages of running text. The rest, tables and diagrams.', ca: "Màxim 2 pàgines de text seguit. La resta, taules i esquemes." },
    advisory: true,
  },
  {
    title: { es: 'Newsletter', en: 'Newsletter', ca: 'Newsletter' },
    body: { es: 'Máximo 1.000 caracteres, idealmente con CTA.', en: 'At most 1,000 characters, ideally with a CTA.', ca: 'Màxim 1.000 caràcters, idealment amb CTA.' },
    advisory: true,
  },
];

/* Puntuación y gramática. `advisory: true` = el documento lo marca como «aconsejable, no
   requerimiento estricto». Ninguna regla de esta lista bloquea un texto en el evaluador. */
export const punctuationRules: readonly (WritingRule & { id: string })[] = [
  {
    id: 'punto-seguido',
    title: { es: 'Punto y seguido por defecto', en: 'Full stop, not a new paragraph, by default', ca: 'Punt i seguit per defecte' },
    body: { es: 'El punto y aparte se reserva para cambios de idea, no para estética visual.', en: 'A new paragraph is kept for a change of idea, not for visual effect.', ca: "El punt i a part es reserva per a canvis d'idea, no per a estètica visual." },
  },
  {
    id: 'dos-puntos',
    title: { es: 'Dos puntos para presentar, no para continuar', en: 'Colons introduce, they do not continue', ca: 'Dos punts per presentar, no per continuar' },
    body: { es: 'Los dos puntos introducen algo concreto: una lista, una cita, un ejemplo.', en: 'A colon introduces something specific: a list, a quote, an example.', ca: 'Els dos punts introdueixen una cosa concreta: una llista, una cita, un exemple.' },
  },
  {
    id: 'negritas',
    title: { es: 'Sin abuso de negritas', en: 'No overuse of bold', ca: 'Sense abús de negretes' },
    body: { es: 'La negrita señala términos o frases clave.', en: 'Bold marks key terms or phrases.', ca: 'La negreta assenyala termes o frases clau.' },
  },
  {
    id: 'exclamaciones',
    title: { es: 'Sin exclamaciones', en: 'No exclamation marks', ca: 'Sense exclamacions' },
    body: { es: 'La energía viene del contenido, no de la puntuación. Una exclamación señala que el argumento falla.', en: 'Energy comes from the content, not the punctuation. An exclamation mark signals that the argument is failing.', ca: "L'energia ve del contingut, no de la puntuació. Una exclamació assenyala que l'argument falla." },
    advisory: true,
  },
  {
    id: 'mayusculas',
    title: { es: 'Mayúsculas con criterio', en: 'Capitals with judgement', ca: 'Majúscules amb criteri' },
    body: { es: 'Solo para nombres propios, inicio de frase y títulos de sección. No para dar importancia a conceptos.', en: 'Only for proper names, the start of a sentence and section titles. Never to make a concept look important.', ca: "Només per a noms propis, inici de frase i títols de secció. No per donar importància a conceptes." },
  },
  {
    id: 'genero',
    title: { es: 'Lenguaje neutro en género', en: 'Gender-neutral language', ca: 'Llenguatge neutre en gènere' },
    body: { es: 'Preferimos formas que incluyan a todas las personas: «el equipo», «quien lidera», «las personas involucradas». Evitamos el masculino genérico cuando existe una alternativa natural y fluida.', en: 'We prefer forms that include everyone: "the team", "whoever leads", "the people involved". In Spanish and Catalan we avoid the generic masculine when a natural, fluent alternative exists.', ca: "Preferim formes que incloguin totes les persones: «l'equip», «qui lidera», «les persones implicades». Evitem el masculí genèric quan hi ha una alternativa natural i fluida." },
    advisory: true,
  },
];

/** Pares del documento: cómo sí y cómo no. */
export const writingExamples: readonly { yes: Trilingual; no: Trilingual }[] = [
  {
    yes: {
      es: 'Ayudamos a organizaciones a decidir mejor combinando diseño estratégico y pensamiento crítico. Llevamos más de 14 años haciéndolo.',
      en: 'We help organisations decide better by combining strategic design and critical thinking. We have been doing it for more than 14 years.',
      ca: 'Ajudem organitzacions a decidir millor combinant disseny estratègic i pensament crític. Fa més de 14 anys que ho fem.',
    },
    no: {
      es: 'Somos una consultora de diseño estratégico con más de 14 años de experiencia ayudando a las organizaciones a transformar su manera de operar mediante procesos de innovación centrados en las personas.',
      en: 'We are a strategic design consultancy with more than 14 years of experience helping organisations transform the way they operate through people-centred innovation processes.',
      ca: "Som una consultora de disseny estratègic amb més de 14 anys d'experiència ajudant les organitzacions a transformar la seva manera d'operar mitjançant processos d'innovació centrats en les persones.",
    },
  },
  {
    yes: {
      es: 'No llegamos con soluciones. Llegamos con preguntas que el problema todavía no se ha hecho.',
      en: 'We do not arrive with solutions. We arrive with questions the problem has not yet asked itself.',
      ca: "No arribem amb solucions. Arribem amb preguntes que el problema encara no s'ha fet.",
    },
    no: {
      es: 'Nuestro enfoque holístico e innovador nos permite ofrecer soluciones creativas y disruptivas que generan valor para nuestros clientes.',
      en: 'Our holistic, innovative approach lets us offer creative, disruptive solutions that generate value for our clients.',
      ca: 'El nostre enfocament holístic i innovador ens permet oferir solucions creatives i disruptives que generen valor per als nostres clients.',
    },
  },
  {
    yes: {
      es: 'Este proyecto empezó con una pregunta que nadie en el equipo quería responder. Aquí está lo que encontramos.',
      en: 'This project began with a question nobody on the team wanted to answer. Here is what we found.',
      ca: "Aquest projecte va començar amb una pregunta que ningú de l'equip volia respondre. Aquí hi ha el que vam trobar.",
    },
    no: {
      es: '¡Estamos muy emocionados de presentaros este proyecto que hemos desarrollado con mucho esfuerzo y dedicación!',
      en: 'We are so excited to share this project, which we have developed with a lot of effort and dedication!',
      ca: "Estem molt emocionats de presentar-vos aquest projecte que hem desenvolupat amb molt d'esforç i dedicació!",
    },
  },
];

/* ─── Vocabulario de marca ─── */

export const brandVocabulary: readonly { term: Trilingual; meaning: Trilingual }[] = [
  { term: { es: 'Criterio', en: 'Judgement', ca: 'Criteri' }, meaning: { es: 'Expresa juicio fundamentado, no opinión. Una de nuestras palabras nucleares.', en: 'Grounded judgement, not opinion. One of our core words.', ca: 'Expressa judici fonamentat, no opinió. Una de les nostres paraules nuclears.' } },
  { term: { es: 'Claridad', en: 'Clarity', ca: 'Claredat' }, meaning: { es: 'No simplicidad. La claridad de Interactius puede ser compleja, pero no opaca.', en: 'Not simplicity. Interactius clarity can be complex, but never opaque.', ca: "No simplicitat. La claredat d'Interactius pot ser complexa, però no opaca." } },
  { term: { es: 'Decidir', en: 'Decide', ca: 'Decidir' }, meaning: { es: 'Verbo de acción concreta. Nuestro trabajo siempre apunta a decisiones mejor tomadas.', en: 'A verb of concrete action. Our work always aims at better decisions.', ca: "Verb d'acció concreta. La nostra feina sempre apunta a decisions més ben preses." } },
  { term: { es: 'Tensión', en: 'Tension', ca: 'Tensió' }, meaning: { es: 'No es sinónimo de problema. La tensión productiva es el territorio donde operamos.', en: 'Not a synonym for problem. Productive tension is the territory we work in.', ca: 'No és sinònim de problema. La tensió productiva és el territori on operem.' } },
  { term: { es: 'Marco', en: 'Frame', ca: 'Marc' }, meaning: { es: 'Como estructura conceptual, no como límite. Damos marcos para que otros piensen.', en: 'A conceptual structure, not a limit. We give frames so others can think.', ca: "Com a estructura conceptual, no com a límit. Donem marcs perquè d'altres pensin." } },
  { term: { es: 'Entre', en: 'Between (Entre)', ca: 'Entre' }, meaning: { es: 'Preposición y concepto. El espacio donde confluyen disciplinas y miradas.', en: 'A preposition and a concept. The space where disciplines and perspectives meet.', ca: 'Preposició i concepte. L\'espai on conflueixen disciplines i mirades.' } },
  { term: { es: 'Rigor', en: 'Rigour', ca: 'Rigor' }, meaning: { es: 'Contrapeso natural de la creatividad. Nos distingue de las agencias.', en: 'The natural counterweight to creativity. It sets us apart from agencies.', ca: 'Contrapès natural de la creativitat. Ens distingeix de les agències.' } },
  { term: { es: 'Profundidad', en: 'Depth', ca: 'Profunditat' }, meaning: { es: 'Opuesto a «tendencia» o «quick win». Lo que queda cuando el ruido se va.', en: 'The opposite of "trend" or "quick win". What remains when the noise is gone.', ca: 'Oposat a «tendència» o «quick win». El que queda quan el soroll se\'n va.' } },
  { term: { es: 'Evidencia', en: 'Evidence', ca: 'Evidència' }, meaning: { es: 'Lo que valida una hipótesis. Siempre preferible a «feeling» o «intuición».', en: 'What validates a hypothesis. Always preferable to "feeling" or "intuition".', ca: 'El que valida una hipòtesi. Sempre preferible a «feeling» o «intuïció».' } },
  { term: { es: 'Escalar', en: 'Scale', ca: 'Escalar' }, meaning: { es: 'Con evidencia, no con esperanza. Reducir el riesgo antes de escalar es parte de nuestro lenguaje del offering.', en: 'With evidence, not with hope. Reducing risk before scaling is part of how we describe our offering.', ca: "Amb evidència, no amb esperança. Reduir el risc abans d'escalar és part del nostre llenguatge de l'offering." } },
  { term: { es: 'Criterio compartido', en: 'Shared judgement', ca: 'Criteri compartit' }, meaning: { es: 'El resultado de trabajar juntos no son entregables: es criterio que el equipo puede usar solo.', en: 'The result of working together is not deliverables: it is judgement the team can use on its own.', ca: "El resultat de treballar junts no són lliurables: és criteri que l'equip pot fer servir sol." } },
];

/* Keywords de posicionamiento. `accent` enlaza cada pilar con su color de servicio
   (colorsAccent): Opal = estrategia, Burdeos = experiencias, Esmeralda = cultura. */
export const pillarKeywords: readonly { id: string; accent: string; title: Trilingual; keywords: readonly { term: Trilingual; body: Trilingual }[] }[] = [
  {
    id: 'pensamiento-estrategico',
    accent: 'Opal',
    title: { es: 'Pensamiento estratégico', en: 'Strategic thinking', ca: 'Pensament estratègic' },
    keywords: [
      { term: { es: 'Claridad antes de velocidad', en: 'Clarity before speed', ca: 'Claredat abans que velocitat' }, body: { es: 'El problema de muchas organizaciones no es falta de datos, sino falta de criterio para usarlos.', en: 'The problem for many organisations is not a lack of data but a lack of judgement to use it.', ca: 'El problema de moltes organitzacions no és la falta de dades, sinó la falta de criteri per fer-les servir.' } },
      { term: { es: 'Toma de decisiones', en: 'Decision-making', ca: 'Presa de decisions' }, body: { es: 'El resultado de todo proceso estratégico son decisiones mejores, no documentos más elaborados.', en: 'The outcome of any strategic process is better decisions, not more elaborate documents.', ca: 'El resultat de tot procés estratègic són decisions millors, no documents més elaborats.' } },
      { term: { es: 'Contexto y visión de futuro', en: 'Context and future vision', ca: 'Context i visió de futur' }, body: { es: 'Decidir sin contexto es improvisar. Nuestro trabajo es construir el marco antes de elegir la dirección.', en: 'Deciding without context is improvising. Our job is to build the frame before choosing the direction.', ca: "Decidir sense context és improvisar. La nostra feina és construir el marc abans de triar la direcció." } },
      { term: { es: 'Diagnóstico estratégico', en: 'Strategic diagnosis', ca: 'Diagnòstic estratègic' }, body: { es: 'Antes de resolver, hay que entender qué problema merece ser resuelto.', en: 'Before solving, we need to understand which problem deserves solving.', ca: 'Abans de resoldre, cal entendre quin problema mereix ser resolt.' } },
      { term: { es: 'Prospectiva / Foresight', en: 'Foresight', ca: 'Prospectiva / Foresight' }, body: { es: 'Anticipar escenarios no es predecir el futuro: es prepararse para varios a la vez.', en: 'Anticipating scenarios is not predicting the future: it is preparing for several at once.', ca: 'Anticipar escenaris no és predir el futur: és preparar-se per a diversos alhora.' } },
    ],
  },
  {
    id: 'diseno-experiencias',
    accent: 'Burdeos',
    title: { es: 'Diseño de experiencias', en: 'Experience design', ca: "Disseny d'experiències" },
    keywords: [
      { term: { es: 'Reducir el riesgo antes de escalar', en: 'Reduce risk before scaling', ca: "Reduir el risc abans d'escalar" }, body: { es: 'Validamos antes de invertir. La evidencia reemplaza la suposición en cada fase del proceso.', en: 'We validate before investing. Evidence replaces assumption at every stage of the process.', ca: 'Validem abans d\'invertir. L\'evidència substitueix la suposició a cada fase del procés.' } },
      { term: { es: 'Diseño de productos y servicios', en: 'Product and service design', ca: 'Disseny de productes i serveis' }, body: { es: 'Diseñamos lo que funciona para las personas que lo van a usar, en condiciones reales.', en: 'We design what works for the people who will use it, in real conditions.', ca: 'Dissenyem el que funciona per a les persones que ho faran servir, en condicions reals.' } },
      { term: { es: 'Validación con usuarios reales', en: 'Validation with real users', ca: 'Validació amb usuaris reals' }, body: { es: 'Una buena idea solo lo es si funciona en contacto con la realidad.', en: 'A good idea is only good if it works in contact with reality.', ca: 'Una bona idea només ho és si funciona en contacte amb la realitat.' } },
      { term: { es: 'Clonica', en: 'Clonica', ca: 'Clonica' }, body: { es: 'Nombre de producto propio. Se escribe siempre sin acento: Clonica. No abreviar ni traducir.', en: 'Our own product name. Always written without an accent: Clonica. Never abbreviated or translated.', ca: "Nom de producte propi. S'escriu sempre sense accent: Clonica. No abreujar ni traduir." } },
      { term: { es: 'Prototipado e iteración', en: 'Prototyping and iteration', ca: 'Prototipatge i iteració' }, body: { es: 'Cuanto antes se valida, menos cuesta corregir. La velocidad está en el ciclo, no en la ejecución lineal.', en: 'The sooner you validate, the less it costs to correct. Speed lies in the cycle, not in linear execution.', ca: 'Com més aviat es valida, menys costa corregir. La velocitat és al cicle, no a l\'execució lineal.' } },
    ],
  },
  {
    id: 'transformacion-cultural',
    accent: 'Esmeralda',
    title: { es: 'Transformación cultural', en: 'Cultural transformation', ca: 'Transformació cultural' },
    keywords: [
      { term: { es: 'Cambio cultural sostenido', en: 'Sustained cultural change', ca: 'Canvi cultural sostingut' }, body: { es: 'El cambio más difícil no es tecnológico ni estructural: es cultural. Acompañamos el proceso desde dentro.', en: 'The hardest change is neither technological nor structural: it is cultural. We support the process from within.', ca: 'El canvi més difícil no és tecnològic ni estructural: és cultural. Acompanyem el procés des de dins.' } },
      { term: { es: 'Capacidad interna', en: 'Internal capability', ca: 'Capacitat interna' }, body: { es: 'El objetivo no es que dependan de nosotros: es que el equipo pueda avanzar sin nosotros.', en: 'The goal is not for them to depend on us: it is for the team to move forward without us.', ca: "L'objectiu no és que depenguin de nosaltres: és que l'equip pugui avançar sense nosaltres." } },
      { term: { es: 'Organizaciones aumentadas con IA', en: 'AI-augmented organisations', ca: 'Organitzacions augmentades amb IA' }, body: { es: 'La IA amplifica a las personas que saben pensar, decidir y crear. No reemplaza el criterio: lo potencia.', en: 'AI amplifies people who know how to think, decide and create. It does not replace judgement: it strengthens it.', ca: 'La IA amplifica les persones que saben pensar, decidir i crear. No substitueix el criteri: el potencia.' } },
      { term: { es: 'Narrativas organizacionales', en: 'Organisational narratives', ca: 'Narratives organitzacionals' }, body: { es: 'Las organizaciones cambian cuando cambia la historia que se cuentan a sí mismas.', en: 'Organisations change when the story they tell themselves changes.', ca: 'Les organitzacions canvien quan canvia la història que s\'expliquen a si mateixes.' } },
      { term: { es: 'Bootcamps y workshops', en: 'Bootcamps and workshops', ca: 'Bootcamps i workshops' }, body: { es: 'Formatos propios de transferencia de capacidad. Aprender haciendo, no escuchando.', en: 'Our own formats for transferring capability. Learning by doing, not by listening.', ca: 'Formats propis de transferència de capacitat. Aprendre fent, no escoltant.' } },
    ],
  },
];

/* ─── Por canal ─── La voz es la misma; el formato, la longitud y el nivel de tono varían. */

export const channelGuides: readonly {
  id: 'web' | 'linkedin' | 'propuestas';
  title: Trilingual;
  rules: readonly { label: Trilingual; body: Trilingual }[];
  example?: { yes: Trilingual; no: Trilingual };
}[] = [
  {
    id: 'web',
    title: { es: 'Web · textos de página, titulares y CTAs', en: 'Website · page copy, headlines and CTAs', ca: 'Web · textos de pàgina, titulars i CTA' },
    rules: [
      { label: { es: 'Principio', en: 'Principle', ca: 'Principi' }, body: { es: 'La web de Interactius no explica quiénes somos: demuestra cómo pensamos. Cada texto debe hacer una pregunta o plantear una tensión. No describir un servicio: activar una necesidad.', en: 'The Interactius website does not explain who we are: it shows how we think. Every text should ask a question or pose a tension. Not describe a service: activate a need.', ca: "La web d'Interactius no explica qui som: demostra com pensem. Cada text ha de fer una pregunta o plantejar una tensió. No descriure un servei: activar una necessitat." } },
      { label: { es: 'Titulares', en: 'Headlines', ca: 'Titulars' }, body: { es: 'Frase activa, verbo al inicio o tensión explícita. Sin adjetivos de superioridad (líder, referente, innovador). El titular debe funcionar solo, sin el resto de la página.', en: 'An active sentence, verb first or an explicit tension. No superiority adjectives (leading, benchmark, innovative). The headline must work on its own, without the rest of the page.', ca: "Frase activa, verb a l'inici o tensió explícita. Sense adjectius de superioritat (líder, referent, innovador). El titular ha de funcionar sol, sense la resta de la pàgina." } },
      { label: { es: 'Cuerpo de texto', en: 'Body copy', ca: 'Cos de text' }, body: { es: 'Párrafos de máximo 3–4 líneas en pantalla. Primera frase: la idea más importante. Sin jerga técnica sin explicar.', en: 'Paragraphs of at most 3–4 lines on screen. First sentence: the most important idea. No unexplained technical jargon.', ca: 'Paràgrafs de màxim 3–4 línies en pantalla. Primera frase: la idea més important. Sense argot tècnic sense explicar.' } },
    ],
  },
  {
    id: 'linkedin',
    title: { es: 'LinkedIn y redes sociales', en: 'LinkedIn and social media', ca: 'LinkedIn i xarxes socials' },
    rules: [
      { label: { es: 'Formato del post', en: 'Post format', ca: 'Format del post' }, body: { es: 'La primera frase, visible sin expandir, es el gancho. No empieza por «Me alegra anunciar», «Estamos encantados» ni «Hoy quiero compartir».', en: 'The first sentence, visible without expanding, is the hook. Never open with "Happy to announce", "We are delighted" or "Today I want to share".', ca: "La primera frase, visible sense desplegar, és el ganxo. No comença per «M'alegra anunciar», «Estem encantats» ni «Avui vull compartir»." } },
      { label: { es: 'Estructura recomendada', en: 'Recommended structure', ca: 'Estructura recomanada' }, body: { es: '1. Tensión o pregunta (una frase). 2. Contexto mínimo necesario (2–3 frases). 3. Lo que Interactius hizo, aprendió u observó. 4. Cierre con implicación o pregunta abierta.', en: '1. Tension or question (one sentence). 2. The minimum context needed (2–3 sentences). 3. What Interactius did, learned or observed. 4. Close with an implication or an open question.', ca: "1. Tensió o pregunta (una frase). 2. Context mínim necessari (2–3 frases). 3. El que Interactius va fer, va aprendre o va observar. 4. Tancament amb una implicació o una pregunta oberta." } },
      { label: { es: 'Tono', en: 'Tone', ca: 'To' }, body: { es: 'Más cercano que en la web, sin perder rigor. Primera persona del plural salvo en los posts de autor individual. Sin hashtags en el cuerpo; tres al final. Sin emojis.', en: 'Closer than on the website, without losing rigour. First person plural except in individual author posts. No hashtags in the body; three at the end. No emojis.', ca: "Més proper que a la web, sense perdre rigor. Primera persona del plural tret dels posts d'autor individual. Sense hashtags al cos; tres al final. Sense emojis." } },
    ],
    example: {
      yes: {
        es: 'Diseñamos una propuesta de valor para un equipo directivo que llevaba dos años midiendo lo mismo y llegando a conclusiones distintas. El problema no era la medición. Era el marco.',
        en: 'We designed a value proposition for a leadership team that had spent two years measuring the same thing and reaching different conclusions. The problem was not the measurement. It was the frame.',
        ca: 'Vam dissenyar una proposta de valor per a un equip directiu que feia dos anys que mesurava el mateix i arribava a conclusions diferents. El problema no era la mesura. Era el marc.',
      },
      no: {
        es: '¡Estamos muy orgullosos de compartir este caso de éxito donde pusimos en práctica nuestra metodología de diseño estratégico!',
        en: 'We are so proud to share this success story where we put our strategic design methodology into practice!',
        ca: "Estem molt orgullosos de compartir aquest cas d'èxit on vam posar en pràctica la nostra metodologia de disseny estratègic!",
      },
    },
  },
  {
    id: 'propuestas',
    title: { es: 'Propuestas y documentos comerciales', en: 'Proposals and sales documents', ca: 'Propostes i documents comercials' },
    rules: [
      { label: { es: 'Principio', en: 'Principle', ca: 'Principi' }, body: { es: 'Una propuesta de Interactius no vende: diagnostica. Quien la lee debe pensar «esto me describe». El tono es el de alguien que ya ha entendido el problema, no el de alguien que intenta convencer.', en: 'An Interactius proposal does not sell: it diagnoses. Whoever reads it should think "this describes me". The tone is that of someone who has already understood the problem, not someone trying to persuade.', ca: "Una proposta d'Interactius no ven: diagnostica. Qui la llegeix ha de pensar «això em descriu». El to és el d'algú que ja ha entès el problema, no el d'algú que intenta convèncer." } },
      { label: { es: 'Estructura narrativa', en: 'Narrative structure', ca: 'Estructura narrativa' }, body: { es: '1. El problema real (no el que se enunció en el brief). 2. Por qué no se ha resuelto antes. 3. Nuestra hipótesis de trabajo. 4. Cómo lo abordamos (proceso, no promesas). 5. Lo que se puede esperar (concreto, no genérico).', en: '1. The real problem (not the one stated in the brief). 2. Why it has not been solved before. 3. Our working hypothesis. 4. How we approach it (process, not promises). 5. What can be expected (specific, not generic).', ca: "1. El problema real (no el que es va enunciar al brief). 2. Per què no s'ha resolt abans. 3. La nostra hipòtesi de treball. 4. Com l'abordem (procés, no promeses). 5. El que es pot esperar (concret, no genèric)." } },
      { label: { es: 'Normas', en: 'Rules', ca: 'Normes' }, body: { es: 'No usar «cliente»: usar el nombre de la organización. Evitar el futuro genérico («Identificaremos oportunidades»); mejor «En las sesiones de diagnóstico, mapearemos…».', en: 'Do not say "client": use the organisation\'s name. Avoid the generic future ("We will identify opportunities"); better "In the diagnostic sessions, we will map…".', ca: "No fer servir «client»: fer servir el nom de l'organització. Evitar el futur genèric («Identificarem oportunitats»); millor «A les sessions de diagnòstic, mapejarem…»." } },
    ],
  },
];

/* ─── Bloque de voz para LLMs ───
   Un solo texto con las reglas de escritura, compuesto desde lo de arriba. Lo comparten el botón
   «Copiar prompt» de la sección, el master prompt, /llms.txt y ReWrit_r, para que ninguno
   redacte la voz a mano y se desalinee. */
export type VoiceLocale = 'es' | 'en' | 'ca';

const VOICE_LABELS: Record<VoiceLocale, Record<'principle' | 'profile' | 'isNot' | 'values' | 'axes' | 'structure' | 'length' | 'punctuation' | 'vocabulary' | 'advisory' | 'inclusive', string>> = {
  es: { principle: 'Principio de voz', profile: 'Perfil', isNot: 'Lo que la voz no es', values: 'Valores', axes: 'Ejes de tono (nos movemos entre los dos polos según el contexto)', structure: 'Estructura', length: 'Longitud', punctuation: 'Puntuación y gramática', vocabulary: 'Palabras que nos representan', advisory: 'aconsejable', inclusive: 'Tono neutro e inclusivo' },
  en: { principle: 'Voice principle', profile: 'Profile', isNot: 'What the voice is not', values: 'Values', axes: 'Tone axes (we move between the two poles according to context)', structure: 'Structure', length: 'Length', punctuation: 'Punctuation and grammar', vocabulary: 'Words that represent us', advisory: 'advisable', inclusive: 'Neutral, inclusive tone' },
  ca: { principle: 'Principi de veu', profile: 'Perfil', isNot: 'El que la veu no és', values: 'Valors', axes: "Eixos de to (ens movem entre els dos pols segons el context)", structure: 'Estructura', length: 'Longitud', punctuation: 'Puntuació i gramàtica', vocabulary: 'Paraules que ens representen', advisory: 'aconsellable', inclusive: 'To neutre i inclusiu' },
};

/* `compact` quita lo que una herramienta con sus propios controles ya cubre: la definición larga de
   la voz y la tabla de longitudes por canal (ReWrit_r fija la longitud con su propio selector). */
export function voiceRulesText(l: VoiceLocale, opts: { compact?: boolean } = {}): string {
  const L = VOICE_LABELS[l];
  const full = !opts.compact;
  const tag = (r: WritingRule) => (r.advisory ? ` (${L.advisory})` : '');
  const rule = (r: WritingRule) => `- ${r.title[l]}: ${r.body[l]}${tag(r)}`;
  return [
    `${L.principle}: ${voicePrinciple[l]}`,
    `${L.profile}: ${voiceProfile[l]}`,
    ...(full ? [voiceDefinition[l]] : []),
    '',
    `${L.isNot}:`,
    ...voiceIsNot.map((n) => `- ${n.title[l]}. ${n.body[l]}`),
    '',
    `${L.inclusive}: ${voiceInclusive[l]}`,
    '',
    `${L.values}:`,
    ...voiceValues.map((v) => `- ${v.title[l]}: ${v.body[l]}`),
    '',
    `${L.axes}:`,
    ...voiceAxes.map((a) => `- ${a.title[l]}. ${a.body[l]} ${a.more[0].pole[l]}: ${a.more[0].in[l]} ${a.more[1].pole[l]}: ${a.more[1].in[l]}`),
    '',
    `${L.structure}:`,
    ...writingStructure.map(rule),
    '',
    ...(full ? [`${L.length}:`, ...lengthGuide.map(rule), ''] : []),
    `${L.punctuation}:`,
    ...punctuationRules.map(rule),
    '',
    `${L.vocabulary}: ${brandVocabulary.map((w) => w.term[l]).join(', ')}.`,
  ].join('\n');
}


export const logoMinSize = {
  print: '10 mm de altura mínima',
  digital: '20 píxeles de altura mínima',
} as const;

export const brand = {
  name: 'Interactius',
  wordmark: 'interactīus',
  tagline: { es: 'Actitud liminal', en: 'Liminal attitude', ca: 'Actitud liminal' },
  /* Registro de versión del manual — el `v2_07.26` de la esquina inferior izquierda.
     ESTE es el único sitio donde se toca. Hasta 2026-07-31 estaba escrito a mano en seis
     (aquí, los tres messages/*.json y a pelo en Sidebar.tsx y MenuOverlay.tsx), así que
     actualizarlo no servía de nada: en pantalla seguía saliendo el valor viejo.

     `version` es decisión editorial: se sube cuando el manual cambia de edición, no cuando se
     commitea. `versionDate` es solo el respaldo — en un build con git, la fecha real la calcula
     next.config.mjs a partir del último commit que tocó contenido de marca. */
  version: 'v3',
  versionDate: '2026-11',
  concept: {
    es: 'El Macrón ortográfico sobre la ī indica la vocal larga y la pronunciación correcta del logotipo. La marca utiliza este recurso como juego gráfico y dinámico.',
    en: 'The orthographic Macron over the ī marks the long vowel and the correct pronunciation of the logotype. The brand uses it as a graphic and dynamic device.',
    ca: 'El Macró ortogràfic sobre la ī indica la vocal llarga i la pronunciació correcta del logotip. La marca utilitza aquest recurs com a joc gràfic i dinàmic.',
  },
  visualUniverse: {
    es: 'Fotografía conceptual que captura el movimiento, la ambigüedad y la pausa. Representación de lo liminal: el espacio de transición y el concepto del Entre (el vacío con significado).',
    en: 'Conceptual photography that captures movement, ambiguity and pause. A representation of the liminal: the space of transition and the concept of the In-between (the void with meaning).',
    ca: 'Fotografia conceptual que captura el moviment, l\'ambigüitat i la pausa. Representació d\'allò liminal: l\'espai de transició i el concepte de l\'Entre (el buit amb significat).',
  },
};

/* Etiqueta de versión tal y como se lee en pantalla: `v2_07.26` (vN_MM.AA).
   Único origen para la esquina inferior izquierda (Sidebar y MenuOverlay). No la escribas a mano
   en ningún componente: era justo lo que hacía que actualizar la versión no tuviera efecto.

   La fecha sale del build cuando hay git (next.config.mjs → último commit que tocó contenido de
   marca); si no, cae al `versionDate` de arriba. Cualquiera de las dos vías da el mismo formato. */
function toMMYY(iso: string): string {
  const [year, month] = iso.split('-');
  return `${month}.${year.slice(2)}`;
}

export const versionLabel = `${brand.version}_${
  process.env.NEXT_PUBLIC_BRAND_VERSION_DATE || toMMYY(brand.versionDate)
}`;

/* ─── Few-shot examples (capa pedagógica para LLMs y humanos) ───
   v0 redactado desde la matriz dura; revisado el 2026-11-20 con el documento «Identidad verbal»
   (sin lista roja: los rechazados fallan por voz, no por palabras). Iterar conforme se aprueben
   piezas reales. Los aprobados respetan sentenceLength (15-22 palabras de media). */

export type FewShotExampleStatus = 'approved' | 'rejected';
export type FewShotExampleFormat =
  | 'headline'
  | 'lead'
  | 'social-post'
  | 'email-intro'
  | 'deck-cover';

export type FewShotExample = {
  id: string;
  format: FewShotExampleFormat;
  status: FewShotExampleStatus;
  text: { es: string; en: string; ca: string };
  rationale: { es: string; en: string; ca: string };
  violations?: readonly string[];
  rewrite?: { es: string; en: string; ca: string };
};

export const examples: readonly FewShotExample[] = [
  {
    id: 'headline-landing',
    format: 'headline',
    status: 'approved',
    text: {
      es: 'Trabajamos en el espacio que existe entre la decisión obvia y la decisión que aún nadie ha defendido.',
      en: "We work in the space between the obvious decision and the decision no one has defended yet.",
      ca: 'Treballem en l\'espai que existeix entre la decisió òbvia i la decisió que encara ningú no ha defensat.',
    },
    rationale: {
      es: 'Encarna la actitud liminal sin nombrarla. Sintaxis directa de 18 palabras y vocabulario propio: plantea, no describe.',
      en: 'Embodies the liminal attitude without naming it. Direct syntax at 17 words and distinctive vocabulary: it poses, it does not describe.',
      ca: 'Encarna l\'actitud liminal sense anomenar-la. Sintaxi directa de 18 paraules i vocabulari propi: planteja, no descriu.',
    },
  },
  {
    id: 'lead-servicio',
    format: 'lead',
    status: 'approved',
    text: {
      es: 'Diseñamos servicios para empresas que ya no creen que la claridad nace de añadir más capas a un proceso. Cada proyecto empieza preguntando qué pieza del sistema sostiene realmente la conversación con quien decide.',
      en: 'We design services for companies that no longer believe clarity comes from adding more layers to a process. Every project begins by asking which piece of the system actually carries the conversation with whoever decides.',
      ca: 'Dissenyem serveis per a empreses que ja no creuen que la claredat neix d\'afegir més capes a un procés. Cada projecte comença preguntant quina peça del sistema sosté realment la conversa amb qui decideix.',
    },
    rationale: {
      es: 'Dos frases en rango (19 y 15 palabras) con tono crítico-constructivo. Posicionamiento antes que descripción de servicios.',
      en: 'Two sentences in range (18 and 17 words) with a critical-constructive tone. Positioning rather than service description.',
      ca: 'Dues frases en rang (19 i 15 paraules) amb to crític-constructiu. Posicionament abans que descripció de serveis.',
    },
  },
  {
    id: 'social-post-linkedin',
    format: 'social-post',
    status: 'approved',
    text: {
      es: 'La mayoría de procesos de diseño no fallan por falta de creatividad, fallan por exceso de consenso temprano. Decidir antes de tiempo no acelera el proyecto: atasca el siguiente cruce de criterio donde había algo importante que escuchar. El trabajo de un diseñador con criterio empieza por defender la duda durante el tiempo que esa duda merece.',
      en: "Most design processes don't fail for lack of creativity, they fail from too much consensus too early. Deciding ahead of time doesn't speed the project up: it jams the next crossing of criterion that was actually worth hearing. A designer with judgement starts by defending the doubt for as long as that doubt deserves.",
      ca: 'La majoria de processos de disseny no fallen per falta de creativitat, fallen per excés de consens primerenc. Decidir abans d\'hora no accelera el projecte: encalla el següent encreuament de criteri on hi havia alguna cosa important a escoltar. La feina d\'un dissenyador amb criteri comença per defensar el dubte durant el temps que aquell dubte mereix.',
    },
    rationale: {
      es: 'Tres frases en rango (18, 20, 19) que defienden una hipótesis incómoda. Cercana y profesional, sin exclamaciones y sin léxico de consultora.',
      en: 'Three sentences in range (17, 21, 16) defending an uncomfortable hypothesis. Close and professional, no exclamation marks, no consultancy lexicon.',
      ca: 'Tres frases en rang (18, 20, 19) que defensen una hipòtesi incòmoda. Propera i professional, sense exclamacions i sense lèxic de consultora.',
    },
  },
  {
    id: 'email-intro-cliente',
    format: 'email-intro',
    status: 'approved',
    text: {
      es: 'Antes de proponer cualquier alcance, nos interesa entender cómo decide hoy el equipo y qué fricción concreta justifica abrir esta conversación. Lo que enviemos después dependerá menos de plantillas internas y más de la respuesta a esas dos preguntas.',
      en: 'Before we propose any scope, we want to understand how your team decides today and what specific friction justifies opening this conversation. Whatever we send next will depend less on internal templates and more on the answer to those two questions.',
      ca: 'Abans de proposar cap abast, ens interessa entendre com decideix avui l\'equip i quina fricció concreta justifica obrir aquesta conversa. El que enviem després dependrà menys de plantilles internes i més de la resposta a aquestes dues preguntes.',
    },
    rationale: {
      es: 'Marca distancia técnica desde la primera línea: invierte el orden habitual (entender antes que proponer). Dos frases en 21 y 18 palabras.',
      en: 'Sets technical distance from the first line: inverts the usual order (understand before proposing). Two sentences at 22 and 19 words.',
      ca: 'Marca distància tècnica des de la primera línia: inverteix l\'ordre habitual (entendre abans que proposar). Dues frases en 21 i 18 paraules.',
    },
  },
  {
    id: 'deck-cover',
    format: 'deck-cover',
    status: 'approved',
    text: {
      es: 'La estrategia de un servicio no se redacta, se prueba el día en que alguien tiene que defender una decisión incómoda.\n\nDiagnóstico de criterios y arquitectura de decisión preparado para [Cliente] como base de la propuesta presentada en mayo de 2026.',
      en: "A service strategy isn't written, it gets tested the day someone in the room has to defend an uncomfortable decision out loud.\n\nCriteria diagnostic and decision architecture prepared for [Client] as the basis of the proposal delivered in May 2026.",
      ca: 'L\'estratègia d\'un servei no es redacta, es prova el dia en què algú ha de defensar una decisió incòmoda.\n\nDiagnòstic de criteris i arquitectura de decisió preparat per a [Client] com a base de la proposta presentada el maig de 2026.',
    },
    rationale: {
      es: 'Titular fuerte (21 palabras) que activa criterio en lugar de declararlo. Bajada formal completa como frase, no como etiqueta.',
      en: 'A sharp title (22 words) that activates judgement rather than declaring it. A full-sentence subtitle, not a label.',
      ca: 'Titular fort (21 paraules) que activa criteri en lloc de declarar-lo. Baixada formal completa com a frase, no com a etiqueta.',
    },
  },
  {
    id: 'rejected-superlativos',
    format: 'headline',
    status: 'rejected',
    text: {
      es: 'Diseñamos soluciones innovadoras y holísticas para empresas líderes que buscan un impacto disruptivo y revolucionario en su sector.',
      en: 'We design innovative, holistic solutions for leading companies seeking disruptive impact and revolutionary momentum in their sector.',
      ca: 'Dissenyem solucions innovadores i holístiques per a empreses líders que busquen un impacte disruptiu i revolucionari en el seu sector.',
    },
    violations: [
      'voice:superlatives',
      'voice:generic-consultancy',
    ],
    rationale: {
      es: 'Un titular que describe en vez de plantear y se apoya en adjetivos de superioridad («innovadoras», «líderes», «revolucionario»). Ninguna palabra está prohibida: lo que falla es que podría firmarlo cualquier consultora.',
      en: 'A headline that describes instead of posing and leans on superiority adjectives ("innovative", "leading", "revolutionary"). No word is banned: what fails is that any consultancy could sign it.',
      ca: 'Un titular que descriu en lloc de plantejar i es recolza en adjectius de superioritat («innovadores», «líders», «revolucionari»). Cap paraula està prohibida: el que falla és que el podria signar qualsevol consultora.',
    },
    rewrite: {
      es: 'Diseñamos servicios para equipos que necesitan rediscutir las decisiones que su industria da por descontadas.',
      en: 'We design services for teams that need to re-question the decisions their industry takes for granted.',
      ca: 'Dissenyem serveis per a equips que necessiten rediscutir les decisions que la seva indústria dóna per descomptades.',
    },
  },
  {
    id: 'rejected-length-over',
    format: 'lead',
    status: 'rejected',
    text: {
      es: 'En interactīus diseñamos servicios pensando en cada detalle del recorrido completo del usuario desde el momento exacto en que descubre la marca hasta que decide volver, asegurando que cada paso intermedio refleje una atención obsesiva al criterio del cliente final, sin perder el espíritu de la marca.',
      en: "At interactīus we design services thinking carefully about every detail of the user's complete journey from the precise moment they discover the brand until they decide to return, making sure each intermediate step reflects an obsessive attention to the final client's criterion without losing the spirit of the brand.",
      ca: 'A interactīus dissenyem serveis pensant en cada detall del recorregut complet de l\'usuari des del moment exacte en què descobreix la marca fins que decideix tornar, assegurant que cada pas intermedi reflecteixi una atenció obsessiva al criteri del client final, sense perdre l\'esperit de la marca.',
    },
    violations: ['length:over_max'],
    rationale: {
      es: 'Una única frase de 47 palabras: rompe el techo de sentenceLength (22) y diluye la idea principal en aposiciones sucesivas.',
      en: 'A single 48-word sentence: breaks the sentenceLength ceiling (22) and dilutes the core idea across successive appositions.',
      ca: 'Una única frase de 47 paraules: trenca el sostre de sentenceLength (22) i dilueix la idea principal en aposicions successives.',
    },
    rewrite: {
      es: 'En interactīus diseñamos servicios cuidando cada paso del recorrido del usuario, desde el primer contacto hasta el retorno. Cada decisión intermedia refleja el criterio del cliente final sin diluir el carácter de la marca durante el proceso.',
      en: "At interactīus we design services caring for every step of the user's journey, from first contact to return. Every intermediate decision reflects the final client's criterion without diluting the brand's character along the way.",
      ca: 'A interactīus dissenyem serveis tenint cura de cada pas del recorregut de l\'usuari, des del primer contacte fins al retorn. Cada decisió intermèdia reflecteix el criteri del client final sense diluir el caràcter de la marca durant el procés.',
    },
  },
  {
    id: 'rejected-exclamation',
    format: 'social-post',
    status: 'rejected',
    text: {
      es: '¡Estamos muy emocionados de presentaros este proyecto que hemos desarrollado con mucho esfuerzo y dedicación!',
      en: 'We are so excited to share this project, which we have developed with a lot of effort and dedication!',
      ca: "Estem molt emocionats de presentar-vos aquest projecte que hem desenvolupat amb molt d'esforç i dedicació!",
    },
    violations: ['punctuation:exclamation', 'voice:aplauso'],
    rationale: {
      es: 'Ejemplo del propio documento de identidad verbal. La exclamación pone la energía en la puntuación y no en el contenido, y el texto habla del esfuerzo del equipo en vez de lo que se encontró.',
      en: "An example from the verbal identity document itself. The exclamation puts the energy in the punctuation instead of the content, and the text talks about the team's effort instead of what was found.",
      ca: "Exemple del mateix document d'identitat verbal. L'exclamació posa l'energia en la puntuació i no en el contingut, i el text parla de l'esforç de l'equip en lloc del que es va trobar.",
    },
    rewrite: {
      es: 'Este proyecto empezó con una pregunta que nadie en el equipo quería responder. Aquí está lo que encontramos.',
      en: 'This project began with a question nobody on the team wanted to answer. Here is what we found.',
      ca: "Aquest projecte va començar amb una pregunta que ningú de l'equip volia respondre. Aquí hi ha el que vam trobar.",
    },
  },
  {
    id: 'rejected-aplauso',
    format: 'social-post',
    status: 'rejected',
    text: {
      es: 'Ha sido un absoluto honor acompañar a este increíble equipo que ha demostrado un compromiso ejemplar con cada hito del proyecto.',
      en: 'It has been an absolute honour to accompany this incredible team that has shown exemplary commitment to every milestone of the project.',
      ca: 'Ha estat un absolut honor acompanyar aquest increïble equip que ha demostrat un compromís exemplar amb cada fita del projecte.',
    },
    violations: ['voice:aplauso'],
    rationale: {
      es: 'Pasa los filtros automáticos pero busca aplauso: "absoluto honor", "increíble", "ejemplar". Viola el principio de voz.',
      en: 'Passes the automated checks but seeks applause: "absolute honour", "incredible", "exemplary". Violates the voice principle.',
      ca: 'Passa els filtres automàtics però busca aplaudiment: "absolut honor", "increïble", "exemplar". Viola el principi de veu.',
    },
    rewrite: {
      es: 'El equipo cumplió cada hito sin necesitar refuerzos retóricos, lo que hace que la lectura del proyecto sea más honesta.',
      en: "The team hit every milestone without needing rhetorical reinforcement, which makes the project's reading more honest.",
      ca: 'L\'equip va complir cada fita sense necessitar reforços retòrics, cosa que fa que la lectura del projecte sigui més honesta.',
    },
  },
  {
    id: 'rejected-consultora-generica',
    format: 'lead',
    status: 'rejected',
    text: {
      es: 'Acompañamos a organizaciones complejas en procesos de cambio cultural, desde la definición estratégica hasta la activación operativa en la estructura.',
      en: 'We accompany complex organisations through cultural change processes, from strategic definition to operational activation at every level of the structure.',
      ca: 'Acompanyem organitzacions complexes en processos de canvi cultural, des de la definició estratègica fins a l\'activació operativa en l\'estructura.',
    },
    violations: ['voice:generic-consultancy'],
    rationale: {
      es: 'El caso más peligroso: pasa todos los filtros automáticos pero podría ser de McKinsey. Léxico institucional vacío, cero posicionamiento.',
      en: 'The most dangerous case: passes every automated filter but could be McKinsey. Empty institutional lexicon, zero positioning.',
      ca: 'El cas més perillós: passa tots els filtres automàtics però podria ser de McKinsey. Lèxic institucional buit, zero posicionament.',
    },
    rewrite: {
      es: 'Trabajamos con organizaciones donde cualquier cambio cultural depende de quién en la estructura está dispuesto a defenderlo cuando incomode.',
      en: 'We work with organisations where any cultural change depends on who in the structure will defend it when it becomes uncomfortable.',
      ca: 'Treballem amb organitzacions on qualsevol canvi cultural depèn de qui dins l\'estructura està disposat a defensar-lo quan incomodi.',
    },
  },
];
