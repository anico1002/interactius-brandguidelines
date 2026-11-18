import assert from 'node:assert/strict'
import { test } from 'node:test'

import { claveStorage, rutaDesdeClave } from '../clave-storage.ts'

// Lo que acepta Supabase Storage (storage-api, isValidKey).
const VALIDA = /^(\w|\/|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)*$/

test('los nombres ASCII sencillos no cambian', () => {
  assert.equal(claveStorage('Informe final v2.pdf'), 'Informe final v2.pdf')
  assert.equal(claveStorage('assets/img_01-a.png'), 'assets/img_01-a.png')
})

test('tildes, eñes, rayas y símbolos dan una clave válida y reversible', () => {
  for (const ruta of ['Diseño – propuesta.pdf', 'imágenes/Ñandú (1).png', 'a@b.pdf', '100%#?.html', '日本語/图.png', 'emoji 😀.png']) {
    const c = claveStorage(ruta)
    assert.match(c, VALIDA, ruta)
    assert.equal(rutaDesdeClave(c), ruta)
  }
})

test('es inyectiva: un «@» literal no se confunde con un escape', () => {
  assert.notEqual(claveStorage('@c3@b1'), claveStorage('ñ'))
  assert.equal(rutaDesdeClave(claveStorage('@c3@b1')), '@c3@b1')
})
