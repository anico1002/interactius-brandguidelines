import { test } from 'node:test'
import assert from 'node:assert/strict'

import { clienteDeSesion, puedeVerCliente } from '../acceso.ts'
import { crearRepoEnMemoria } from '../repo-memoria.ts'
import { crearTokenSesion } from '../session.ts'
import type { Artefacto, UsuarioCliente } from '../tipos.ts'

const S = 'x'.repeat(32)
const T0 = Date.UTC(2026, 10, 20)

const base: UsuarioCliente = {
  email: 'ana@cliente.test', hash: 'h', creadoPor: 'eq@interactius.com', creadoEn: 'c',
  credencialesEn: new Date(T0).toISOString(), fallos: 0, bloqueadoHasta: null,
}

const art = (estado: Artefacto['estado'] = 'publicado'): Artefacto => ({
  id: '11111111-1111-4111-8111-111111111111', publicId: 'aaaaaaaaaa',
  cliente: 'cliente-ejemplo', clienteNombre: 'Cliente Ejemplo', titulo: 't', tipo: 'html',
  entrada: 'index.html', version: 1, estado, avisos: [], creadoPor: 'x',
  creadoEn: 'c', publicadoEn: estado === 'publicado' ? 'p' : null,
})

const acceso = (a: Artefacto, email = 'ana@cliente.test') => ({
  artefactoId: a.id, email, concedidoPor: 'x', concedidoEn: 'c', ultimoAcceso: null,
})

test('clienteDeSesion devuelve el usuario con sesion valida', async () => {
  const repo = crearRepoEnMemoria()
  await repo.guardarUsuario(base)
  const t = crearTokenSesion('ana@cliente.test', T0 + 1, S)
  assert.equal((await clienteDeSesion(repo, t, T0 + 2, S))?.email, 'ana@cliente.test')
})

test('rechaza token ausente, manipulado o con otro secreto', async () => {
  const repo = crearRepoEnMemoria()
  await repo.guardarUsuario(base)
  const t = crearTokenSesion('ana@cliente.test', T0 + 1, S)
  assert.equal(await clienteDeSesion(repo, undefined, T0 + 2, S), null)
  assert.equal(await clienteDeSesion(repo, t + 'x', T0 + 2, S), null)
  assert.equal(await clienteDeSesion(repo, t, T0 + 2, 'y'.repeat(32)), null)
})

test('invalida sesiones anteriores a regenerar credenciales', async () => {
  const repo = crearRepoEnMemoria()
  const t = crearTokenSesion('ana@cliente.test', T0 + 1, S)
  await repo.guardarUsuario({ ...base, credencialesEn: new Date(T0 + 10).toISOString() })
  assert.equal(await clienteDeSesion(repo, t, T0 + 20, S), null)
})

test('usuario borrado o desactivado no tiene sesion', async () => {
  const repo = crearRepoEnMemoria()
  const t = crearTokenSesion('ana@cliente.test', T0 + 1, S)
  assert.equal(await clienteDeSesion(repo, t, T0 + 2, S), null)
  await repo.guardarUsuario({ ...base, hash: null })
  assert.equal(await clienteDeSesion(repo, t, T0 + 2, S), null)
})

test('puedeVerCliente: publicado y con fila de acceso', async () => {
  const repo = crearRepoEnMemoria()
  const a = art()
  await repo.guardarArtefacto(a)
  assert.equal(await puedeVerCliente(repo, 'ana@cliente.test', a), false)
  await repo.concederAcceso(acceso(a))
  assert.equal(await puedeVerCliente(repo, 'ana@cliente.test', a), true)
  assert.equal(await puedeVerCliente(repo, 'luis@cliente.test', a), false)
})

test('puedeVerCliente: artefacto en subiendo nunca es visible', async () => {
  const repo = crearRepoEnMemoria()
  const a = art('subiendo')
  await repo.guardarArtefacto(a)
  await repo.concederAcceso(acceso(a))
  assert.equal(await puedeVerCliente(repo, 'ana@cliente.test', a), false)
})
