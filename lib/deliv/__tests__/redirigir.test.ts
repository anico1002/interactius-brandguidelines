import { test } from 'node:test'
import assert from 'node:assert/strict'

import { redirigir } from '../redirigir.ts'

test('303 con Location relativa: el navegador la resuelve contra el host publico', () => {
  const res = redirigir('/clientes/pruebas/k7f3q9xm2p?error=credenciales')
  assert.equal(res.status, 303)
  assert.equal(res.headers.get('location'), '/clientes/pruebas/k7f3q9xm2p?error=credenciales')
})

test('rechaza destinos que no son rutas internas', () => {
  assert.throws(() => redirigir('https://evil.io'))
  assert.throws(() => redirigir('//evil.io/x'))
  assert.throws(() => redirigir('/\\evil.io/x'))
  assert.throws(() => redirigir('clientes/x'))
})
