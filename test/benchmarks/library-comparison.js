/**
 * schema-dsl Performance Benchmark Comparison
 *
 * Run:
 *   npm run bench
 *   node test/benchmarks/library-comparison.js --smoke --json
 *
 * Prerequisites: npm run build (requires dist/ output)
 */

import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { cpus } from 'node:os'
import { Bench } from 'tinybench'
import { dsl, validate } from '../../dist/index.js'
import { z } from 'zod'
import Joi from 'joi'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const require = createRequire(import.meta.url)
const FastestValidator = require('fastest-validator')
const fv = new FastestValidator()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const args = process.argv.slice(2)
const isSmoke = args.includes('--smoke')
const shouldWriteJson = args.includes('--json') || args.includes('--json-only')
const isJsonOnly = args.includes('--json-only')
const outputPath = getArgValue('--output')
const benchOptions = isSmoke
  ? { time: 300, iterations: 30 }
  : { time: 2000, iterations: 100 }

// ── Raw AJV (direct usage, bypassing the schema-dsl layer) ──────────────────
const rawAjv = new Ajv({ allErrors: true })
addFormats(rawAjv)

// ─────────────────────────────────────────────────────────────────
// Test Scenarios S1 / S2: Simple Object (user login form)
// ─────────────────────────────────────────────────────────────────

const SIMPLE_VALID = {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
  tags: ['javascript', 'nodejs'],
}

const SIMPLE_INVALID = {
  username: 'jo',
  email: 'not-an-email',
  age: 15,
  tags: [],
}

const sdSimple = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120!',
  tags: 'array:1-10<string>',
})

const ajvSimpleJsonSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 32 },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 18, maximum: 120 },
    tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 10 },
  },
  required: ['username', 'email', 'age', 'tags'],
  additionalProperties: true,
}
const ajvSimpleValidate = rawAjv.compile(ajvSimpleJsonSchema)

const zodSimple = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  tags: z.array(z.string()).min(1).max(10),
})

const joiSimple = Joi.object({
  username: Joi.string().min(3).max(32).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  age: Joi.number().min(18).max(120).required(),
  tags: Joi.array().items(Joi.string()).min(1).max(10).required(),
})

const fvSimpleCheck = fv.compile({
  username: { type: 'string', min: 3, max: 32 },
  email: { type: 'email' },
  age: { type: 'number', min: 18, max: 120 },
  tags: { type: 'array', items: 'string', min: 1, max: 10 },
})

// ─────────────────────────────────────────────────────────────────
// Test Scenario S3: Nested Object (standard JSON Schema nesting syntax)
// ─────────────────────────────────────────────────────────────────

const NESTED_VALID = {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
  address: {
    street: '123 Main St',
    city: 'Beijing',
    zipCode: '100000',
  },
  tags: ['js', 'ts'],
}

const sdNested = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120!',
  address: {
    type: 'object',
    properties: {
      street: { type: 'string' },
      city: { type: 'string' },
      zipCode: { type: 'string', minLength: 6, maxLength: 6 },
    },
    required: ['street', 'city', 'zipCode'],
  },
  tags: 'array:1-10<string>',
})

const ajvNestedJsonSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 32 },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 18, maximum: 120 },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zipCode: { type: 'string', minLength: 6, maxLength: 6 },
      },
      required: ['street', 'city', 'zipCode'],
    },
    tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 10 },
  },
  required: ['username', 'email', 'age', 'address', 'tags'],
  additionalProperties: true,
}
const ajvNestedValidate = rawAjv.compile(ajvNestedJsonSchema)

const zodNested = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string().length(6),
  }),
  tags: z.array(z.string()).min(1).max(10),
})

const joiNested = Joi.object({
  username: Joi.string().min(3).max(32).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  age: Joi.number().min(18).max(120).required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    zipCode: Joi.string().length(6).required(),
  }).required(),
  tags: Joi.array().items(Joi.string()).min(1).max(10).required(),
})

const fvNestedCheck = fv.compile({
  username: { type: 'string', min: 3, max: 32 },
  email: { type: 'email' },
  age: { type: 'number', min: 18, max: 120 },
  address: {
    type: 'object',
    props: {
      street: { type: 'string' },
      city: { type: 'string' },
      zipCode: { type: 'string', length: 6 },
    },
  },
  tags: { type: 'array', items: 'string', min: 1, max: 10 },
})

const TIER1 = ['schema-dsl', 'ajv (raw)', 'zod', 'joi']
const TIER2 = ['fastest-validator']

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

function toSeconds(milliseconds) {
  return milliseconds / 1000
}

