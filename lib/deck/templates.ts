import type { DeckType } from './types.ts';

/* Starter Markdown per deck type. Each slide declares its layout with a `[ly: …]` marker.
   Brand pages (manifiesto/equipo/clientes/aceptación) ship their canonical copy inline so
   every word is editable in the editor and reaches the translator. Leaving a brand block
   empty still falls back to the same copy baked into the component. */

const COMERCIAL = `[ly: portada]
# Propuesta de colaboración
Diagnóstico de criterios y arquitectura de decisión para el ecommerce de la marca.
> cliente: Naturgy
![Portada · universo visual](/universo/universo-02.jpg)

---

[ly: manifiesto]
# Ayudamos a las organizaciones en momentos de / transformación / a decidir con criterio.
Convertimos la estrategia en soluciones que perduran.

---

[ly: equipo]
**En el centro no pasa nada nuevo.** Es previsible, cómodo y hoy, la forma más rápida de volverse irrelevante.
Por eso decidimos operar en los márgenes, lo ambiguo, lo incierto. Ahí están las verdades humanas. Y ahí decidimos quedarnos.
Trabajamos desde ese **espacio liminal**, entre lo que es y lo que está por venir. Lo hacemos cuestionando lo evidente y desplazando el foco, con criterio y perspectiva humana.
**No encajamos en etiquetas ni vestimos de ellas.**
Somos un **compañero**: cercano, implicado y enfocado en lo que realmente importa. Trabajamos con rigor, naturalidad y criterio.
![Equipo Interactius](/presentaciones/team.png)

---

[ly: clientes]
- Productos financieros
- Sector público
- Retail-moda
- Medios/deportes
- Seguros
- Educación
- Otros
![Clientes de Interactius](/presentaciones/clients-grid.png)

---

[ly: contexto]
CONTEXTO
Naturgy tiene la oportunidad de establecer un **nuevo estándar digital** que unifique su experiencia online y aporte coherencia, escalabilidad y alineación con la marca. Hoy existen inconsistencias en experiencia, diseño y flujos que generan fricción y reducen eficiencia.

---

[ly: reto]
EL RETO
# Incrementar la conversión en el ecommerce principal de la marca
![El reto](/universo/universo-01.jpg)

---

[ly: objetivos]
## Objetivos
- Establecer una línea base cuantificada del nivel de calidad actual por país, tipología de pedido y modalidad de recogida.
- Identificar qué dimensiones, mercados o tipologías presentan mayor frecuencia y severidad de incidencias.
- Comparar el rendimiento entre países para detectar diferencias operativas significativas.
![Objetivos](/universo/universo-03.jpg)

---

[ly: roadmap]
## Roadmap
Estimamos que la duración del proyecto será de 6 semanas.
### Diagnóstico
La fase de inmersión nos permite comprender el contexto actual y las expectativas del proyecto.
¿Qué hacemos?
- Kick Off: alineación de objetivos y definición del marco.
- Inmersión inicial: revisión de fuentes internas y externas.
### Discovery
Investigación exhaustiva que combina la inmersión con la experiencia del usuario.
¿Qué hacemos?
- Mapa de tendencias y competencia.
- Entrevistas en profundidad.

---

[ly: gantt]
## Roadmap
semanas: 8
Diagnóstico: 1-1.5
Discovery: 2-3
Volumetría: 4-8
hitos cliente: 1, 3, 5, 8

---

[ly: presupuesto]
## Presupuesto
- Análisis Heurístico: 3.315 €
- Benchmark Android/Mobile: 3.770 €
- Inmersión + gestión: 3.991 €
### Condiciones
- Emisión de factura inicial por el 60% del total del proyecto una vez recibida la orden de compra al inicio del proyecto.
- Emisión de factura final por el 40% del total del proyecto una vez realizada la entrega.
- Al importe se le añadirá el IVA correspondiente de acuerdo con la legislación vigente.
- Cobro de facturas a 30 días, día de pago habitual del cliente.
- Esta propuesta económica tiene una validez de tres meses a partir de la fecha de la misma.

---

[ly: aceptacion]
# Aprobación del presupuesto
nombre: CARLOS RUIZ RE
cargo: co-CEO / Administrador
empresa: Happy User Experiences S.L.
nif: B65914848
direccion: Pau Claris 100, 2ª Planta 08009 Barcelona
aviso: La firma de esta página acuerda la aceptación total de la propuesta presentada en este documento.
cta: ¡Una firma y empezamos!
![Firma](/presentaciones/sign.png)

---

[ly: cierre]
# Gracias
www.interactius.com
`;

const INFORME = `[ly: portada]
# Informe de resultados
Resumen ejecutivo del proyecto.
> cliente: Cliente
![Portada](/universo/universo-02.jpg)

---

[ly: contexto]
CONTEXTO
Describe aquí el contexto del informe en un párrafo claro y directo de entre quince y veintidós palabras por frase.

---

[ly: objetivos]
## Objetivos
- Primer objetivo del informe.
- Segundo objetivo del informe.
![Objetivos](/universo/universo-03.jpg)

---

[ly: roadmap]
## Roadmap
### Fase 1
Descripción de la fase.
¿Qué hacemos?
- Tarea uno.
- Tarea dos.

---

[ly: cierre]
# Gracias
www.interactius.com
`;

const GENERICA = `[ly: portada]
# Título de la presentación
Subtítulo descriptivo de la propuesta.
![Portada](/universo/universo-02.jpg)

---

[ly: enunciado]
NUESTRA MIRADA
# Una afirmación breve y contundente

---

[ly: texto]
Un párrafo de cuerpo con la idea principal, escrito con frases directas de entre quince y veintidós palabras.

---

[ly: lista]
## Puntos clave
- Primer punto.
- Segundo punto.
- Tercer punto.

---

[ly: cierre]
# Gracias
www.interactius.com
`;

export const TEMPLATES: Record<DeckType, string> = {
  comercial: COMERCIAL,
  informe: INFORME,
  generica: GENERICA,
};
