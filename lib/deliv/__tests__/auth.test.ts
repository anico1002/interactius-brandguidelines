import { test } from 'node:test'
import assert from 'node:assert/strict'

import { BLOQUEO_MS, MAX_FALLOS, autenticar } from '../auth.ts'
import { HASH_FICTICIO, hashPassword } from '../passwords.ts'
import { crearRepoEnMemoria } from '../repo-memoria.ts'

const T0 = Date.UTC(2026, 10, 20)
const PW = 'aaaa-bbbb-cccc-dddd'

async function conUsuario() {
  const repo = crearRepoEnMemoria()
  await repo.guardarUsuario({
    email: 'ana@cliente.test',
    hash: await hashPassword(PW),
    creadoPor: 'eq@interactius.com',
    creadoEn: 'c',
    credencialesEn: new Date(T0).toISOString(),
    fallos: 0,
    bloqueadoHasta: null,
  })
  return repo
}

test('acepta credenciales correctas', async () => {
  const repo = await conUsuario()
  assert.equal((await autenticar(repo, 'ANA@cliente.test', PW, T0)).ok, true)
})

test('usuario inexistente y contrasena mala dan el mismo motivo', async () => {
  const repo = await conUsuario()
  assert.deepEqual(await autenticar(repo, 'nadie@otro.test', 'x', T0), { ok: false, motivo: 'credenciales' })
  assert.deepEqual(await autenticar(repo, 'ana@cliente.test', 'x', T0), { ok: false, motivo: 'credenciales' })
})

test(`bloquea tras ${MAX_FALLOS} fallos y desbloquea a los 15 min`, async () => {
  const repo = await conUsuario()
  for (let i = 1; i < MAX_FALLOS; i++) {
    assert.equal((await autenticar(repo, 'ana@cliente.test', 'x', T0)).ok, false)
  }
  assert.deepEqual(await autenticar(repo, 'ana@cliente.test', 'x', T0), { ok: false, motivo: 'bloqueado' })
  assert.deepEqual(await autenticar(repo, 'ana@cliente.test', PW, T0 + 1000), { ok: false, motivo: 'bloqueado' })
  assert.equal((await autenticar(repo, 'ana@cliente.test', PW, T0 + BLOQUEO_MS + 1)).ok, true)
  assert.equal((await repo.leerUsuario('ana@cliente.test'))?.bloqueadoHasta, null)
})

test('un login correcto pone el contador a cero', async () => {
  const repo = await conUsuario()
  await autenticar(repo, 'ana@cliente.test', 'x', T0)
  await autenticar(repo, 'ana@cliente.test', PW, T0)
  assert.equal((await repo.leerUsuario('ana@cliente.test'))?.fallos, 0)
})

test('un usuario desactivado no entra', async () => {
  const repo = crearRepoEnMemoria()
  await repo.guardarUsuario({
    email: 'ana@cliente.test', hash: null, creadoPor: 'x', creadoEn: 'c',
    credencialesEn: 'c', fallos: 0, bloqueadoHasta: null,
  })
  assert.deepEqual(await autenticar(repo, 'ana@cliente.test', 'x', T0), { ok: false, motivo: 'credenciales' })
})

test('cuenta bloqueada: ejecuta una verificacion ficticia antes de responder', async () => {
  const repo = await conUsuario()
  for (let i = 0; i < MAX_FALLOS; i++) await autenticar(repo, 'ana@cliente.test', 'x', T0)

  const llamadas: Array<[string, string]> = []
  const espia = async (pw: string, hash: string) => {
    llamadas.push([pw, hash])
    return false
  }
  assert.deepEqual(await autenticar(repo, 'ana@cliente.test', PW, T0 + 1000, espia), {
    ok: false,
    motivo: 'bloqueado',
  })
  assert.deepEqual(llamadas, [[PW, HASH_FICTICIO]])
})
