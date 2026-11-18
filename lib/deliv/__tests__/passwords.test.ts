import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  HASH_FICTICIO,
  generarPassword,
  hashPassword,
  verificarPassword,
} from '../passwords.ts'

test('genera 16 caracteres en grupos de 4', () => {
  assert.match(generarPassword(), /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/)
})

test('verifica la contrasena correcta y rechaza otra', async () => {
  const pw = generarPassword()
  const hash = await hashPassword(pw)
  assert.match(hash, /^scrypt\$N=16384,r=8,p=1\$/)
  assert.ok(!hash.includes(pw))
  assert.equal(await verificarPassword(pw, hash), true)
  assert.equal(await verificarPassword(generarPassword(), hash), false)
})

test('tolera mayusculas, espacios y guiones al teclear', async () => {
  const hash = await hashPassword('k7f3-q9xm-2pab-r4dz')
  assert.equal(await verificarPassword(' K7F3 Q9XM 2PAB R4DZ ', hash), true)
  assert.equal(await verificarPassword('k7f3q9xm2pabr4dz', hash), true)
})

test('dos hashes de la misma contrasena son distintos (salt)', async () => {
  assert.notEqual(await hashPassword('a'), await hashPassword('a'))
})

test('rechaza hashes mal formados y el ficticio', async () => {
  assert.equal(await verificarPassword('x', 'basura'), false)
  assert.equal(await verificarPassword('x', 'scrypt$N=0,r=8,p=1$AA==$AA=='), false)
  assert.equal(await verificarPassword('x', HASH_FICTICIO), false)
})

test('parametros exoticos no lanzan', async () => {
  assert.equal(await verificarPassword('x', 'scrypt$N=3,r=8,p=1$AA==$AA=='), false)
})
