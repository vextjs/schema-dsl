import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const requireFromScript = createRequire(import.meta.url)

const cjs = requireFromScript(join(rootDir, 'dist/index.cjs'))
cjs.s.config({
  patterns: {
    phone: {
      beforeEsmImport: { pattern: /^before-esm$/, key: 'pattern.phone.beforeEsmImport' },
    },
  },
})
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

assert(esm.PATTERNS.phone.beforeEsmImport?.pattern.test('before-esm'), 'ESM import did not observe pre-existing CJS PATTERNS state')
esm.resetRuntimeState()
assert(cjs.PATTERNS.phone.beforeEsmImport === undefined, 'late-loaded ESM captured mutable PATTERNS as reset defaults')

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

cjs.s.config({
  defaultLocale: 'zh-CN',
  cache: { maxSize: 17 },
  patterns: {
    phone: {
      interop: { pattern: /^interop$/, key: 'pattern.phone.interop' },
    },
  },
})

assert(esm.Locale.getLocale() === 'zh-CN', 'ESM Locale cannot see CJS defaultLocale configuration')
assert(esm.getDefaultValidator().cache.options.maxSize === 17, 'ESM default Validator cannot see CJS cache configuration')
assert(esm.PATTERNS.phone.interop?.pattern.test('interop'), 'ESM PATTERNS cannot see CJS pattern configuration')

cjs.registerExtension({
  literal: 'interop-code',
  factoryName: 'interopCode',
  schema: { type: 'string', pattern: '^INT-[0-9]+$' },
})
assert(typeof esm.s.interopCode === 'function', 'ESM namespace cannot see CJS extension factory registration')
assert((await esm.s.interopCode().validate('INT-42')).valid, 'ESM extension factory registered from CJS is not executable')

esm.resetRuntimeState()
assert(cjs.Locale.getLocale() === 'en-US', 'CJS Locale did not observe ESM resetRuntimeState()')
assert(cjs.PATTERNS.phone.interop === undefined, 'CJS PATTERNS did not observe ESM resetRuntimeState()')
assert(cjs.s.interopCode === undefined, 'CJS extension namespace did not observe ESM resetRuntimeState()')
assert(cjs.getDefaultValidator().cache.options.maxSize !== 17, 'CJS default Validator did not observe ESM resetRuntimeState()')

const cjsFormatPlugin = requireFromScript(join(rootDir, 'dist/plugins/custom-format.cjs')).default
const esmFormatPlugin = (await import(`${pathToFileURL(join(rootDir, 'dist/plugins/custom-format.js')).href}?t=${Date.now()}`)).default
const formatManagerA = new cjs.PluginManager()
const formatManagerB = new cjs.PluginManager()
formatManagerA.register(cjsFormatPlugin).install(cjs, 'custom-format')
formatManagerB.register(esmFormatPlugin).install(cjs, 'custom-format')
formatManagerA.unregister('custom-format', cjs)
assert(cjs.DslBuilder.hasType('phone-cn'), 'ESM/CJS custom-format lease released a type while another owner remained')
formatManagerB.unregister('custom-format', cjs)
assert(!cjs.DslBuilder.hasType('phone-cn'), 'ESM/CJS custom-format final lease did not release its type')

const cjsTypePlugin = requireFromScript(join(rootDir, 'dist/plugins/custom-type-example.cjs')).default
const esmTypePlugin = (await import(`${pathToFileURL(join(rootDir, 'dist/plugins/custom-type-example.js')).href}?t=${Date.now()}`)).default
const typeManagerA = new cjs.PluginManager()
const typeManagerB = new cjs.PluginManager()
typeManagerA.register(cjsTypePlugin).install(cjs, 'custom-type-example')
typeManagerB.register(esmTypePlugin).install(cjs, 'custom-type-example')
typeManagerA.unregister('custom-type-example', cjs)
assert(cjs.DslBuilder.hasType('order-id'), 'ESM/CJS custom-type lease released a type while another owner remained')
typeManagerB.unregister('custom-type-example', cjs)
assert(!cjs.DslBuilder.hasType('order-id'), 'ESM/CJS custom-type final lease did not release its type')

const cjsValidatorPlugin = requireFromScript(join(rootDir, 'dist/plugins/custom-validator.cjs')).default
const esmValidatorPlugin = (await import(`${pathToFileURL(join(rootDir, 'dist/plugins/custom-validator.js')).href}?t=${Date.now()}`)).default
const validatorManagerA = new cjs.PluginManager()
const validatorManagerB = new cjs.PluginManager()
validatorManagerA.register(cjsValidatorPlugin).install(cjs, 'custom-validator')
validatorManagerB.register(esmValidatorPlugin).install(cjs, 'custom-validator')
validatorManagerA.unregister('custom-validator', cjs)
assert(cjs.getDefaultValidator().getAjv().getKeyword('unique'), 'ESM/CJS custom-validator lease released a keyword while another owner remained')
validatorManagerB.unregister('custom-validator', cjs)
assert(!cjs.getDefaultValidator().getAjv().getKeyword('unique'), 'ESM/CJS custom-validator final lease did not release its keyword')

resetRuntimeState()
console.log('[schema-dsl] ESM/CJS runtime state interop OK')
