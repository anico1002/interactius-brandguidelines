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
  assert.equal(team.paragraphs.length, 5);

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
