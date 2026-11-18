import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  accesoDesdeFila,
  artefactoDesdeFila,
  esNoEncontrado,
  filaDesdeAcceso,
  filaDesdeArtefacto,
  filaDesdeUsuario,
  iso,
  ordenarArtefactos,
  prefijoArtefacto,
  prefijoVersion,
  rutaObjeto,
  usuarioDesdeFila,
} from '../supabase-repo.ts'
import type { Acceso, Artefacto, UsuarioCliente } from '../tipos.ts'

const UUID = '0b9f3c1e-2a4d-4e5f-8a6b-7c8d9e0f1a2b'

const artefacto: Artefacto = {
  id: UUID, publicId: 'abcdefghij', cliente: 'cliente-ejemplo', clienteNombre: 'Cliente Ejemplo',
  titulo: 'Informe', tipo: 'html', entrada: 'index.html', version: 2, estado: 'publicado',
  avisos: ['usa funciones de Claude'], creadoPor: 'equipo@x', creadoEn: '2026-11-18T10:00:00.000Z',
  publicadoEn: '2026-11-18T11:00:00.000Z',
}

const usuario: UsuarioCliente = {
  email: 'ana@cliente.test', hash: 'scrypt$x', creadoPor: 'equipo@x', creadoEn: '2026-11-18T10:00:00.000Z',
  credencialesEn: '2026-11-18T10:00:00.000Z', fallos: 2, bloqueadoHasta: null,
}

const acceso: Acceso = {
  artefactoId: UUID, email: 'ana@cliente.test', concedidoPor: 'equipo@x',
  concedidoEn: '2026-11-18T10:00:00.000Z', ultimoAcceso: '2026-11-18T12:00:00.000Z',
}

test('ida y vuelta fila <-> modelo', () => {
  assert.deepEqual(artefactoDesdeFila(filaDesdeArtefacto(artefacto)), artefacto)
  assert.deepEqual(usuarioDesdeFila(filaDesdeUsuario(usuario)), usuario)
  assert.deepEqual(accesoDesdeFila(filaDesdeAcceso(acceso)), acceso)
})

test('columnas snake_case', () => {
  const f = filaDesdeArtefacto(artefacto)
  assert.equal(f.public_id, 'abcdefghij')
  assert.equal(f.cliente_nombre, 'Cliente Ejemplo')
  assert.equal(f.created_at, artefacto.creadoEn)
  assert.equal(filaDesdeUsuario(usuario).credenciales_en, usuario.credencialesEn)
  assert.equal(filaDesdeAcceso(acceso).artefacto_id, UUID)
})

test('fechas de Postgres se normalizan a toISOString y null se respeta', () => {
  assert.equal(iso('2026-11-18T12:00:00.123456+00:00'), '2026-11-18T12:00:00.123Z')
  assert.equal(iso('2026-11-18T13:00:00+01:00'), '2026-11-18T12:00:00.000Z')
  assert.equal(iso(null), null)
  assert.throws(() => iso('no'))
  const a = artefactoDesdeFila({ ...filaDesdeArtefacto(artefacto), avisos: null, publicado_en: null })
  assert.deepEqual(a.avisos, [])
  assert.equal(a.publicadoEn, null)
})

test('la copia de avisos no comparte el array', () => {
  const f = filaDesdeArtefacto(artefacto)
  f.avisos?.push('otro')
  assert.equal(artefacto.avisos.length, 1)
})

test('ordenarArtefactos: cliente A-Z, mas reciente primero', () => {
  const a = (id: string, cliente: string, creadoEn: string) => ({ ...artefacto, id, cliente, creadoEn })
  const lista = [a('1', 'zeta', '2026-01-01'), a('2', 'alfa', '2026-01-01'), a('3', 'alfa', '2026-02-01')]
  assert.deepEqual(ordenarArtefactos(lista).map((x) => x.id), ['3', '2', '1'])
})

test('rutas de Storage: uuid valido, version entera, ruta segura', () => {
  assert.equal(rutaObjeto(UUID, 3, 'css/app.css'), `${UUID}/v3/css/app.css`)
  assert.equal(prefijoVersion(UUID, 1), `${UUID}/v1/`)
  assert.equal(prefijoArtefacto(UUID), `${UUID}/`)
  assert.throws(() => prefijoArtefacto(''))
  assert.throws(() => prefijoArtefacto('abcdefghij'))
  assert.throws(() => prefijoVersion(UUID, 0))
  assert.throws(() => prefijoVersion(UUID, 1.5))
  assert.throws(() => rutaObjeto(UUID, 1, '../otro/index.html'))
  assert.throws(() => rutaObjeto(UUID, 1, '/index.html'))
  assert.throws(() => rutaObjeto(UUID, 1, ''))
})

test('esNoEncontrado: solo el objeto inexistente es null; lo demas lanza', () => {
  assert.equal(esNoEncontrado({ message: 'Object not found', status: 404, statusCode: '404' }), true)
  assert.equal(esNoEncontrado({ message: 'Object not found', status: 400, statusCode: '404' }), true)
  assert.equal(esNoEncontrado({ message: 'not found', status: 400, statusCode: 'NoSuchKey' }), true)
  assert.equal(esNoEncontrado({ message: 'Object not found' }), true)
  assert.equal(esNoEncontrado({ message: 'new row violates row-level security policy', status: 403, statusCode: '403' }), false)
  assert.equal(esNoEncontrado({ message: 'Bucket not found', status: 400, statusCode: '400' }), false)
  assert.equal(esNoEncontrado({ message: 'Internal Server Error', status: 500, statusCode: '500' }), false)
  assert.equal(esNoEncontrado({ message: 'fetch failed' }), false)
})
