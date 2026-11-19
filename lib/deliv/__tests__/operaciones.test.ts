import { test } from 'node:test'
import assert from 'node:assert/strict'

import { autenticar } from '../auth.ts'
import {
  ErrorDeliv,
  artefactosQueRecupera,
  borrar,
  crearBorrador,
  darAcceso,
  desactivar,
  fichaArtefacto,
  fichaUsuarios,
  nuevaVersion,
  publicar,
  reactivar,
  regenerarPassword,
  renombrar,
  resumenEquipo,
  revocar,
} from '../operaciones.ts'
import { crearRepoEnMemoria } from '../repo-memoria.ts'

const T0 = Date.UTC(2026, 10, 20)
const EQ = 'eq@interactius.com'

async function publicado(repo = crearRepoEnMemoria(), nombre = 'Acme', titulo = 'Informe') {
  const a = await crearBorrador(
    repo,
    { clienteNombre: nombre, titulo, tipo: 'html', entrada: 'index.html' },
    EQ,
    T0,
  )
  await publicar(repo, a.id, { version: 1, avisos: [] }, T0)
  return { repo, id: a.id }
}

test('crearBorrador rechaza slug reservado e invalido', async () => {
  const repo = crearRepoEnMemoria()
  const base = { titulo: 't', tipo: 'html' as const, entrada: 'i.html' }
  await assert.rejects(
    crearBorrador(repo, { ...base, clienteNombre: 'Admin' }, EQ, T0),
    ErrorDeliv,
  )
  await assert.rejects(
    crearBorrador(repo, { ...base, clienteNombre: 'Acme', cliente: 'Mal Slug' }, EQ, T0),
    ErrorDeliv,
  )
  await assert.rejects(crearBorrador(repo, { ...base, clienteNombre: '€€€' }, EQ, T0), ErrorDeliv)
})

test('crearBorrador: mismo cliente con distinto nombre acaba con el mismo slug', async () => {
  const repo = crearRepoEnMemoria()
  const base = { titulo: 't', tipo: 'pdf' as const, entrada: 'a.pdf' }
  const a = await crearBorrador(repo, { ...base, clienteNombre: 'ACME' }, EQ, T0)
  const b = await crearBorrador(repo, { ...base, clienteNombre: 'Acme' }, EQ, T0)
  assert.equal(a.cliente, 'acme')
  assert.equal(b.cliente, a.cliente)
  assert.notEqual(a.id, b.id)
  assert.notEqual(a.publicId, b.publicId)
  assert.equal(a.estado, 'subiendo')
  assert.equal(a.version, 1)
  assert.match(a.publicId, /^[a-z2-9]{10}$/)
})

test('nuevaVersion no guarda hasta publicar', async () => {
  const { repo, id } = await publicado()
  const r = await nuevaVersion(repo, id, { tipo: 'html', entrada: 'otro.html' }, EQ, T0)
  assert.equal(r.artefacto.version, 2)
  assert.equal(r.versionAnterior, 1)
  assert.equal((await repo.leerArtefacto(id))!.version, 1)
  const p = await publicar(repo, id, { version: 2, avisos: ['x'] }, T0 + 1000)
  assert.equal(p.version, 2)
  assert.deepEqual((await repo.leerArtefacto(id))!.avisos, ['x'])
})

test('darAcceso exige artefacto publicado', async () => {
  const repo = crearRepoEnMemoria()
  const a = await crearBorrador(
    repo,
    { clienteNombre: 'Acme', titulo: 't', tipo: 'html', entrada: 'i.html' },
    EQ,
    T0,
  )
  await assert.rejects(darAcceso(repo, a.id, 'ana@cliente.test', EQ, T0), ErrorDeliv)
  await assert.rejects(darAcceso(repo, 'no-existe', 'ana@cliente.test', EQ, T0), ErrorDeliv)
})

test('darAcceso: email invalido rechazado', async () => {
  const { repo, id } = await publicado()
  await assert.rejects(darAcceso(repo, id, 'nope', EQ, T0), ErrorDeliv)
})

