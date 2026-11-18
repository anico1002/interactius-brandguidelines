import assert from 'node:assert/strict'
import { test } from 'node:test'

import { infoCliente, pendientes, pesoLegible, rutaEnBucket, tratamiento } from '../informe.ts'

const existentes = [
  { slug: 'cliente-ejemplo', nombre: 'Cliente Ejemplo' },
  { slug: 'cafe-nandu', nombre: 'Café Ñandú' },
]

test('pesoLegible', () => {
  assert.equal(pesoLegible(3.1 * 1024 * 1024), '3,1 MB')
  assert.equal(pesoLegible(2048), '2 KB')
  assert.equal(pesoLegible(0), '0 KB')
})

test('infoCliente: existente, nuevo, reservado y vacío', () => {
  const a = infoCliente(' cliente-ejemplo ', existentes)
  assert.equal(a.slug, 'cliente-ejemplo')
  assert.equal(a.existente?.nombre, 'Cliente Ejemplo')
  assert.equal(a.nombre, 'Cliente Ejemplo')
  assert.equal(a.error, null)
  const b = infoCliente('Estudio Nuevo', existentes)
  assert.equal(b.existente, null)
  assert.equal(b.nombre, 'Estudio Nuevo')
  assert.ok(infoCliente('Admin', existentes).error)
  assert.ok(infoCliente('???', existentes).error)
  const c = infoCliente('', existentes)
  assert.equal(c.error, null)
  assert.equal(c.sugerencias.length, 2)
})

test('infoCliente: sugerencias por nombre sin acentos', () => {
  const r = infoCliente('nandu', existentes)
  assert.deepEqual(r.sugerencias.map((s) => s.slug), ['cafe-nandu'])
})

test('rutaEnBucket', () => {
  assert.equal(rutaEnBucket('abc', 2, 'assets/a.png'), 'abc/v2/assets/a.png')
})

test('pendientes y reservado', () => {
  assert.deepEqual(pendientes(['a', 'b', 'c'], new Set(['b'])), ['a', 'c'])
  assert.equal(infoCliente('admin', []).reservado, true)
  assert.equal(infoCliente('estudio', []).reservado, false)
})

test('tratamiento', () => {
  assert.equal(tratamiento({ ruta: 'index.html', original: 10, final: 4 }), 'imágenes incrustadas extraídas')
  assert.equal(tratamiento({ ruta: 'a.webp', original: 10, final: 4 }), 'WebP')
  assert.equal(tratamiento({ ruta: 'x.pdf', original: 10, final: 10 }), 'sin recompresión')
  assert.equal(tratamiento({ ruta: 'a.css', original: 5, final: 5 }), '')
})