function getPackageVersion(name) {
  try {
    return require(`${name}/package.json`).version ?? null
  } catch {
    return null
  }
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

function createRunMetadata() {
  return {
    mode: isSmoke ? 'smoke' : 'full',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model ?? null,
    gitSha: getGitSha(),
    packageVersion: require('../../package.json').version,
    dependencies: {
      ajv: getPackageVersion('ajv'),
      'ajv-formats': getPackageVersion('ajv-formats'),
      fastestValidator: getPackageVersion('fastest-validator'),
      joi: getPackageVersion('joi'),
      tinybench: getPackageVersion('tinybench'),
      zod: getPackageVersion('zod'),
    },
    benchOptions,
    startedAt: new Date().toISOString(),
  }
}

function collectBenchResult(scenarioId, title, bench, schemaDslTaskName) {
  const tasks = bench.tasks.map(task => {
    const hz = task.result?.hz ?? 0
    const meanMs = task.result?.mean ?? 0
    const p99Ms = task.result?.p99 ?? 0
    return {
      name: task.name,
      hz,
      opsPerSecond: hz,
      meanMs,
      meanSeconds: toSeconds(meanMs),
      meanMicroseconds: toMicroseconds(meanMs),
      p99Ms,
      p99Seconds: toSeconds(p99Ms),
      p99Microseconds: toMicroseconds(p99Ms),
      samples: task.result?.samples?.length ?? 0,
    }
  })

  const hzByName = Object.fromEntries(tasks.map(task => [task.name, task.hz]))
  const schemaDslHz = hzByName[schemaDslTaskName] ?? 0
  const ratios = Object.fromEntries(tasks.map(task => [
    task.name,
    schemaDslHz > 0 ? task.hz / schemaDslHz : null,
  ]))

  return {
    id: scenarioId,
    title,
    schemaDslTaskName,
    schemaDslHz,
    ratiosVsSchemaDsl: ratios,
    tasks,
  }
}

function printTable(title, bench, tier1Override) {
  const tier1 = tier1Override ?? TIER1
  const results = bench.tasks
    .map(t => ({ name: t.name, hz: t.result?.hz ?? 0, p99: t.result?.p99 ?? 0, mean: t.result?.mean ?? 0 }))
    .sort((a, b) => b.hz - a.hz)

  const tier1Results = results.filter(r => tier1.includes(r.name))
  const tier2Results = results.filter(r => TIER2.includes(r.name))

  console.log(`\n${'-'.repeat(80)}`)
  console.log(`  ${title}`)
  console.log('-'.repeat(80))

  const header = `  ${'Library'.padEnd(26)}  ${'ops/sec'.padStart(18)}  ${'avg(us)'.padStart(10)}  ${'p99(us)'.padStart(10)}  vs fastest`
  console.log(header)
  console.log('-'.repeat(80))

  console.log('  [Tier 1 - JSON Schema Compliant Validators]')
  const tier1Fastest = tier1Results[0]?.hz ?? 1
  tier1Results.forEach((r, i) => {
    const ratio = tier1Fastest / r.hz
    const ratioStr = i === 0 ? 'baseline' : `${ratio.toFixed(2)}x slower`
    const mark = i === 0 ? '[1]' : i === 1 ? '[2]' : i === 2 ? '[3]' : '   '
    console.log(
      `  ${mark} ${r.name.padEnd(24)}  ${formatOps(r.hz).padStart(18)}  ` +
      `${toMicroseconds(r.mean || 0).toFixed(3).padStart(9)}  ` +
      `${toMicroseconds(r.p99 || 0).toFixed(3).padStart(9)}  ${ratioStr}`
    )
  })

  if (tier2Results.length) {
    console.log('\n  [Reference - Code-generation Engines (non-JSON Schema, different dimension)]')
    tier2Results.forEach(r => {
      const ratio = tier1Fastest / r.hz
      const ratioStr = r.hz > tier1Fastest
        ? `${(r.hz / tier1Fastest).toFixed(2)}x faster than tier1`
        : `${ratio.toFixed(2)}x slower than tier1`
      console.log(
        `  [*] ${r.name.padEnd(24)}  ${formatOps(r.hz).padStart(18)}  ` +
        `${toMicroseconds(r.mean || 0).toFixed(3).padStart(9)}  ` +
        `${toMicroseconds(r.p99 || 0).toFixed(3).padStart(9)}  ${ratioStr}`
      )
    })
  }
}

async function runBenchmark(title, configure, tier1Override, scenarioId, schemaDslTaskName) {
  const bench = new Bench(benchOptions)
  configure(bench)
  await bench.warmup()
  await bench.run()
  if (!isJsonOnly) printTable(title, bench, tier1Override)
  return collectBenchResult(scenarioId, title, bench, schemaDslTaskName)
}

async function runS1() {
  return runBenchmark(
    'S1: Simple Object Validation (valid data)',
    bench => bench
      .add('schema-dsl', () => validate(sdSimple, SIMPLE_VALID))
      .add('ajv (raw)', () => ajvSimpleValidate(SIMPLE_VALID))
      .add('zod', () => zodSimple.safeParse(SIMPLE_VALID))
      .add('joi', () => joiSimple.validate(SIMPLE_VALID))
      .add('fastest-validator', () => fvSimpleCheck(SIMPLE_VALID)),
    TIER1,
    'S1',
    'schema-dsl'
  )
}

async function runS2() {
  return runBenchmark(
    'S2: Invalid Data - fair comparison (no i18n formatting)',
    bench => bench
      .add('schema-dsl (no-fmt)', () => validate(sdSimple, SIMPLE_INVALID, { format: false }))
      .add('ajv (raw)', () => ajvSimpleValidate(SIMPLE_INVALID))
      .add('zod', () => zodSimple.safeParse(SIMPLE_INVALID))
      .add('joi', () => joiSimple.validate(SIMPLE_INVALID, { abortEarly: false }))
      .add('fastest-validator', () => fvSimpleCheck(SIMPLE_INVALID)),
    ['schema-dsl (no-fmt)', 'ajv (raw)', 'zod', 'joi'],
    'S2',
    'schema-dsl (no-fmt)'
  )
}

async function runS3() {
  return runBenchmark(
    'S3: Nested Object Validation (valid data)',
    bench => bench
      .add('schema-dsl', () => validate(sdNested, NESTED_VALID))
      .add('ajv (raw)', () => ajvNestedValidate(NESTED_VALID))
      .add('zod', () => zodNested.safeParse(NESTED_VALID))
      .add('joi', () => joiNested.validate(NESTED_VALID))
      .add('fastest-validator', () => fvNestedCheck(NESTED_VALID)),
    TIER1,
    'S3',
    'schema-dsl'
  )
}

function printSummary(scenarios) {
  const libs = ['schema-dsl', 'ajv (raw)', 'zod', 'joi', 'fastest-validator']
  const summaryColWidth = 20
  console.log(`\n${'='.repeat(80)}`)
  console.log('  Overall Summary (schema-dsl as baseline, cross-library comparison)')
  console.log('='.repeat(80))

  const hdr = `  ${'Scenario'.padEnd(18)}` + libs.map(l => l.padStart(summaryColWidth)).join('')
  console.log(hdr)
  console.log('-'.repeat(80))

  scenarios.forEach(scenario => {
    const hz = Object.fromEntries(scenario.tasks.map(task => [task.name, task.hz]))
    const sdName = scenario.schemaDslTaskName
    const sds = hz[sdName] || 1
    const row = `  ${scenario.id.padEnd(18)}` + libs.map(lib => {
      const actualLib = lib === 'schema-dsl' ? sdName : lib
      const v = hz[actualLib]
      if (!v) return 'N/A'.padStart(summaryColWidth)
      if (actualLib === sdName) return 'baseline'.padStart(summaryColWidth)
      const ratio = v / sds
      const label = ratio >= 1
        ? `x${ratio.toFixed(2)} faster`
        : `x${(sds / v).toFixed(2)} slower`
      return label.padStart(summaryColWidth)
    }).join('')
    console.log(row)
  })
  console.log()
}

function writeJsonReport(payload) {
  const target = outputPath ?? join(__dirname, '.tmp', `library-comparison-${payload.metadata.mode}-${Date.now()}.json`)
  payload.metadata.jsonReport = target
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  if (!isJsonOnly) console.log(`  JSON report: ${target}`)
  return target
}

if (!isJsonOnly) {
  console.log('\n+------------------------------------------------------------------------------+')
  console.log('|    schema-dsl Performance Benchmark (Tiered: JSON Schema vs Code-gen)       |')
  console.log('+------------------------------------------------------------------------------+')
  console.log(`\n  Node.js  : ${process.version}`)
  console.log(`  Platform : ${process.platform} / ${process.arch}`)
  console.log(`  Mode     : ${isSmoke ? 'smoke' : 'full'}`)
  console.log(`  Date     : ${new Date().toISOString()}`)
  console.log(`\n  Running, each scenario uses ${benchOptions.time}ms measurement.`)
  console.log('  avg(us)/p99(us) are converted from tinybench millisecond samples.')
  console.log('  S2 = fair comparison: no i18n formatting in any library.\n')
}

const metadata = createRunMetadata()
const scenarios = [await runS1(), await runS2(), await runS3()]
metadata.finishedAt = new Date().toISOString()

if (!isJsonOnly) {
  printSummary(scenarios)
  console.log('  fastest-validator is a code-generation engine, not a JSON Schema equivalent.')
  console.log('  schema-dsl overhead is measured against raw AJV for JSON Schema-layer attribution.')
  console.log('\n  Benchmark complete\n')
}

const payload = { metadata, scenarios }
if (shouldWriteJson) {
  writeJsonReport(payload)
}

if (isJsonOnly) {
  console.log(JSON.stringify(payload, null, 2))
}
