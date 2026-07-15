import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const tempRoot = mkdtempSync(join(tmpdir(), 'schema-dsl-packed-consumer-'))
const packDir = join(tempRoot, 'pack')
const positiveDir = join(tempRoot, 'positive')
const negativeDir = join(tempRoot, 'negative')

function run(command, args, cwd, options = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: options.capture ? 'pipe' : 'inherit',
  })
}

function writePackage(directory) {
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'package.json'), JSON.stringify({
    name: `schema-dsl-packed-${basename(directory)}`,
    version: '1.0.0',
    private: true,
    type: 'module',
  }, null, 2))
}

try {
  mkdirSync(packDir, { recursive: true })
  const packOutput = run(npmCommand, ['pack', '--json', '--pack-destination', packDir], repoRoot, { capture: true })
  const packResult = JSON.parse(packOutput)
  const tarball = join(packDir, packResult[0].filename)
  const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
  const exportSpecifiers = Object.keys(packageJson.exports).map(key =>
    key === '.' ? 'schema-dsl' : `schema-dsl${key.slice(1)}`
  )

  writePackage(positiveDir)
  run(npmCommand, [
    'install', tarball,
    '@babel/parser@^7.29.7',
    '@babel/traverse@^7.29.7',
    '@babel/generator@^7.29.7',
    '@babel/types@^7.29.7',
    'esbuild@^0.28.1',
    '--ignore-scripts',
    '--no-package-lock',
  ], positiveDir)

  const sideEffectCases = [
    ['pure', 'schema-dsl/pure', false],
    ['root', 'schema-dsl', false],
    ['compat', 'schema-dsl/compat', true],
    ['register-string', 'schema-dsl/register-string', true],
  ]
  for (const [name, specifier, expected] of sideEffectCases) {
    writeFileSync(join(positiveDir, `side-effect-${name}.mjs`), `
const before = Object.getOwnPropertyDescriptors(String.prototype)
await import('${specifier}')
const installed = typeof ''.label === 'function'
if (installed !== ${expected}) throw new Error('${specifier} String side-effect contract changed')
if (!${expected}) {
  const after = Object.getOwnPropertyDescriptors(String.prototype)
  const changed = Reflect.ownKeys({ ...before, ...after }).filter(key => {
    const left = before[key]
    const right = after[key]
    return !left || !right
      || left.configurable !== right.configurable
      || left.enumerable !== right.enumerable
      || left.writable !== right.writable
      || !Object.is(left.value, right.value)
      || !Object.is(left.get, right.get)
      || !Object.is(left.set, right.set)
  })
  if (changed.length > 0) throw new Error('${specifier} mutated String.prototype descriptors: ' + changed.join(','))
}
`)
    writeFileSync(join(positiveDir, `side-effect-${name}.cjs`), `
const before = Object.getOwnPropertyDescriptors(String.prototype)
require('${specifier}')
const installed = typeof ''.label === 'function'
if (installed !== ${expected}) throw new Error('${specifier} CommonJS String side-effect contract changed')
if (!${expected}) {
  const after = Object.getOwnPropertyDescriptors(String.prototype)
  const changed = Reflect.ownKeys({ ...before, ...after }).filter(key => {
    const left = before[key]
    const right = after[key]
    return !left || !right
      || left.configurable !== right.configurable
      || left.enumerable !== right.enumerable
      || left.writable !== right.writable
      || !Object.is(left.value, right.value)
      || !Object.is(left.get, right.get)
      || !Object.is(left.set, right.set)
  })
  if (changed.length > 0) throw new Error('${specifier} CommonJS mutated String.prototype descriptors: ' + changed.join(','))
}
`)
    run('node', [`side-effect-${name}.mjs`], positiveDir)
    run('node', [`side-effect-${name}.cjs`], positiveDir)
  }

  writeFileSync(join(positiveDir, 'bundle-side-effects.mjs'), `
import { build } from 'esbuild'
const cases = ${JSON.stringify(sideEffectCases)}
for (const [name, specifier, expected] of cases) {
  const source = \`import '\${specifier}'; const installed = typeof ''.label === 'function'; if (installed !== \${expected}) throw new Error('\${specifier} bundled String side-effect contract changed')\`
  await build({ stdin: { contents: source, resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', outfile: \`bundle-\${name}.mjs\` })
}
`)
  run('node', ['bundle-side-effects.mjs'], positiveDir)
  for (const [name] of sideEffectCases) run('node', [`bundle-${name}.mjs`], positiveDir)

  writeFileSync(join(positiveDir, 'entry.ts'), 'export const field = "email!".label("Email")\n')
  writeFileSync(join(positiveDir, 'verify.mjs'), `
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
const specifiers = ${JSON.stringify(exportSpecifiers)}
for (const specifier of specifiers) {
  await import(specifier)
  require(specifier)
}

const { transformSchemaDsl } = await import('schema-dsl/transform')
const transformed = transformSchemaDsl('const field = "email!".label("Email")', { filename: 'entry.ts' })
if (!transformed.changed || !transformed.code.includes('schema-dsl/pure')) {
  throw new Error('packed transform did not rewrite a valid DSL chain')
}
const parseFailure = transformSchemaDsl('const broken = ', { filename: 'broken.ts' })
if (parseFailure.changed || parseFailure.warnings[0]?.code !== 'parse-error') {
  throw new Error('source parse failures no longer use the warning contract')
}

const { schemaDslEsbuildPlugin } = await import('schema-dsl/esbuild')
await build({
  entryPoints: ['entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  plugins: [schemaDslEsbuildPlugin()],
})

console.log('[schema-dsl] packed positive consumer OK')
`)
  run('node', ['verify.mjs'], positiveDir)

  writePackage(negativeDir)
  run(npmCommand, [
    'install', tarball,
    '--omit=optional',
    '--ignore-scripts',
    '--no-package-lock',
  ], negativeDir)
  writeFileSync(join(negativeDir, 'entry.ts'), 'export const field = "email!".label("Email")\n')
  writeFileSync(join(negativeDir, 'verify.mjs'), `
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const expectedCode = 'SCHEMA_DSL_BABEL_PEER_MISSING'
function assertMissingPeer(error, label, ErrorClass) {
  if (!(error instanceof ErrorClass) || error.code !== expectedCode || !String(error.message).includes('npm install -D')) {
    throw new Error(label + ' did not fail with the missing Babel peer contract: ' + String(error))
  }
}

const esmTransform = await import('schema-dsl/transform')
try {
  esmTransform.transformSchemaDsl('const field = "email!".label("Email")')
  throw new Error('ESM transform unexpectedly succeeded without Babel peers')
} catch (error) {
  assertMissingPeer(error, 'ESM transform', esmTransform.BabelPeerDependencyError)
}

const cjsTransform = require('schema-dsl/transform')
try {
  cjsTransform.transformSchemaDsl('const field = "email!".label("Email")')
  throw new Error('CJS transform unexpectedly succeeded without Babel peers')
} catch (error) {
  assertMissingPeer(error, 'CJS transform', cjsTransform.BabelPeerDependencyError)
}

const { schemaDslEsbuildPlugin } = await import('schema-dsl/esbuild')
let onLoad
schemaDslEsbuildPlugin().setup({
  initialOptions: {},
  onLoad(_options, callback) { onLoad = callback },
})
try {
  await onLoad({ path: fileURLToPath(new URL('entry.ts', import.meta.url)) })
  throw new Error('esbuild adapter unexpectedly succeeded without Babel peers')
} catch (error) {
  assertMissingPeer(error, 'esbuild adapter', esmTransform.BabelPeerDependencyError)
}

console.log('[schema-dsl] packed missing-peer consumer OK')
`)
  run('node', ['verify.mjs'], negativeDir)
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
