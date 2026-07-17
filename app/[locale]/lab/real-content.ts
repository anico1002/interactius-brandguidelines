/* LOCAL SANDBOX — not part of the product, do not ship.

   Every layout filled with copy lifted from the decks that actually shipped (TMB, QualitaHub and
   Naturgy, in lib/deck/__tests__/fixtures/saved/), mixed on purpose to hit the hard cases: TMB's
   cover title is the longest one written, its roadmap runs four phases, QualitaHub's objectives
   carry bold. Dummy copy makes type look fine at any size — real copy is the only thing that shows
   whether a layout holds.

   Where a layout has never been used in a real deck (enunciado, texto, lista, columnas), the copy
   still comes from a real one, moved across.

   Remote image URLs are swapped for local /universo assets so the sandbox works offline. */
export const REAL_MD = `[ly: portada]
# Auditoria d'experiència i diagnòstic d'arquitectura de decisió per a la TMB App
Diagnòstic de criteris i arquitectura de decisió per a l'ecommerce de la marca.
> cliente: TMB
![Portada · universo visual](/universo/universo-02.jpg)

---

[ly: enunciado]
ESPAI LIMINAL
## Al centre no passa res de nou. És previsible, còmode i avui, la manera més ràpida de tornar-se irrellevant.

---

[ly: texto]
CONTEXT
Es tracta d'una empresa especialitzada en la instal·lació de dispositius de telemetria que, després d'anys subcontractant programari extern, ha decidit desenvolupar la seva pròpia solució SaaS per optimitzar la gestió de flotes i oferir-la a altres distribuïdors.

Actualment, el mercat està dominat per eines amb una experiència d'usuari deficient i un disseny visual tradicional. QualitaHub busca trencar aquesta dinàmica amb un producte que destaqui per la seva facilitat d'ús i una imatge moderna, similar a la d'un banc digital, llest per a SEO.

---

[ly: lista]
## ¿Cómo lo haremos?
- Auditoría heurística del recorrido completo
- Pruebas con usuarios reales
- Backlog de oportunidades ordenado por criterio

---

[ly: columnas]
## Enfoque
### Tipología
Mystery shopping aplicado a canal online, enfoque mixto.
### Unidad de análisis
El pedido completo, evaluado en dos momentos.
### Momentos
Cuatro semanas de seguimiento y evaluación.

---

[ly: split-izq]
EL REPTE
# Dissenyar una nova identitat de marca i una landing d'alt impacte que transformi la percepció de la gestió de flotes en un ecosistema tecnològic àgil amb la sofisticació visual d'un neobanc.
![El reto](/universo/universo-01.jpg)

---

[ly: split-der]
CONTEXT
# D'on partim
Es tracta d'una empresa especialitzada en la instal·lació de dispositius de telemetria que, després d'anys subcontractant programari extern, ha decidit desenvolupar la seva pròpia solució SaaS per optimitzar la gestió de flotes i oferir-la a altres distribuïdors. Actualment, el mercat està dominat per eines amb una experiència d'usuari (UX) deficient i un disseny visual tradicional.
![D'on partim](/universo/universo-04.jpg)

---

[ly: contexto]
CONTEXT
TMB té l'oportunitat d'evolucionar el seu ecosistema digital després de la integració de la T-mobilitat. Després de tres generacions d'aplicacions, el repte actual rau a mitigar la fricció detectada en processos crítics i alinear l'experiència de l'App amb les expectatives d'una audiència massiva i diversa.

---

[ly: reto]
EL REPTE
# Entendre la relació dels usuaris amb l'App, detectar barreres d'adopció i optimitzar la percepció del servei oficial.
![El reto](/universo/universo-04.jpg)

---

[ly: objetivos]
## Objectius
- **Definir el posicionament estratègic**: Establir els valors i la personalitat de la marca QualitaHub.
- **Crear una identitat visual disruptiva**: Dissenyar un univers visual fresc que s'allunyi dels estàndards del sector de transports.
- **Dissenyar una Landing Page d'alt impacte**: Desenvolupar una interfície optimitzada per a la conversió i l'explicació clara del producte SaaS.
- **Garantir l'escalabilitat**: Proporcionar un UI Kit complet que permeti aplicar la nova marca a les futures fases de desenvolupament del producte.
- **Optimització SEO**: Assegurar que la nova plataforma estigui tècnicament preparada per posicionar-se en els cercadors des del llançament.
![Objetivos](/universo/universo-03.jpg)

---

[ly: roadmap]
## Roadmap
Estimem una durada total de 8 setmanes, assegurant el lliurament abans de la data límit del 31/10/2026.

### Anàlisi Preliminar i Immersió
Immersió total en l'ecosistema de TMB per alinear objectius de negoci i definir les hipòtesis que es validaran amb els usuaris.
- **Anàlisi de dades i context:** Estudi de mètriques d'ús, feedback de les stores i incidències d'atenció al client.
- **Auditoria Heurística:** Avaluació experta basada en els 10 principis de Nielsen per identificar friccions evidents.
- **Inception Lab:** Taller col·laboratiu per alinear objectius i definir hipòtesis de validació.

### Investigació Qualitativa
Exploració de la dimensió emocional i contextual mitjançant entrevistes en profunditat per entendre les motivacions i la relació de confiança amb l'App.
- **Expectatives i Motivacions:** Investigació sobre la percepció de la TMB App com a "aplicació oficial".
- **Grau de coneixement:** Anàlisi de la proposta de valor (T-mobilitat i multimodalitat) més enllà de l'ús bàsic.

### Test d'Usabilitat
Avaluació de l'eficàcia de l'app en escenaris reals mitjançant l'observació directa amb usuaris.
- **Execució de 6 tests:** Sessions individuals (50% iOS / 50% Android) amb usuaris reals.
- **Casos d'ús crítics:** Validació de processos com registre a T-mobilitat i recàrrega de targetes.
- **Inclusió i Accessibilitat:** Participació de perfils amb necessitats específiques (invidents i PMR).

### Anàlisi de Resultats i Pla de Millora
Consolidació de totes les troballes en un informe executiu que permeti traçar el pla d'accions evolutives.
- **Classificació per Gravetat:** Categorització segons la nomenclatura de TMB (Crític, Seriós i Menor).
- **Matriu d'Impacte/Esforç:** Elaboració d'un backlog prioritzat per a la presa de decisions.
- **Definició de bases per a l'estudi quantitatiu:** Establiment de KPIs i punts de monitoratge futurs.

---

[ly: gantt]
## Calendari
semanas: 8
Anàlisi Preliminar i Immersió: 1-2
Investigació Qualitativa: 2-4
Test d'Usabilitat: 4-6
Anàlisi de Resultats i Pla de Millora: 7-8
hitos client: 1, 2, 3, 4, 5, 6, 7, 8

---

[ly: presupuesto]
## Pressupost
- Anàlisi Heurística: 3.315 €
- Benchmark Android/Mobile: 3.770 €
- Immersió + gestió: 3.991 €
### Condiciones
- Emissió de factura inicial pel 60% del total del projecte un cop rebuda l'ordre de compra a l'inici del projecte.
- Emissió de factura final pel 40% del total del projecte un cop realitzada l'entrega.
- A l'import s'hi afegirà l'IVA corresponent d'acord amb la legislació vigent.
- Cobrament de factures a 30 dies, dia de pagament habitual del client.
- Aquesta proposta econòmica té una validesa de tres mesos a partir de la data de la mateixa.

---

[ly: manifiesto]

---

[ly: equipo]
Al centre no passa res de nou. És previsible, còmode i avui, la manera més ràpida de tornar-se irrellevant.

Per això vam decidir operar als marges, allò ambigu, allò incert. Aquí hi ha les veritats humanes. I aquí decidim quedar-nos.

Treballem des d'aquest **espai liminal**, entre el que és i el que ha de venir. Ho fem qüestionant allò evident i desplaçant el focus, amb criteri i perspectiva humana.

No encaixem en etiquetes ni en vestim.

Som un company: proper, implicat i enfocat en allò que realment importa. Treballem amb rigor, naturalitat i criteri.

---

[ly: clientes]

---

[ly: aceptacion]

---

[ly: cierre]
# Gràcies
www.interactius.com
`;