test('darAcceso: usuario nuevo recibe contrasena que autentica; existente no', async () => {
  const { repo, id } = await publicado()
  const r = await darAcceso(repo, id, ' Ana@Cliente.test ', EQ, T0)
  assert.equal(r.email, 'ana@cliente.test')
  assert.equal(r.nuevo, true)
  assert.ok(r.password)
  assert.equal((await autenticar(repo, 'ana@cliente.test', r.password!, T0)).ok, true)

  const { id: id2 } = await publicado(repo, 'Beta')
  const hash = (await repo.leerUsuario('ana@cliente.test'))!.hash
  const r2 = await darAcceso(repo, id2, 'ana@cliente.test', EQ, T0 + 5)
  assert.equal(r2.nuevo, false)
  assert.equal(r2.password, null)
  assert.equal((await repo.leerUsuario('ana@cliente.test'))!.hash, hash)
  assert.ok(await repo.leerAcceso(id2, 'ana@cliente.test'))
})

test('darAcceso a desactivado falla', async () => {
  const { repo, id } = await publicado()
  await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  await desactivar(repo, 'ana@cliente.test', T0)
  await assert.rejects(darAcceso(repo, id, 'ana@cliente.test', EQ, T0), /desactivado/)
})

test('revocar afecta solo a ese artefacto', async () => {
  const { repo, id } = await publicado()
  const { id: id2 } = await publicado(repo, 'Beta')
  await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  await darAcceso(repo, id2, 'ana@cliente.test', EQ, T0)
  assert.equal(await revocar(repo, id, 'ana@cliente.test'), true)
  assert.equal(await repo.leerAcceso(id, 'ana@cliente.test'), null)
  assert.ok(await repo.leerAcceso(id2, 'ana@cliente.test'))
  assert.equal(await revocar(repo, id, 'ana@cliente.test'), false)
})

test('regenerarPassword invalida la anterior y actualiza credencialesEn', async () => {
  const { repo, id } = await publicado()
  const r = await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  const nueva = await regenerarPassword(repo, 'ana@cliente.test', T0 + 60_000)
  assert.equal((await autenticar(repo, 'ana@cliente.test', r.password!, T0)).ok, false)
  assert.equal((await autenticar(repo, 'ana@cliente.test', nueva, T0)).ok, true)
  assert.equal(
    (await repo.leerUsuario('ana@cliente.test'))!.credencialesEn,
    new Date(T0 + 60_000).toISOString(),
  )
})

test('regenerarPassword de desactivado o inexistente falla', async () => {
  const { repo, id } = await publicado()
  await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  await desactivar(repo, 'ana@cliente.test', T0)
  await assert.rejects(regenerarPassword(repo, 'ana@cliente.test', T0), ErrorDeliv)
  await assert.rejects(regenerarPassword(repo, 'zz@cliente.test', T0), ErrorDeliv)
})

test('desactivar impide autenticar; reactivar devuelve contrasena valida', async () => {
  const { repo, id } = await publicado()
  const r = await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  await desactivar(repo, 'ana@cliente.test', T0 + 10)
  const u = (await repo.leerUsuario('ana@cliente.test'))!
  assert.equal(u.hash, null)
  assert.equal(u.credencialesEn, new Date(T0 + 10).toISOString())
  assert.equal((await autenticar(repo, 'ana@cliente.test', r.password!, T0)).ok, false)

  const lista = await artefactosQueRecupera(repo, 'ana@cliente.test')
  assert.deepEqual(lista.map((a) => a.id), [id])

  const pw = await reactivar(repo, 'ana@cliente.test', T0 + 20)
  assert.equal((await autenticar(repo, 'ana@cliente.test', pw, T0)).ok, true)
})

test('borrar elimina el artefacto y sus accesos', async () => {
  const { repo, id } = await publicado()
  await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  await borrar(repo, id)
  assert.equal(await repo.leerArtefacto(id), null)
  assert.deepEqual(await repo.accesosDeArtefacto(id), [])
})

