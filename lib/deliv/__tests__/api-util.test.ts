import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  decodificarParametro,
  enlaceDe,
  errorARespuesta,
  faltantes,
  objetoJson,
  texto,
  tipoValido,
  validarEntrada,
  validarId,
  validarRutas,
  validarVersion,
} from '../api-util.ts'
import { DelivNoDisponible } from '../config.ts'
import { ErrorDeliv } from '../operaciones.ts'
import { LIMITE_TOTAL } from '../subida.ts'

test('errorARespuesta: ErrorDeliv es 400 con su mensaje', () => {
  const r = errorARespuesta(new ErrorDeliv('El correo no es válido.'))
  assert.equal(r.status, 400)
  assert.deepEqual(r.cuerpo, { ok: false, mensaje: 'El correo no es válido.' })
})

test('errorARespuesta: lo demas es 503 generico sin filtrar detalles', () => {
  for (const e of [new DelivNoDisponible('falta clave'), new Error('relation x does not exist'), 'raro']) {
    const r = errorARespuesta(e)
    assert.equal(r.status, 503)
    assert.equal(r.cuerpo.mensaje, 'Servicio no disponible.')
    assert.doesNotMatch(JSON.stringify(r.cuerpo), /clave|relation/)
    assert.ok(r.log)
  }
})

test('validarId y validarVersion', () => {
  assert.equal(validarId('3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b'), '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b')
  assert.throws(() => validarId('../x'), ErrorDeliv)
  assert.throws(() => validarId(''), ErrorDeliv)
  assert.equal(validarVersion(2), 2)
  for (const v of [0, 1.5, '2', null, -1]) assert.throws(() => validarVersion(v), ErrorDeliv)
})

test('validarRutas: seguras, sin repetidas y con limite de tamaño', () => {
  assert.deepEqual(validarRutas(['index.html', 'a/b.css']), ['index.html', 'a/b.css'])
  for (const r of [[], 'x', ['../x'], ['a//b'], ['a\\b'], ['a', 'a'], [3], ['']]) {
    assert.throws(() => validarRutas(r), ErrorDeliv)
  }
  assert.doesNotThrow(() => validarRutas(['a', 'b'], [1, 2]))
  assert.throws(() => validarRutas(['a', 'b'], [1]), ErrorDeliv)
  assert.throws(() => validarRutas(['a'], [-1]), ErrorDeliv)
  assert.throws(() => validarRutas(['a', 'b'], [LIMITE_TOTAL, 1]), ErrorDeliv)
  assert.throws(() => validarRutas(Array.from({ length: 2001 }, (_, i) => `f${i}`)), ErrorDeliv)
})

test('validarEntrada, tipoValido, texto, objetoJson', () => {
  assert.equal(validarEntrada('index.html', ['index.html']), 'index.html')
  assert.throws(() => validarEntrada('otro.html', ['index.html']), ErrorDeliv)
  assert.equal(tipoValido('pdf'), 'pdf')
  assert.throws(() => tipoValido('zip'), ErrorDeliv)
  assert.equal(texto('Ana', 'el nombre'), 'Ana')
  assert.equal(texto(undefined, 'el cliente', true), undefined)
  assert.throws(() => texto('', 'el título'), ErrorDeliv)
  assert.throws(() => texto('  ', 'el título'), ErrorDeliv)
  assert.throws(() => texto(5, 'el título'), ErrorDeliv)
  assert.throws(() => texto('x'.repeat(201), 'el título'), ErrorDeliv)
  assert.deepEqual(objetoJson({ a: 1 }), { a: 1 })
  for (const v of [null, [], 'x', 3]) assert.throws(() => objetoJson(v), ErrorDeliv)
})

test('faltantes, enlaceDe, decodificarParametro', () => {
  assert.deepEqual(faltantes(['a', 'b', 'c'], new Set(['b'])), ['a', 'c'])
  assert.equal(enlaceDe({ cliente: 'acme', publicId: 'abcdefghij' }), '/clientes/acme/abcdefghij')
  assert.equal(decodificarParametro('ana%40otro.test'), 'ana@otro.test')
  assert.throws(() => decodificarParametro('%E0%A4%A'), ErrorDeliv)
})

import { decidirPublicacion } from '../api-util.ts'
import type { Artefacto } from '../tipos.ts'

const ficha = (o: Partial<Artefacto> = {}): Artefacto => ({
  id: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
  publicId: 'abcdefghij',
  cliente: 'acme',
  clienteNombre: 'Acme',
  titulo: 'T',
  tipo: 'html',
  entrada: 'index.html',
  version: 1,
  estado: 'subiendo',
  avisos: [],
  creadoPor: 'a@interactius.com',
  creadoEn: '2026-01-01T00:00:00.000Z',
  publicadoEn: null,
  ...o,
})
const base = (o = {}) => ({
  ficha: ficha(),
  version: 1,
  rutas: ['index.html', 'a.css'],
  subidos: new Set(['index.html', 'a.css']),
  aceptarAvisos: false,
  leerAvisos: async () => [] as string[],
  ...o,
})

test('decidirPublicacion: primera publicacion', async () => {
  const r = await decidirPublicacion(base())
  assert.deepEqual(r, { accion: 'publicar', version: 1, tipo: 'html', entrada: 'index.html', avisos: [] })
})

test('decidirPublicacion: reemplazo pide tipo y entrada y borra la anterior', async () => {
  const f = ficha({ estado: 'publicado', version: 2 })
  const r = await decidirPublicacion(base({ ficha: f, version: 3, tipo: 'pdf', entrada: 'a.css' }))
  assert.deepEqual(r, {
    accion: 'publicar', version: 3, tipo: 'pdf', entrada: 'a.css', avisos: [], versionAnteriorABorrar: 2,
  })
  const sin = await decidirPublicacion(base({ ficha: f, version: 3 }))
  assert.equal(sin.accion, 'rechazar')
})

test('decidirPublicacion: version equivocada o ya publicada', async () => {
  const pub = ficha({ estado: 'publicado', version: 2 })
  for (const [f, v] of [[ficha(), 2], [ficha(), 5], [pub, 2], [pub, 1], [pub, 4]] as const) {
    assert.equal((await decidirPublicacion(base({ ficha: f, version: v }))).accion, 'rechazar')
  }
  const r = await decidirPublicacion(base({ ficha: pub, version: 2 }))
  assert.deepEqual(r, { accion: 'rechazar', mensaje: 'Esa versión ya está publicada.' })
})

test('decidirPublicacion: faltan archivos y no lee avisos', async () => {
  let leido = false
  const r = await decidirPublicacion(
    base({ subidos: new Set(['index.html']), leerAvisos: async () => { leido = true; return [] } }),
  )
  assert.deepEqual(r, { accion: 'faltan', faltan: ['a.css'] })
  assert.equal(leido, false)
})

test('decidirPublicacion: avisos sin y con aceptacion; recibe los presentes', async () => {
  let presentes: string[] = []
  const leerAvisos = async (p: string[]) => { presentes = p; return ['aviso'] }
  const subidos = new Set(['index.html', 'a.css', 'extra.js'])
  const c = await decidirPublicacion(base({ subidos, leerAvisos }))
  assert.deepEqual(c, { accion: 'confirmar', avisos: ['aviso'] })
  assert.deepEqual(presentes.sort(), ['a.css', 'extra.js', 'index.html'])
  const ok = await decidirPublicacion(base({ subidos, leerAvisos, aceptarAvisos: true }))
  assert.deepEqual(ok, { accion: 'publicar', version: 1, tipo: 'html', entrada: 'index.html', avisos: ['aviso'] })
})
