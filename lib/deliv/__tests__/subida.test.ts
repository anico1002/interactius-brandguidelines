import { test } from 'node:test'
import assert from 'node:assert/strict'
import { zipSync, strToU8 } from 'fflate'

import {
  LIMITE_TOTAL,
  clasificar,
  detectarAvisos,
  rutaArchivoSegura,
  tipoMime,
} from '../subida.ts'

const u8 = (s: string) => strToU8(s)

test('tipoMime cubre la tabla y .md', () => {
  assert.equal(tipoMime('a/b.HTML'), 'text/html; charset=utf-8')
  assert.equal(tipoMime('x.md'), 'text/markdown; charset=utf-8')
  assert.equal(tipoMime('x.webp'), 'image/webp')
  assert.equal(tipoMime('x.zzz'), 'application/octet-stream')
})

test('rutaArchivoSegura', () => {
  assert.equal(rutaArchivoSegura('assets/a.png'), 'assets/a.png')
  for (const mala of ['../x', 'a/../b', '/abs', 'a\\b', '', 'a//b', 'a/\x01', '.']) {
    assert.equal(rutaArchivoSegura(mala), null, mala)
  }
})

test('html suelto', () => {
  const r = clasificar('Informe final.html', u8('<p>hola</p>'))
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.tipo, 'html')
    assert.equal(r.archivos.length, 1)
    assert.equal(r.entrada, r.archivos[0].ruta)
    assert.equal(r.archivos[0].tipoMime, 'text/html; charset=utf-8')
  }
})

test('pdf suelto', () => {
  const r = clasificar('a.pdf', new Uint8Array([1, 2, 3]))
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.tipo, 'pdf')
    assert.equal(r.archivos[0].tipoMime, 'application/pdf')
  }
})

test('extension no admitida', () => {
  assert.equal(clasificar('a.exe', u8('x')).ok, false)
})

test('zip con index.html en la raiz', () => {
  const z = zipSync({ 'index.html': u8('<p>x</p>'), 'css/a.css': u8('a{}') })
  const r = clasificar('x.zip', z)
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.tipo, 'html')
    assert.equal(r.entrada, 'index.html')
    assert.deepEqual(r.archivos.map((a) => a.ruta).sort(), ['css/a.css', 'index.html'])
  }
})

test('zip con una carpeta raiz se aplana', () => {
  const z = zipSync({ 'mi/index.html': u8('x'), 'mi/img/a.png': new Uint8Array([1]) })
  const r = clasificar('x.zip', z)
  assert.ok(r.ok)
  if (r.ok) assert.deepEqual(r.archivos.map((a) => a.ruta).sort(), ['img/a.png', 'index.html'])
})

test('zip sin index.html', () => {
  const r = clasificar('x.zip', zipSync({ 'a.html': u8('x') }))
  assert.equal(r.ok, false)
  if (!r.ok) assert.match(r.error, /index\.html/)
})

test('zip con ruta insegura', () => {
  const r = clasificar('x.zip', zipSync({ 'index.html': u8('x'), '../x': u8('y') }))
  assert.equal(r.ok, false)
})

test('zip ignora __MACOSX y ocultos', () => {
  const z = zipSync({
    'index.html': u8('x'),
    '__MACOSX/._index.html': u8('y'),
    '.DS_Store': u8('z'),
    'css/.hidden': u8('z'),
  })
  const r = clasificar('x.zip', z)
  assert.ok(r.ok)
  if (r.ok) assert.deepEqual(r.archivos.map((a) => a.ruta), ['index.html'])
})

test('total superior al limite da error con el tamano', () => {
  const r = clasificar('a.pdf', { length: LIMITE_TOTAL + 1 } as Uint8Array)
  assert.equal(r.ok, false)
  if (!r.ok) assert.match(r.error, /100/)
})

test('detectarAvisos', () => {
  const av = detectarAvisos([
    { ruta: 'index.html', datos: u8('window.claude.complete()'), tipoMime: 'text/html' },
    { ruta: 'a.js', datos: u8('window.claude.x'), tipoMime: 'text/javascript' },
  ])
  assert.equal(av.length, 1)
  assert.match(av[0], /window\.claude/)
  assert.deepEqual(detectarAvisos([{ ruta: 'a.html', datos: u8('hola'), tipoMime: 'x' }]), [])
})

test('zip con ruta absoluta o con barra invertida', () => {
  for (const mala of ['/etc/x', 'a\\b.txt']) {
    const r = clasificar('x.zip', zipSync({ 'index.html': u8('x'), [mala]: u8('y') }))
    assert.equal(r.ok, false, mala)
  }
})

test('archivoDemasiadoGrande: avisa del primer archivo de más de 50 MB', async () => {
  const { archivoDemasiadoGrande, LIMITE_ARCHIVO } = await import('../subida.ts')
  assert.equal(archivoDemasiadoGrande([{ ruta: 'a.pdf', bytes: LIMITE_ARCHIVO }]), null)
  assert.equal(
    archivoDemasiadoGrande([{ ruta: 'a.png', bytes: 10 }, { ruta: 'vídeo.mp4', bytes: 60 * 1024 * 1024 }]),
    '«vídeo.mp4» pesa 60,0 MB y el límite por archivo es de 50 MB. Comprímelo o divídelo antes de subirlo.',
  )
})

test('entregaExterna: descargables, vídeo y el resto', async () => {
  const { entregaExterna } = await import('../subida.ts')
  assert.equal(entregaExterna('archivos/Digest.PDF'), 'descarga')
  assert.equal(entregaExterna('prompts/1-contexto.md'), 'descarga')
  assert.equal(entregaExterna('podcast.m4a'), 'descarga')
  assert.equal(entregaExterna('video/intro.mp4'), 'directo')
  for (const r of ['index.html', 'css/app.css', 'img/a.webp', 'fonts/x.woff2', 'app.js']) {
    assert.equal(entregaExterna(r), null, r)
  }
})
