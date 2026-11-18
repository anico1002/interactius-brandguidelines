import { test } from 'node:test'
import assert from 'node:assert/strict'

import { destinoSeguro, origenValido, rutaSegura } from '../http.ts'

const req = (headers: Record<string, string>) =>
  new Request('https://www.interactius.com/clientes/login', { method: 'POST', headers })

const H = 'www.interactius.com'

test('origenValido acepta el mismo host y rechaza otros o ausencia', () => {
  assert.equal(origenValido(req({ origin: `https://${H}`, host: H })), true)
  assert.equal(origenValido(req({ origin: 'https://evil.io', host: H })), false)
  assert.equal(origenValido(req({ host: H })), false)
  assert.equal(origenValido(req({ origin: 'null', host: H })), false)
})

test('con Origin null o ausente acepta solo si el navegador declara same-origin', () => {
  assert.equal(origenValido(req({ origin: 'null', host: H, 'sec-fetch-site': 'same-origin' })), true)
  assert.equal(origenValido(req({ host: H, 'sec-fetch-site': 'same-origin' })), true)
  assert.equal(origenValido(req({ origin: 'null', host: H, 'sec-fetch-site': 'cross-site' })), false)
  assert.equal(origenValido(req({ origin: 'null', host: H, 'sec-fetch-site': 'same-site' })), false)
  assert.equal(origenValido(req({ origin: 'https://evil.io', host: H, 'sec-fetch-site': 'same-origin' })), false)
})

test('destinoSeguro solo acepta /clientes/<slug>/<id>', () => {
  assert.equal(destinoSeguro('/clientes/cliente-ejemplo/k7f3q9xm2p'), '/clientes/cliente-ejemplo/k7f3q9xm2p')
  assert.equal(destinoSeguro('/clientes/admin'), '/')
  assert.equal(destinoSeguro('https://evil.io'), '/')
  assert.equal(destinoSeguro('//evil.io/clientes/x/y'), '/')
  assert.equal(destinoSeguro('/clientes/cliente-ejemplo/k7f3q9xm2p?x=1'), '/')
})

test('rutaSegura une segmentos y rechaza escapes', () => {
  assert.equal(rutaSegura(['css', 'app.css']), 'css/app.css')
  assert.equal(rutaSegura(['mi%20archivo.png']), 'mi archivo.png')
  assert.equal(rutaSegura(['..', 'x']), null)
  assert.equal(rutaSegura(['%2e%2e', 'x']), null)
  assert.equal(rutaSegura([]), null)
  assert.equal(rutaSegura(['a%00b']), null)
  assert.equal(rutaSegura(['a%0Ab']), null)
})
