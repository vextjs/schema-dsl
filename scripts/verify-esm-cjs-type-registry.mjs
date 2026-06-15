import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const requireFromScript = createRequire(import.meta.url)

const cjs = requireFromScript(join(rootDir, 'dist/index.cjs'))
const esm = await import(`${pathToFileURL(join(rootDir, 'dist/index.js')).href}?t=${Date.now()}`)

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function captureWarnings(action) {
  const originalWarn = console.warn
  const warnings = []
  console.warn = (...args) => warnings.push(args.join(' '))
  try {
    action()
  } finally {
    console.warn = originalWarn
  }
  return warnings
}

function resetRuntimeState() {
  esm.resetRuntimeState()
  cjs.resetRuntimeState()
}

resetRuntimeState()

const cjsType = 'interop-cjs-registered-object'
cjs.DslBuilder.registerType(cjsType, {
  type: 'object',
  properties: {
    key: { type: 'string' },
  },
  required: ['key'],
})

assert(esm.DslBuilder.hasType(cjsType), 'ESM entry cannot see type registered from CJS entry')
assert(
  esm.DslBuilder.getCustomTypes().includes(cjsType),
  'ESM DslBuilder custom type cache did not reflect CJS registration',
)
assert(
  captureWarnings(() => esm.dsl(`array<${cjsType}>!`).toJsonSchema()).length === 0,
  'ESM entry warned for a type registered from CJS entry',
)

resetRuntimeState()

const esmType = 'interop-esm-registered-object'
esm.DslBuilder.registerType(esmType, {
  type: 'object',
  properties: {
    key: { type: 'string' },
  },
  required: ['key'],
})

assert(cjs.DslBuilder.hasType(esmType), 'CJS entry cannot see type registered from ESM entry')
assert(
  cjs.DslBuilder.getCustomTypes().includes(esmType),
  'CJS DslBuilder custom type cache did not reflect ESM registration',
)
assert(
  captureWarnings(() => cjs.dsl(`array<${esmType}>!`).toJsonSchema()).length === 0,
  'CJS entry warned for a type registered from ESM entry',
)

cjs.TypeRegistry.setStrict(true)
let strictShared = false
try {
  esm.dsl('definitely-unknown-interop-type')
} catch {
  strictShared = true
}
assert(strictShared, 'TypeRegistry strict mode is not shared across CJS and ESM entries')

resetRuntimeState()
console.log('[schema-dsl] ESM/CJS type registry interop OK')
