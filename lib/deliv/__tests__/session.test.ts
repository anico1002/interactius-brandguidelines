import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  COOKIE_SESION,
  DURACION_SESION_MS,
  crearTokenSesion,
  leerTokenSesion,
} from '../session.ts'

const S = 'x'.repeat(32)
const T0 = 1_800_000_000_000

test('la cookie es la de Deliv_r', () => {
  assert.equal(COOKIE_SESION, '__Host-deliv_clientes')
})

test('ida y vuelta', () => {
  const t = crearTokenSesion('ana@cliente.test', T0, S)
  assert.deepEqual(leerTokenSesion(t, T0 + 1000, S), {
    email: 'ana@cliente.test',
    emitidaEn: T0,
    expira: T0 + DURACION_SESION_MS,
  })
})

test('caduca a los 7 dias', () => {
  const t = crearTokenSesion('ana@cliente.test', T0, S)
  assert.equal(leerTokenSesion(t, T0 + DURACION_SESION_MS + 1, S), null)
})

test('rechaza otro secreto, manipulacion y basura', () => {
  const t = crearTokenSesion('ana@cliente.test', T0, S)
  assert.equal(leerTokenSesion(t, T0, 'y'.repeat(32)), null)
  const [, emitida, expira, firma] = t.split('.')
  const otro = Buffer.from('luis@cliente.test').toString('base64url')
  assert.equal(leerTokenSesion([otro, emitida, expira, firma].join('.'), T0, S), null)
  assert.equal(leerTokenSesion(undefined, T0, S), null)
  assert.equal(leerTokenSesion('a.b.c', T0, S), null)
})