test('resumenEquipo agrupa por cliente y cuenta personas', async () => {
  const { repo, id } = await publicado(undefined, 'Acme', 'A1')
  await publicado(repo, 'Acme', 'A2')
  await publicado(repo, 'Beta', 'B1')
  await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  await darAcceso(repo, id, 'luis@cliente.test', EQ, T0)
  const { porCliente } = await resumenEquipo(repo)
  assert.deepEqual(porCliente.map((c) => c.cliente), ['acme', 'beta'])
  assert.equal(porCliente[0].clienteNombre, 'Acme')
  assert.equal(porCliente[0].artefactos.length, 2)
  assert.equal(porCliente[0].artefactos.find((a) => a.id === id)!.personas, 2)
  assert.equal(porCliente[1].artefactos[0].personas, 0)
})

test('fichaArtefacto lista accesos con estado activo', async () => {
  const { repo, id } = await publicado()
  await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  await darAcceso(repo, id, 'luis@cliente.test', EQ, T0)
  await desactivar(repo, 'luis@cliente.test', T0)
  const f = (await fichaArtefacto(repo, id))!
  const act = Object.fromEntries(f.accesos.map((a) => [a.email, a.activo]))
  assert.deepEqual(act, { 'ana@cliente.test': true, 'luis@cliente.test': false })
  assert.equal(await fichaArtefacto(repo, 'nada'), null)
})

test('fichaUsuarios no expone hash', async () => {
  const { repo, id } = await publicado()
  await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  const u = await fichaUsuarios(repo)
  assert.equal(u.length, 1)
  assert.equal(u[0].activo, true)
  assert.deepEqual(u[0].artefactos, [{ id, titulo: 'Informe', ultimoAcceso: null }])
  assert.ok(!('hash' in u[0]))
  assert.ok(!JSON.stringify(u).includes('scrypt'))
})

test('publicar guarda tipo y entrada de la nueva version', async () => {
  const repo = crearRepoEnMemoria()
  const a = await crearBorrador(
    repo,
    { clienteNombre: 'Acme', titulo: 't', tipo: 'html', entrada: 'index.html' },
    EQ,
    T0,
  )
  assert.equal(a.creadoPor, EQ)
  await publicar(repo, a.id, { version: 1, avisos: [] }, T0)
  const { artefacto } = await nuevaVersion(repo, a.id, { tipo: 'pdf', entrada: 'otro.html' }, EQ, T0)
  await publicar(
    repo,
    a.id,
    { version: artefacto.version, avisos: [], tipo: artefacto.tipo, entrada: artefacto.entrada },
    T0 + 1,
  )
  const l = (await repo.leerArtefacto(a.id))!
  assert.equal(l.version, 2)
  assert.equal(l.entrada, 'otro.html')
  assert.equal(l.tipo, 'pdf')
})

test('reactivar a un usuario activo falla', async () => {
  const { repo, id } = await publicado()
  await darAcceso(repo, id, 'ana@cliente.test', EQ, T0)
  await assert.rejects(reactivar(repo, 'ana@cliente.test', T0), ErrorDeliv)
})

test('darAcceso registra autoria', async () => {
  const { repo, id } = await publicado()
  await darAcceso(repo, id, 'ana@cliente.test', 'otro@interactius.com', T0)
  assert.equal((await repo.leerUsuario('ana@cliente.test'))!.creadoPor, 'otro@interactius.com')
  assert.equal((await repo.leerAcceso(id, 'ana@cliente.test'))!.concedidoPor, 'otro@interactius.com')
})

test('renombrar cambia solo el titulo, recortado', async () => {
  const { repo, id } = await publicado()
  const antes = await repo.leerArtefacto(id)
  assert.equal(await renombrar(repo, id, '  Informe final  '), 'Informe final')
  const despues = await repo.leerArtefacto(id)
  assert.deepEqual(despues, { ...antes, titulo: 'Informe final' })
})

test('renombrar rechaza titulo vacio y artefacto inexistente', async () => {
  const { repo, id } = await publicado()
  await assert.rejects(renombrar(repo, id, '   '), ErrorDeliv)
  await assert.rejects(renombrar(repo, '00000000-0000-4000-8000-000000000000', 'X'), ErrorDeliv)
  assert.equal((await repo.leerArtefacto(id))?.titulo, 'Informe')
})
