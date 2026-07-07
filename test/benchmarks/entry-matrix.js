/**
 * Entry matrix benchmark for schema-dsl public validation paths.
 *
 * Run:
 *   node test/benchmarks/entry-matrix.js --smoke --json
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { cpus } from 'node:os'
import { createRequire } from 'node:module'
import { Bench } from 'tinybench'
import { dsl as rootDsl, validate as rootValidate, Validator } from '../../dist/index.js'
import { validate as pureValidate } from '../../dist/pure.js'
import { createRuntime } from '../../dist/runtime.js'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const args = process.argv.slice(2)
const isSmoke = args.includes('--smoke')
const shouldWriteJson = args.includes('--json') || args.includes('--json-only')
const isJsonOnly = args.includes('--json-only')
const outputPath = getArgValue('--output')
const benchOptions = isSmoke
  ? { time: 300, iterations: 30 }
  : { time: 1500, iterations: 100 }

const definition = {
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120!',
  tags: 'array:1-10<string>',
}
const schema = rootDsl(definition)
const validData = {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
  tags: ['javascript', 'nodejs'],
}
const batchData = Array.from({ length: 50 }, () => validData)
const runtime = createRuntime()
const runtimeSchema = runtime.compile(definition)
const validator = new Validator()
const compiled = validator.compile(schema)

function getArgValue(name) {
  const index = args.indexOf(name)
  if (index === -1) return null
  return args[index + 1] ?? null
}

function formatOps(hz) {
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(3)} M ops/s`
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(2)} K ops/s`
  return `${hz.toFixed(2)} ops/s`
}

function toMicroseconds(milliseconds) {
  return milliseconds * 1000
}

function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: join(__dirname, '..', '..') })
      .toString()
      .trim()
  } catch {
    return null
  }
}

function getPackageVersion(name) {
  try {
    return require(`${name}/package.json`).version ?? null
  } catch {
    return null
  }
}

function collectResults(bench) {
  return bench.tasks.map(task => {
    const meanMs = task.result?.mean ?? 0
    const p99Ms = task.result?.p99 ?? 0
    return {
      name: task.name,
      hz: task.result?.hz ?? 0,
      opsPerSecond: task.result?.hz ?? 0,
      meanMs,
      meanMicroseconds: toMicroseconds(meanMs),
      p99Ms,
      p99Microseconds: toMicroseconds(p99Ms),
      samples: task.result?.samples?.length ?? 0,
    }
  })
}

function printTable(tasks) {
  console.log(`\n${'-'.repeat(80)}`)
  console.log('  schema-dsl Entry Matrix')
  console.log('-'.repeat(80))
  console.log(`  ${'Entry'.padEnd(30)}  ${'ops/sec'.padStart(18)}  ${'avg(us)'.padStart(10)}  ${'p99(us)'.padStart(10)}`)
  console.log('-'.repeat(80))

  for (const task of [...tasks].sort((a, b) => b.hz - a.hz)) {
    console.log(
      `  ${task.name.padEnd(30)}  ${formatOps(task.hz).padStart(18)}  ` +
      `${task.meanMicroseconds.toFixed(3).padStart(9)}  ` +
      `${task.p99Microseconds.toFixed(3).padStart(9)}`
    )
  }
}

function createPayload(tasks) {
  const byName = Object.fromEntries(tasks.map(task => [task.name, task.hz]))
  const rootHz = byName['root validate(schema)'] ?? 0
  return {
    metadata: {
      kind: 'schema-dsl-entry-matrix',
      mode: isSmoke ? 'smoke' : 'full',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0]?.model ?? null,
      gitSha: getGitSha(),
      packageVersion: require('../../package.json').version,
      dependencies: {
        tinybench: getPackageVersion('tinybench'),
      },
      benchOptions,
      createdAt: new Date().toISOString(),
    },
    entries: tasks.map(task => ({
      ...task,
      ratioVsRootValidate: rootHz > 0 ? task.hz / rootHz : null,
    })),
  }
}

function writeJsonReport(payload) {
  const target = outputPath ?? join(__dirname, '.tmp', `entry-matrix-${payload.metadata.mode}-${Date.now()}.json`)
  payload.metadata.jsonReport = target
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  if (!isJsonOnly) console.log(`  JSON report: ${target}`)
  return target
}

const bench = new Bench(benchOptions)
bench
  .add('root validate(schema)', () => rootValidate(schema, validData))
  .add('pure validate(schema)', () => pureValidate(schema, validData))
  .add('runtime validate(schema)', () => runtime.validate(runtimeSchema, validData))
  .add('Validator.validate(schema)', () => validator.validate(schema, validData))
  .add('Validator.validate(compiled)', () => validator.validate(compiled, validData))
  .add('Validator.validateBatch(50)', () => validator.validateBatch(schema, batchData))

await bench.warmup()
await bench.run()

const tasks = collectResults(bench)
const payload = createPayload(tasks)

if (!isJsonOnly) printTable(tasks)
if (shouldWriteJson) {
  writeJsonReport(payload)
}
if (isJsonOnly) console.log(JSON.stringify(payload, null, 2))

runtime.dispose()
