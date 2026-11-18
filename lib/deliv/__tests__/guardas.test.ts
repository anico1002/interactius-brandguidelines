import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, posix, relative, sep } from 'node:path'

/*
 * Guarda de la service role. La clave salta la RLS entera: solo la pueden
 * nombrar (o importar el modulo que la usa) los ficheros de la lista de
 * Global Constraints, y nunca uno marcado con 'use client'.
 */

const RAIZ = join(import.meta.dirname, '..', '..', '..')
const EXCLUIDOS = new Set(['node_modules', '.next', '.git', 'docs'])
const CODIGO = /\.(ts|tsx|js|jsx|mjs|cjs)$/
const ESTE = 'lib/deliv/__tests__/guardas.test.ts'
const PROHIBIDO = /SUPABASE_SERVICE_ROLE_KEY|deliv\/servidor/
const ESPECIFICADOR = /(?:\bfrom|\bimport|\brequire)\s*\(?\s*(['"])([^'"\n]+)\1/g
const SERVIDOR = 'lib/deliv/servidor'

/** El especificador resuelto desde la raiz, sin extension; null si es un paquete. */
function resolver(ruta: string, spec: string): string | null {
  let r: string
  if (spec.startsWith('@/')) r = posix.normalize(spec.slice(2))
  else if (spec.startsWith('.')) r = posix.normalize(posix.join(posix.dirname(ruta), spec))
  else return null
  return r.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '').replace(/\/index$/, '')
}

/**
 * Nombra la clave, o importa lib/deliv/servidor por cualquier camino: '@/',
 * relativo desde la misma carpeta ('./servidor.ts') o desde otra.
 */
export function referenciaServicio(ruta: string, texto: string): boolean {
  if (PROHIBIDO.test(texto)) return true
  for (const m of texto.matchAll(ESPECIFICADOR)) {
    if (resolver(ruta, m[2]) === SERVIDOR) return true
  }
  return false
}
const USE_CLIENT = /^\s*(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/

function permitido(ruta: string): boolean {
  if (ruta === 'lib/deliv/servidor.ts' || ruta === 'lib/deliv/config.ts') return true
  if (ruta.startsWith('app/clientes/')) return true
  // Solo las paginas (servidor) del workspace de Deliv_r; los componentes cliente nunca lo importan.
  if (ruta.startsWith('app/workspace/deliv_r/') && ruta.endsWith('/page.tsx')) return true
  if (ruta.startsWith('app/api/deliv_r/usuarios/')) return true
  if (ruta.startsWith('app/api/deliv_r/') && ruta.split('/').includes('accesos')) return true
  return false
}

function* ficheros(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUIDOS.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* ficheros(p)
    else if (e.isFile() && CODIGO.test(e.name)) yield p
  }
}

test('permitido: la lista de Global Constraints', () => {
  assert.equal(permitido('lib/deliv/servidor.ts'), true)
  assert.equal(permitido('lib/deliv/config.ts'), true)
  assert.equal(permitido('app/clientes/[cliente]/page.tsx'), true)
  assert.equal(permitido('app/api/deliv_r/[id]/accesos/route.ts'), true)
  assert.equal(permitido('app/api/deliv_r/usuarios/[email]/route.ts'), true)
  assert.equal(permitido('lib/deliv/supabase-repo.ts'), false)
  assert.equal(permitido('app/api/deliv_r/[id]/route.ts'), false)
  assert.equal(permitido('app/workspace/deliv_r/page.tsx'), true)
  assert.equal(permitido('app/workspace/deliv_r/[id]/page.tsx'), true)
  assert.equal(permitido('app/workspace/deliv_r/layout.tsx'), false)
  assert.equal(permitido('components/deliv/equipo/Ficha.tsx'), false)
})

test('referenciaServicio: la clave y cualquier import que resuelva a servidor', () => {
  assert.equal(referenciaServicio('lib/deliv/x.ts', "import { repoServicio } from './servidor.ts'"), true)
  assert.equal(referenciaServicio('lib/deliv/x.ts', "import { repoServicio } from './servidor'"), true)
  assert.equal(referenciaServicio('lib/deliv/sub/x.ts', 'export * from "../servidor.ts"'), true)
  assert.equal(referenciaServicio('app/api/x/route.ts', "const m = await import('../../../lib/deliv/servidor')"), true)
  assert.equal(referenciaServicio('app/api/x/route.ts', "import { repoServicio } from '@/lib/deliv/servidor'"), true)
  assert.equal(referenciaServicio('app/x.ts', "const s = require('@/lib/deliv/servidor.ts')"), true)
  assert.equal(referenciaServicio('app/x.ts', 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY'), true)
  assert.equal(referenciaServicio('app/x.ts', "import { a } from './servidor.ts'"), false)
  assert.equal(referenciaServicio('lib/deliv/x.ts', "import { a } from './supabase-repo.ts'"), false)
  assert.equal(referenciaServicio('lib/deliv/x.ts', "import 'server-only'"), false)
})

test('un import relativo ./servidor.ts fuera de la lista queda marcado', () => {
  const ruta = 'lib/deliv/otro.ts'
  assert.equal(referenciaServicio(ruta, "import { repoServicio } from './servidor.ts'"), true)
  assert.equal(permitido(ruta), false)
})

test("la service role solo aparece en los ficheros permitidos y nunca con 'use client'", () => {
  const malos: string[] = []
  for (const abs of ficheros(RAIZ)) {
    const ruta = relative(RAIZ, abs).split(sep).join('/')
    if (ruta === ESTE) continue
    const texto = readFileSync(abs, 'utf8')
    if (!referenciaServicio(ruta, texto)) continue
    if (!permitido(ruta)) malos.push(`${ruta}: fuera de la lista permitida`)
    else if (USE_CLIENT.test(texto)) malos.push(`${ruta}: fichero 'use client'`)
  }
  assert.deepEqual(malos, [])
})

test("servidor.ts empieza por import 'server-only'", () => {
  const texto = readFileSync(join(RAIZ, 'lib/deliv/servidor.ts'), 'utf8')
  assert.match(texto, /^import 'server-only'\n/)
})
