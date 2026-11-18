import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DURACION_TOKEN_ARCHIVO_MS,
  crearTokenArchivo,
  verificarTokenArchivo,
} from '../file-tokens.ts'

const S = 'x'.repeat(32)
const T0 = 1_800_000_000_000

test('valido para su artefacto y version durante 15 minutos', () => {
  const { token, expira } = crearTokenArchivo('k7f3q9xm2p', 2, T0, S)
  assert.equal(expira, T0 + DURACION_TOKEN_ARCHIVO_MS)
  assert.match(token, /^[A-Za-z0-9_.-]+$/)
  assert.equal(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, T0 + 60_000, S), true)
  assert.equal(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, expira + 1, S), false)
})

test('no sirve para otro artefacto, otra version u otro secreto', () => {
  const { token } = crearTokenArchivo('k7f3q9xm2p', 2, T0, S)
  assert.equal(verificarTokenArchivo(token, 'aaaaaaaaaa', 2, T0, S), false)
  assert.equal(verificarTokenArchivo(token, 'k7f3q9xm2p', 3, T0, S), false)
  assert.equal(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, T0, 'y'.repeat(32)), false)
  assert.equal(verificarTokenArchivo('basura', 'k7f3q9xm2p', 2, T0, S), false)
})

test('exige caducidad en base36 minuscula', () => {
  const { token } = crearTokenArchivo('k7f3q9xm2p', 2, T0, S)
  const [exp, firma] = token.split('.')
  assert.equal(verificarTokenArchivo(`${exp.toUpperCase()}.${firma}`, 'k7f3q9xm2p', 2, T0, S), false)
  assert.equal(verificarTokenArchivo(`ZZ.${firma}`, 'k7f3q9xm2p', 2, T0, S), false)
  assert.equal(verificarTokenArchivo(`-${exp}.${firma}`, 'k7f3q9xm2p', 2, T0, S), false)
  assert.equal(verificarTokenArchivo(`.${firma}`, 'k7f3q9xm2p', 2, T0, S), false)
})
