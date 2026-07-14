import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../parse.ts';
import { classify } from '../classify.ts';
import { parseGantt } from '../blocks.ts';
import { compileDeck } from '../index.ts';
import { TEMPLATES } from '../templates.ts';

const one = (md: string) => classify(parse(md)[0], 0, 1) as any;

test('contexto eyebrow comes from the CONTEXTO caps line', () => {
  const s = one('[ly: contexto]\nCONTEXTO\nUn párrafo de contexto.');
  assert.equal(s.kind, 'contexto');
  assert.equal(s.eyebrow, 'CONTEXTO');
});

test('elreto eyebrow comes from the EL RETO caps line', () => {
  const s = one('[ly: reto]\nEL RETO\n# Incrementar la conversión\n![x](/a.jpg)');
  assert.equal(s.kind, 'elreto');
  assert.equal(s.eyebrow, 'EL RETO');
  assert.equal(s.title, 'Incrementar la conversión');
});

test('budget title + conditions label come from the markdown headings', () => {
  const s = one('[ly: presupuesto]\n## Presupuesto\n- A: 10 €\n### Condiciones\n- Pago a 30 días.');
  assert.equal(s.kind, 'budget');
  assert.equal(s.title, 'Presupuesto');
  assert.equal(s.conditionsLabel, 'Condiciones');
});

test('budget headings translate (custom text preserved)', () => {
  const s = one('[ly: presupuesto]\n## Budget\n- A: 10 €\n### Conditions\n- Net 30.');
  assert.equal(s.title, 'Budget');
  assert.equal(s.conditionsLabel, 'Conditions');
});

test('gantt milestone row label comes from the `hitos <label>:` key', () => {
  assert.equal(parseGantt('semanas: 8\nDiagnóstico: 1\nhitos cliente: 1, 3').milestoneLabel, 'Cliente');
  assert.equal(parseGantt('weeks: 8\nA: 1\nhitos client: 1').milestoneLabel, 'Client');
  assert.equal(parseGantt('semanas: 8\nA: 1\nhitos: 1, 3').milestoneLabel, undefined);
});

test('acceptance signer/aviso/cta come from clave:valor lines', () => {
  const md = [
    '[ly: aceptacion]',
    '# Aprobación del presupuesto',
    'nombre: CARLOS RUIZ RE',
    'cargo: co-CEO / Administrador',
    'empresa: Happy User Experiences S.L.',
    'nif: B65914848',
    'direccion: Pau Claris 100, 2ª Planta 08009 Barcelona',
    'aviso: La firma acuerda la aceptación.',
    'cta: ¡Una firma y empezamos!',
    '![Firma](/presentaciones/sign.png)',
  ].join('\n');
  const s = one(md);
  assert.equal(s.kind, 'acceptance');
  assert.equal(s.title, 'Aprobación del presupuesto');
  assert.equal(s.signer.name, 'CARLOS RUIZ RE');
  assert.equal(s.signer.role, 'co-CEO / Administrador');
  assert.equal(s.signer.company, 'Happy User Experiences S.L.');
  assert.equal(s.signer.nif, 'B65914848');
  assert.equal(s.signer.address, 'Pau Claris 100, 2ª Planta 08009 Barcelona');
  assert.equal(s.note, 'La firma acuerda la aceptación.');
  assert.equal(s.cta, '¡Una firma y empezamos!');
  assert.equal(s.signatureImage.src, '/presentaciones/sign.png');
});

test('team renders a rich flow (paragraph + list + quote + subheading) in document order', () => {
  const md = [
    '[ly: equipo]',
    '### Nuestro equipo',
    'El nostre equip multidisciplinari per a TMB:',
    '- **Consultoria UX:** Especialistes en auditories.',
    '- **Research i Estratègia:** Experts en recerca.',
    '> Cita de cierre.',
  ].join('\n');
  const s = one(md);
  assert.equal(s.kind, 'team');
  assert.deepEqual(s.content.map((n: any) => n.t), ['h', 'p', 'ul', 'quote']);
  assert.equal(s.content[0].text, 'Nuestro equipo');
  assert.equal(s.content[1].text, 'El nostre equip multidisciplinari per a TMB:');
  assert.equal(s.content[2].items.length, 2);
  assert.equal(s.content[3].text, 'Cita de cierre.');
});

test('team without content leaves it undefined (falls back to brand defaults)', () => {
  const s = one('[ly: equipo]');
  assert.equal(s.kind, 'team');
  assert.equal(s.content, undefined);
});

test('roadmap phase tasks-header comes from the 2nd paragraph (editable/translatable)', () => {
  const s = one('[ly: roadmap]\n## Roadmap\n### Diagnóstico\nDescripción de la fase.\nQuè farem?\n- Tarea uno.\n- Tarea dos.');
  assert.equal(s.kind, 'roadmapPhases');
  assert.equal(s.phases[0].body, 'Descripción de la fase.');
  assert.equal(s.phases[0].itemsHeader, 'Què farem?');
  assert.deepEqual(s.phases[0].items, ['Tarea uno.', 'Tarea dos.']);
});

test('roadmap phase with no 2nd paragraph has no tasks-header (nothing hardcoded)', () => {
  const s = one('[ly: roadmap]\n## Roadmap\n### Fase\nSolo cuerpo.\n- Tarea.');
  assert.equal(s.phases[0].itemsHeader, undefined);
});

