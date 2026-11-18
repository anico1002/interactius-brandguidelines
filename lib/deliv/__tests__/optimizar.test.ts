import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  CONSEJOS,
  extraerImagenesIncrustadas,
  optimizarArtefacto,
  reescribirReferencias,
} from '../optimizar.ts'
import type { OptimizadorImagen } from '../optimizar.ts'
import type { ArchivoSubida } from '../subida.ts'

const enc = new TextEncoder()
const dec = new TextDecoder()
const b64 = (b: number[]) => btoa(String.fromCharCode(...b))

test('extrae dos data: de img src y url() de style', () => {
  const html =
    `<style>.a{background:url(data:image/png;base64,${b64([1, 2, 3])})}</style>` +
    `<img src="data:image/jpeg;base64,${b64([4, 5])}">`
  const r = extraerImagenesIncrustadas(html)
  assert.equal(r.imagenes.length, 2)
  assert.ok(!r.html.includes('data:image'))
  for (const i of r.imagenes) assert.ok(r.html.includes(i.ruta))
  assert.deepEqual([...r.imagenes[0].datos], [1, 2, 3])
  assert.equal(r.imagenes[0].tipoMime, 'image/png')
  assert.match(r.imagenes[1].ruta, /^assets\/img-\d+\.jpg$/)
  assert.ok(!r.html.includes('url(/') && r.html.includes('url(assets/'))
})

test('reescribirReferencias no toca rutas parecidas', () => {
  const m = new Map([['a.jpg', 'a.webp']])
  const t = `<img src="a.jpg"><img src="aa.jpg"><img src='./a.jpg'><div style="background:url(a.jpg)"></div>`
  const r = reescribirReferencias(t, m)
  assert.ok(r.includes('src="a.webp"'))
  assert.ok(r.includes('src="aa.jpg"'))
  assert.ok(r.includes("src='a.webp'"))
  assert.ok(r.includes('url(a.webp)'))
})

test('reescribirReferencias con url-encoded', () => {
  const m = new Map([['mi foto.png', 'mi foto.webp']])
  const r = reescribirReferencias('<img src="mi%20foto.png">', m)
  assert.equal(r, '<img src="mi%20foto.webp">')
})

const mitad: OptimizadorImagen = {
  async optimizar(d) {
    return { datos: d.slice(0, Math.floor(d.length / 2)), tipoMime: 'image/webp' }
  },
}
const mayor: OptimizadorImagen = {
  async optimizar(d) {
    return { datos: new Uint8Array(d.length + 10), tipoMime: 'image/webp' }
  },
}
const arch = (ruta: string, datos: Uint8Array, tipoMime = 'x'): ArchivoSubida => ({ ruta, datos, tipoMime })

test('optimizarArtefacto sustituye, cambia extension y reescribe', async () => {
  const html = arch('index.html', enc.encode('<img src="a.png"><img src="aa.png">'), 'text/html')
  const r = await optimizarArtefacto(
    [html, arch('a.png', new Uint8Array(100)), arch('aa.png', new Uint8Array(40))],
    mitad,
  )
  const rutas = r.archivos.map((a) => a.ruta).sort()
  assert.deepEqual(rutas, ['aa.webp', 'a.webp', 'index.html'].sort())
  const h = dec.decode(r.archivos.find((a) => a.ruta === 'index.html')!.datos)
  assert.ok(h.includes('src="a.webp"') && h.includes('src="aa.webp"'))
  const fila = r.informe.find((f) => f.ruta === 'a.webp')!
  assert.equal(fila.original, 100)
  assert.equal(fila.final, 50)
  assert.equal(r.archivos.find((a) => a.ruta === 'a.webp')!.tipoMime, 'image/webp')
  assert.ok(r.total.final < r.total.original)
})

test('optimizarArtefacto extrae data: y optimiza', async () => {
  const html = arch('index.html', enc.encode(`<img src="data:image/png;base64,${b64(new Array(20).fill(7))}">`))
  const r = await optimizarArtefacto([html], mitad)
  assert.equal(r.archivos.length, 2)
  assert.ok(r.archivos.some((a) => /^assets\/img-\d+\.webp$/.test(a.ruta)))
  assert.ok(dec.decode(r.archivos.find((a) => a.ruta === 'index.html')!.datos).includes('.webp'))
})

test('si el optimizador devuelve mas grande no sustituye', async () => {
  const r = await optimizarArtefacto([arch('a.jpg', new Uint8Array(100))], mayor)
  assert.equal(r.archivos[0].ruta, 'a.jpg')
  assert.equal(r.informe[0].final, 100)
})

