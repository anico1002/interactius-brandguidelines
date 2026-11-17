/* El aviso de imágenes que no se han podido cargar.
   ─────────────────────────────────────────────────────────────────────────
   La captura a PNG necesita un navegador, pero el TEXTO del aviso no, y es
   lo único que lee quien descarga. Se prueba aparte por eso.

   El caso que lo motiva: una foto borrada del banco y todavía referenciada
   en el markdown daba 404, y con eso se caía la descarga ENTERA. Siete
   tarjetas buenas y una coja tienen que salir las siete, con el aviso de
   cuál falla. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avisoDeImagenes } from '../exportPng.ts';

test('sin fallos no hay aviso', () => {
  assert.equal(avisoDeImagenes([]), null, 'una descarga limpia no dice nada');
});

test('el aviso cuenta las tarjetas en humano, empezando por 1', () => {
  const uno = avisoDeImagenes([2]);
  assert.match(uno!, /tarjeta 3\b/, 'el índice 2 es la tercera tarjeta');
  assert.doesNotMatch(uno!, /tarjeta 2\b/);
});

test('varias tarjetas se listan y el texto concuerda en plural', () => {
  const varias = avisoDeImagenes([0, 3, 5]);
  assert.match(varias!, /tarjetas 1, 4, 6/);
  assert.match(varias!, /^Las/);
  assert.match(avisoDeImagenes([0])!, /^La tarjeta 1/);
});

test('el aviso dice qué hacer, no solo qué pasó', () => {
  /* Un aviso que no dice el siguiente paso obliga a adivinarlo. */
  assert.match(avisoDeImagenes([1])!, /descarga otra vez/i);
});

test('no se cuelan URLs en el aviso', () => {
  /* Quien descarga no reconoce una ruta de Storage; sí sabe cuál es su
     tarjeta 3. */
  assert.doesNotMatch(avisoDeImagenes([0, 1])!, /https?:|\/storage\/|\.jpg/);
});
