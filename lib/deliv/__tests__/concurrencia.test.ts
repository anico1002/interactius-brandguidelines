import assert from 'node:assert/strict'
import { test } from 'node:test'

import { mapConLimite } from '../concurrencia.ts'

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

test('mapConLimite: conserva el orden aunque terminen desordenadas', async () => {
  const items = [30, 5, 20, 1, 10, 0, 15]
  const r = await mapConLimite(items, 3, async (ms, i) => {
    await espera(ms)
    return `${i}:${ms}`
  })
  assert.deepEqual(r, items.map((ms, i) => `${i}:${ms}`))
})

test('mapConLimite: nunca hay mas llamadas en vuelo que el limite', async () => {
  let enVuelo = 0
  let maximo = 0
  const items = Array.from({ length: 25 }, (_, i) => i)
  await mapConLimite(items, 8, async (i) => {
    enVuelo++
    maximo = Math.max(maximo, enVuelo)
    await espera(i % 4)
    enVuelo--
  })
  assert.equal(maximo, 8)
  const r = await mapConLimite([1, 2], 8, async (x) => x * 2)
  assert.deepEqual(r, [2, 4])
  assert.deepEqual(await mapConLimite([], 8, async () => 1), [])
})

test('mapConLimite: el error se propaga y no se lanzan llamadas nuevas', async () => {
  const llamadas: number[] = []
  const items = Array.from({ length: 20 }, (_, i) => i)
  await assert.rejects(
    mapConLimite(items, 2, async (i) => {
      llamadas.push(i)
      await espera(1)
      if (i === 3) throw new Error('lectura')
    }),
    /lectura/,
  )
  await espera(10)
  assert.ok(llamadas.length < items.length)
})

test('mapConLimite: parar corta las llamadas nuevas', async () => {
  let visto = false
  const llamadas: number[] = []
  const items = Array.from({ length: 30 }, (_, i) => i)
  const r = await mapConLimite(
    items,
    4,
    async (i) => {
      llamadas.push(i)
      await espera(1)
      if (i === 5) visto = true
      return i
    },
    () => visto,
  )
  assert.ok(llamadas.includes(5))
  assert.ok(llamadas.length < items.length)
  assert.equal(r.length, items.length)
  for (const i of llamadas) assert.equal(r[i], i)
})

test('mapConLimite: limite invalido', async () => {
  await assert.rejects(mapConLimite([1], 0, async (x) => x), RangeError)
})