test('consejos para mas de 5 MB', async () => {
  const MB6 = 6 * 1024 * 1024
  const r = await optimizarArtefacto(
    [arch('v.mp4', new Uint8Array(MB6)), arch('d.pdf', new Uint8Array(MB6)), arch('i.png', new Uint8Array(MB6)), arch('p.pdf', new Uint8Array(10))],
    mayor,
  )
  const c = (ruta: string) => r.informe.find((f) => f.ruta === ruta)!.consejo
  assert.equal(c('v.mp4'), CONSEJOS.video)
  assert.equal(c('d.pdf'), CONSEJOS.pdf)
  assert.equal(c('i.png'), CONSEJOS.imagen)
  assert.equal(c('p.pdf'), null)
})

test('CONSEJOS textos de la spec', () => {
  assert.equal(CONSEJOS.video, 'Si es solo audio, expórtalo como M4A o MP3. Si es vídeo, expórtalo a 720p.')
  assert.equal(CONSEJOS.imagen, 'Usa imágenes de 2400 px como máximo.')
  assert.match(CONSEJOS.pdf, /Filtro Quartz/)
})

test('colision de nombres: logo.png y logo.jpg no se pisan', async () => {
  const r = await optimizarArtefacto(
    [
      arch('index.html', enc.encode('<img src="logo.png"><img src="logo.jpg">'), 'text/html'),
      arch('logo.png', new Uint8Array(100)),
      arch('logo.jpg', new Uint8Array(100)),
    ],
    mitad,
  )
  const rutas = r.archivos.map((a) => a.ruta).sort()
  assert.deepEqual(rutas, ['index.html', 'logo.jpg', 'logo.webp'])
  const h = dec.decode(r.archivos.find((a) => a.ruta === 'index.html')!.datos)
  assert.ok(h.includes('src="logo.webp"') && h.includes('src="logo.jpg"'))
})

test('srcset y poster, con query y hash', () => {
  const m = new Map([['a.png', 'a.webp'], ['sub/b.png', 'sub/b.webp'], ['p.jpg', 'p.webp']])
  const r = reescribirReferencias(
    '<img srcset="a.png 1x, sub/b.png 2x"><video poster="p.jpg"></video><img src="a.png?v=2#x">',
    m,
  )
  assert.ok(r.includes('srcset="a.webp 1x, sub/b.webp 2x"'))
  assert.ok(r.includes('poster="p.webp"'))
  assert.ok(r.includes('src="a.webp?v=2#x"'))
})

test('base64 envuelto cada 76 caracteres', () => {
  const bytes = Array.from({ length: 200 }, (_, i) => i % 256)
  const b = b64(bytes).replace(/(.{76})/g, '$1\n')
  const r = extraerImagenesIncrustadas(`<img src="data:image/png;base64,${b}">`)
  assert.deepEqual([...r.imagenes[0].datos], bytes)
})

test('los nombres extraidos no pisan archivos existentes', () => {
  const r = extraerImagenesIncrustadas(
    `<img src="data:image/png;base64,${b64([1])}">`,
    0,
    new Set(['assets/img-1.png']),
  )
  assert.equal(r.imagenes[0].ruta, 'assets/img-2.png')
})

test('extension segun tipoMime devuelto', async () => {
  const jpeg: OptimizadorImagen = {
    async optimizar(d) {
      return { datos: d.slice(0, 10), tipoMime: 'image/jpeg' }
    },
  }
  const r = await optimizarArtefacto([arch('a.png', new Uint8Array(100))], jpeg)
  assert.equal(r.archivos[0].ruta, 'a.jpg')
})

test('html y css solo se recodifican si cambian (BOM intacto)', async () => {
  const datos = new Uint8Array([0xef, 0xbb, 0xbf, ...enc.encode('<p>x</p>')])
  const r = await optimizarArtefacto([arch('a.png', new Uint8Array(100)), arch('i.html', datos)], mitad)
  assert.deepEqual([...r.archivos.find((a) => a.ruta === 'i.html')!.datos], [...datos])
})

test('referencias relativas al directorio de cada archivo', async () => {
  const r = await optimizarArtefacto(
    [
      arch('pages/a.html', enc.encode('<img src="../img/x.png">')),
      arch('img/x.png', new Uint8Array(100)),
    ],
    mitad,
  )
  assert.ok(dec.decode(r.archivos.find((a) => a.ruta === 'pages/a.html')!.datos).includes('src="../img/x.webp"'))
})

test('inicio entre dos html no colisiona', async () => {
  const d = (n: number) => enc.encode(`<img src="data:image/png;base64,${b64([n])}">`)
  const r = await optimizarArtefacto([arch('a.html', d(1)), arch('b.html', d(2))], {
    async optimizar() {
      return null
    },
  })
  const imgs = r.archivos.filter((a) => a.ruta.startsWith('assets/')).map((a) => a.ruta).sort()
  assert.deepEqual(imgs, ['assets/img-1.png', 'assets/img-2.png'])
})
