import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  LIMITE_PORTADA,
  SCRIPTS_CAPTURA,
  inyectarCaptura,
  rutaPortada,
  validarPortada,
} from '../portada.ts'

const ID = '3f2a1b4c-0000-4000-8000-000000000001'

test('rutaPortada queda fuera de las carpetas de version', () => {
  assert.equal(rutaPortada(ID, 3), `${ID}/portadas/v3.jpg`)
  assert.ok(!rutaPortada(ID, 1).startsWith(`${ID}/v1/`))
})

test('validarPortada acepta JPEG y rechaza vacio, grande y otros formatos', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])
  assert.equal(validarPortada(jpeg), null)
  assert.match(validarPortada(new Uint8Array()) ?? '', /vacía/)
  assert.match(validarPortada(new Uint8Array([0x89, 0x50, 0x4e, 0x47])) ?? '', /JPEG/)
  const grande = new Uint8Array(LIMITE_PORTADA + 1)
  grande.set([0xff, 0xd8, 0xff])
  assert.match(validarPortada(grande) ?? '', /pesa/)
})

test('inyectarCaptura va antes del ultimo </body>, o al final si no hay', () => {
  assert.equal(inyectarCaptura('<p>a</p></BODY></html>'), `<p>a</p>${SCRIPTS_CAPTURA}</BODY></html>`)
  assert.equal(inyectarCaptura('<p>a</p>'), `<p>a</p>${SCRIPTS_CAPTURA}`)
})

test('public/deliv/html-to-image.js es la copia exacta de la dependencia', () => {
  const vendida = readFileSync(new URL('../../../public/deliv/html-to-image.js', import.meta.url))
  const original = readFileSync(new URL('../../../node_modules/html-to-image/dist/html-to-image.js', import.meta.url))
  assert.ok(vendida.equals(original), 'actualiza la copia: cp node_modules/html-to-image/dist/html-to-image.js public/deliv/')
})
