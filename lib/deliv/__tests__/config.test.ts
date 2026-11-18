import { test } from 'node:test'
import assert from 'node:assert/strict'

import { DelivNoDisponible, secretoSesion } from '../config.ts'

test('secretoSesion: fail-closed sin secreto o con menos de 32 caracteres', () => {
  const antes = process.env.DELIV_SESSION_SECRET
  try {
    delete process.env.DELIV_SESSION_SECRET
    assert.throws(() => secretoSesion(), DelivNoDisponible)
    process.env.DELIV_SESSION_SECRET = 'x'.repeat(31)
    assert.throws(() => secretoSesion(), DelivNoDisponible)
    process.env.DELIV_SESSION_SECRET = 'x'.repeat(32)
    assert.equal(secretoSesion(), 'x'.repeat(32))
  } finally {
    if (antes === undefined) delete process.env.DELIV_SESSION_SECRET
    else process.env.DELIV_SESSION_SECRET = antes
  }
})
