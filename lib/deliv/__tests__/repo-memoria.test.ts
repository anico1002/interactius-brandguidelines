import { test } from 'node:test'
import assert from 'node:assert/strict'

import { crearRepoEnMemoria } from '../repo-memoria.ts'
import type { Acceso, Artefacto } from '../tipos.ts'

const art = (id: string, publicId: string, cliente: string, creadoEn: string): Artefacto => ({
  id, publicId, cliente, clienteNombre: cliente, titulo: 't', tipo: 'html',
  entrada: 'index.html', version: 1, estado: 'publicado', avisos: ['a'],
  creadoPor: 'x', creadoEn, publicadoEn: creadoEn,
})

const acc = (artefactoId: string, email: string, concedidoEn = 'c1'): Acceso => ({
  artefactoId, email, concedidoPor: 'x', concedidoEn, ultimoAcceso: null,
})

test('listarArtefactos: cliente A-Z y mas reciente primero', async () => {
  const repo = crearRepoEnMemoria()
  await repo.guardarArtefacto(art('1', 'aaaaaaaaaa', 'zeta', '2026-01-01'))
  await repo.guardarArtefacto(art('2', 'bbbbbbbbbb', 'alfa', '2026-01-01'))
  await repo.guardarArtefacto(art('3', 'cccccccccc', 'alfa', '2026-02-01'))
  assert.deepEqual((await repo.listarArtefactos()).map((a) => a.id), ['3', '2', '1'])
})

test('lee por uuid y por publicId', async () => {
  const repo = crearRepoEnMemoria()
  await repo.guardarArtefacto(art('1', 'aaaaaaaaaa', 'alfa', 'd'))
  assert.equal((await repo.leerArtefacto('1'))?.publicId, 'aaaaaaaaaa')
  assert.equal((await repo.leerArtefactoPublico('aaaaaaaaaa'))?.id, '1')
  assert.equal(await repo.leerArtefactoPublico('1'), null)
  assert.equal(await repo.leerArtefacto('aaaaaaaaaa'), null)
})

test('concederAcceso es idempotente y no pisa concedidoEn', async () => {
  const repo = crearRepoEnMemoria()
  await repo.concederAcceso(acc('1', 'ana@otro.test', 'c1'))
  await repo.concederAcceso(acc('1', 'ana@otro.test', 'c2'))
  assert.equal((await repo.leerAcceso('1', 'ana@otro.test'))?.concedidoEn, 'c1')
  assert.equal((await repo.accesosDeArtefacto('1')).length, 1)
})

test('revocarAcceso devuelve false si no existia', async () => {
  const repo = crearRepoEnMemoria()
  await repo.concederAcceso(acc('1', 'ana@otro.test'))
  assert.equal(await repo.revocarAcceso('1', 'ana@otro.test'), true)
  assert.equal(await repo.revocarAcceso('1', 'ana@otro.test'), false)
})

test('registrarUltimoAcceso y accesosDeUsuario', async () => {
  const repo = crearRepoEnMemoria()
  await repo.concederAcceso(acc('1', 'ana@otro.test'))
  await repo.concederAcceso(acc('2', 'ana@otro.test'))
  await repo.registrarUltimoAcceso('1', 'ana@otro.test', 'ahora')
  assert.equal((await repo.leerAcceso('1', 'ana@otro.test'))?.ultimoAcceso, 'ahora')
  assert.equal((await repo.accesosDeUsuario('ana@otro.test')).length, 2)
})

test('borrarArtefacto borra sus accesos', async () => {
  const repo = crearRepoEnMemoria()
  await repo.guardarArtefacto(art('1', 'aaaaaaaaaa', 'alfa', 'd'))
  await repo.concederAcceso(acc('1', 'ana@otro.test'))
  await repo.concederAcceso(acc('2', 'ana@otro.test'))
  await repo.borrarArtefacto('1')
  assert.equal(await repo.leerArtefacto('1'), null)
  assert.equal(await repo.leerAcceso('1', 'ana@otro.test'), null)
  assert.notEqual(await repo.leerAcceso('2', 'ana@otro.test'), null)
})

test('devuelve copias, no referencias', async () => {
  const repo = crearRepoEnMemoria()
  const original = art('1', 'aaaaaaaaaa', 'alfa', 'd')
  await repo.guardarArtefacto(original)
  original.titulo = 'mutado'
  const leido = (await repo.leerArtefacto('1'))!
  assert.equal(leido.titulo, 't')
  leido.titulo = 'otro'
  leido.avisos.push('b')
  const otra = (await repo.leerArtefacto('1'))!
  assert.equal(otra.titulo, 't')
  assert.deepEqual(otra.avisos, ['a'])
})
