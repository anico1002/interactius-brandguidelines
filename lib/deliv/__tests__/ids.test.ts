import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ALFABETO,
  ID_ARTEFACTO_RE,
  esEmailValido,
  idAleatorio,
  normalizarEmail,
  slugDesdeNombre,
  validarSlugCliente,
} from '../ids.ts'

test('el alfabeto tiene 32 caracteres sin ambiguedades', () => {
  assert.equal(ALFABETO.length, 32)
  assert.doesNotMatch(ALFABETO, /[01lo]/)
})

test('idAleatorio respeta longitud y alfabeto y no repite', () => {
  const a = idAleatorio(10)
  const b = idAleatorio(10)
  assert.match(a, ID_ARTEFACTO_RE)
  assert.notEqual(a, b)
  assert.equal(idAleatorio(16).length, 16)
})

test('valida slugs de cliente', () => {
  assert.equal(validarSlugCliente('cliente-ejemplo'), null)
  assert.equal(validarSlugCliente('cafe-nandu'), null)
  assert.notEqual(validarSlugCliente('Cliente'), null)
  assert.notEqual(validarSlugCliente('cliente--ejemplo'), null)
  assert.notEqual(validarSlugCliente(''), null)
  for (const r of ['login', 'logout', 'admin', 'archivos']) {
    assert.match(validarSlugCliente(r) ?? '', /reservado/)
  }
})

test('normaliza y valida emails', () => {
  assert.equal(normalizarEmail('  Ana@Cliente.TEST '), 'ana@cliente.test')
  assert.equal(esEmailValido('ana@cliente.test'), true)
  assert.equal(esEmailValido('ana@cliente'), false)
  assert.equal(esEmailValido('ana cliente@otro.test'), false)
})

test('slugDesdeNombre', () => {
  assert.equal(slugDesdeNombre('Cliente Ejemplo'), 'cliente-ejemplo')
  assert.equal(slugDesdeNombre('Café Ñandú'), 'cafe-nandu')
  assert.equal(slugDesdeNombre('  --Foo  &  Bar!! '), 'foo-bar')
  assert.equal(slugDesdeNombre('a___b'), 'a-b')
  assert.equal(slugDesdeNombre('***'), '')
})