test('paragraph keeps every paragraph (multi-paragraph body)', () => {
  const s = one('[ly: texto]\nPrimer párrafo.\nSegundo párrafo.\n\nTercero.');
  assert.equal(s.kind, 'paragraph');
  assert.deepEqual(s.body, [
    { t: 'p', text: 'Primer párrafo.' },
    { t: 'p', text: 'Segundo párrafo.' },
    { t: 'p', text: 'Tercero.' },
  ]);
});

test('split renders several paragraphs beside the image', () => {
  const s = one('## Contexto\n![a](u.jpg)\nUno.\nDos.');
  assert.equal(s.kind, 'split');
  assert.deepEqual(s.body, [{ t: 'p', text: 'Uno.' }, { t: 'p', text: 'Dos.' }]);
});

test('text layouts render a `-` list interleaved with paragraphs (in document order)', () => {
  const p = one('[ly: texto]\nIntro.\n- Uno.\n- Dos.\nCierre.');
  assert.equal(p.kind, 'paragraph');
  assert.deepEqual(p.body, [
    { t: 'p', text: 'Intro.' },
    { t: 'ul', items: ['Uno.', 'Dos.'] },
    { t: 'p', text: 'Cierre.' },
  ]);

  const sp = one('[ly: split-der]\n## Título\n![a](u.jpg)\nIntro.\n- Uno.\n- Dos.');
  assert.equal(sp.kind, 'split');
  assert.deepEqual(sp.body, [{ t: 'p', text: 'Intro.' }, { t: 'ul', items: ['Uno.', 'Dos.'] }]);

  const cx = one('[ly: contexto]\nCONTEXTO\nIntro.\n- Uno.\n- Dos.');
  assert.equal(cx.kind, 'contexto');
  assert.deepEqual(cx.body, [{ t: 'p', text: 'Intro.' }, { t: 'ul', items: ['Uno.', 'Dos.'] }]);
});

test('gantt takes normal text below the title from the non-spec paragraph', () => {
  const s = one('[ly: gantt]\n## Roadmap\nDuración estimada de 8 semanas.\nsemanas: 8\nDiagnóstico: 1-1.5\nhitos cliente: 1, 3');
  assert.equal(s.kind, 'gantt');
  assert.equal(s.subtitle, 'Duración estimada de 8 semanas.');
  assert.equal(s.rows.length, 1); // the prose line is not parsed as a bar
});

test('roadmap "Fase" label is editable via a fase: line (kept out of the subtitle)', () => {
  const s = one('[ly: roadmap]\n## Roadmap\nfase: Etapa\nDuración de 6 semanas.\n### Diagnóstico\nCuerpo.');
  assert.equal(s.kind, 'roadmapPhases');
  assert.equal(s.faseLabel, 'Etapa');
  assert.equal(s.subtitle, 'Duración de 6 semanas.');
});

test('acceptance note falls back to a plain paragraph when there is no aviso:', () => {
  const s = one('[ly: aceptacion]\n## Aprovació del pressupost\nLa signatura acorda l’acceptació total.');
  assert.equal(s.kind, 'acceptance');
  assert.equal(s.title, 'Aprovació del pressupost');
  assert.equal(s.note, 'La signatura acorda l’acceptació total.');
});

test('acceptance note still prefers an explicit aviso: line', () => {
  const s = one('[ly: aceptacion]\naviso: Texto del aviso.\nUn párrafo cualquiera.');
  assert.equal(s.note, 'Texto del aviso.');
});

test('manifesto title keeps the / emphasis / slashes verbatim', () => {
  const s = one('[ly: manifiesto]\n# Ayudamos en momentos de / transformación / con criterio.\nSub.');
  assert.equal(s.kind, 'manifesto');
  assert.ok(s.title.includes('/ transformación /'));
  assert.equal(s.subtitle, 'Sub.');
});

test('COMERCIAL template ships all brand-page content inline (editable/translatable)', () => {
  const deck = compileDeck(TEMPLATES.comercial, 'comercial');
  const byKind = (k: string) => deck.slides.find((s) => s.kind === k) as any;

  const manifesto = byKind('manifesto');
  assert.ok(manifesto.title?.includes('transformación'), 'manifesto title inline');

  const team = byKind('team');
  assert.equal(team.content.filter((n: any) => n.t === 'p').length, 5);

  const clients = byKind('clients');
  assert.ok(clients.image?.src?.includes('clients'));

  const acceptance = byKind('acceptance');
  assert.equal(acceptance.signer.name, 'CARLOS RUIZ RE');
  assert.ok(acceptance.note && acceptance.cta);

  const gantt = byKind('gantt');
  assert.equal(gantt.milestoneLabel, 'Cliente');

  const budget = byKind('budget');
  assert.equal(budget.title, 'Presupuesto');
  assert.equal(budget.conditionsLabel, 'Condiciones');
});

test('empty brand blocks still compile (component defaults fill them in)', () => {
  const md = '[ly: manifiesto]\n\n---\n\n[ly: equipo]\n\n---\n\n[ly: clientes]\n\n---\n\n[ly: aceptacion]';
  const deck = compileDeck(md, 'comercial');
  assert.deepEqual(deck.slides.map((s) => s.kind), ['manifesto', 'team', 'clients', 'acceptance']);
  const manifesto = deck.slides[0] as any;
  assert.equal(manifesto.title, undefined); // → component DEFAULT_TITLE
});
