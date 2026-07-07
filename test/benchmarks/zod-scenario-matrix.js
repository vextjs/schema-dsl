/**
 * Extended schema-dsl vs Zod scenario matrix.
 *
 * This benchmark fills gaps not covered by library-comparison.js:
 * formatted errors, coercion, union/enum, arrays, deep/large schemas,
 * conditionals, custom validators, async validators, and cold unique schemas.
 *
 * Prerequisites: npm run build
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { cpus } from 'node:os'
import { createRequire } from 'node:module'
import { Bench } from 'tinybench'
import { dsl, validate, validateAsync } from '../../dist/index.js'
import { z } from 'zod'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const args = process.argv.slice(2)
const isSmoke = args.includes('--smoke')
const shouldWriteJson = args.includes('--json') || args.includes('--json-only')
const isJsonOnly = args.includes('--json-only')
const outputPath = getArgValue('--output')
const benchOptions = isSmoke
  ? { time: 250, iterations: 25 }
  : { time: 1000, iterations: 80 }

function getArgValue(name) {
  const index = args.indexOf(name)
  if (index === -1) return null
  return args[index + 1] ?? null
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

function getGitDirtyStatus() {
  try {
    const lines = execSync('git status --short', { cwd: join(__dirname, '..', '..') })
      .toString()
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)

    return {
      dirty: lines.length > 0,
      changedFiles: lines.length,
      sample: lines.slice(0, 20),
    }
  } catch {
    return {
      dirty: null,
      changedFiles: null,
      sample: [],
    }
  }
}

function formatOps(hz) {
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(3)}M`
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(2)}K`
  return hz.toFixed(2)
}

function toMicroseconds(milliseconds) {
  return milliseconds * 1000
}

function collectTask(task) {
  const hz = task.result?.hz ?? 0
  const meanMs = task.result?.mean ?? 0
  const p99Ms = task.result?.p99 ?? 0
  return {
    name: task.name,
    hz,
    opsPerSecond: hz,
    meanMs,
    meanMicroseconds: toMicroseconds(meanMs),
    p99Ms,
    p99Microseconds: toMicroseconds(p99Ms),
    samples: task.result?.samples?.length ?? 0,
  }
}

function createResult(scenario, tasks) {
  const schemaDsl = tasks.find(task => task.name === 'schema-dsl')
  const zod = tasks.find(task => task.name === 'zod')
  const schemaDslHz = schemaDsl?.hz ?? 0
  const zodHz = zod?.hz ?? 0
  const schemaDslVsZod = zodHz > 0 ? schemaDslHz / zodHz : null
  const winner = schemaDslVsZod === null
    ? 'unknown'
    : schemaDslVsZod >= 1
      ? 'schema-dsl'
      : 'zod'

  return {
    id: scenario.id,
    category: scenario.category,
    title: scenario.title,
    comparable: scenario.comparable,
    notes: scenario.notes ?? [],
    tasks,
    schemaDslVsZod,
    winner,
  }
}

function printResult(result) {
  const schemaDsl = result.tasks.find(task => task.name === 'schema-dsl')
  const zodTask = result.tasks.find(task => task.name === 'zod')
  const ratio = result.schemaDslVsZod ?? 0
  const ratioLabel = ratio >= 1
    ? `schema-dsl ${ratio.toFixed(2)}x faster`
    : `Zod ${(1 / ratio).toFixed(2)}x faster`

  console.log(
    `  ${result.id.padEnd(14)} ${result.category.padEnd(14)} ` +
    `${formatOps(schemaDsl?.hz ?? 0).padStart(10)} ` +
    `${formatOps(zodTask?.hz ?? 0).padStart(10)} ` +
    `${ratioLabel.padStart(28)}`
  )
}

async function inferTaskValidity(task) {
  try {
    const output = await task()
    if (output && typeof output === 'object') {
      if ('valid' in output) return output.valid === true
      if ('success' in output) return output.success === true
      if (output instanceof Error) return false
    }
    return true
  } catch {
    return false
  }
}

async function assertScenarioCorrectness(scenario) {
  const schemaDslValid = await inferTaskValidity(scenario.schemaDsl)
  const zodValid = await inferTaskValidity(scenario.zod)

  if (schemaDslValid !== scenario.expectedValid || zodValid !== scenario.expectedValid) {
    throw new Error(
      `[${scenario.id}] correctness preflight failed: ` +
      `expected=${scenario.expectedValid}, schema-dsl=${schemaDslValid}, zod=${zodValid}`
    )
  }
}

async function runScenario(scenario) {
  const bench = new Bench(benchOptions)
  bench
    .add('schema-dsl', scenario.schemaDsl)
    .add('zod', scenario.zod)

  await bench.warmup()
  await bench.run()

  const tasks = bench.tasks.map(collectTask)
  const result = createResult(scenario, tasks)
  if (!isJsonOnly) printResult(result)
  return result
}

function createMetadata() {
  return {
    kind: 'schema-dsl-vs-zod-scenario-matrix',
    mode: isSmoke ? 'smoke' : 'full',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model ?? null,
    gitSha: getGitSha(),
    gitStatus: getGitDirtyStatus(),
    packageVersion: require('../../package.json').version,
    dependencies: {
      tinybench: getPackageVersion('tinybench'),
      zod: getPackageVersion('zod'),
    },
    benchOptions,
    startedAt: new Date().toISOString(),
  }
}

function writeJsonReport(payload) {
  const target = outputPath ?? join(__dirname, '.tmp', `zod-scenario-matrix-${payload.metadata.mode}-${Date.now()}.json`)
  payload.metadata.jsonReport = target
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  if (!isJsonOnly) console.log(`\n  JSON report: ${target}`)
  return target
}

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

const zodSimple = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  tags: z.array(z.string()).min(1).max(10),
})

const sdNumberCoerce = dsl({
  age: 'number:18-120!',
})
const zodNumberCoerce = z.object({
  age: z.coerce.number().min(18).max(120),
})
const zodNumberStrict = z.object({
  age: z.number().min(18).max(120),
})

const sdUnion = { anyOf: [{ type: 'string' }, { type: 'number' }] }
const zodUnion = z.union([z.string(), z.number()])
const sdEnum = dsl('enum:admin,user,guest')
const zodEnum = z.enum(['admin', 'user', 'guest'])

const array100 = Array.from({ length: 100 }, (_, index) => index)
const array100Invalid = [...array100]
array100Invalid[60] = 'bad'
const sdArray100 = dsl('array:100-100<number>')
const zodArray100 = z.array(z.number()).length(100)

const deepData = { a: { b: { c: { d: { e: 'value' } } } } }
const sdDeep = {
  type: 'object',
  properties: {
    a: {
      type: 'object',
      properties: {
        b: {
          type: 'object',
          properties: {
            c: {
              type: 'object',
              properties: {
                d: {
                  type: 'object',
                  properties: {
                    e: { type: 'string', minLength: 1 },
                  },
                  required: ['e'],
                },
              },
              required: ['d'],
            },
          },
          required: ['c'],
        },
      },
      required: ['b'],
    },
  },
  required: ['a'],
}
const zodDeep = z.object({
  a: z.object({
    b: z.object({
      c: z.object({
        d: z.object({
          e: z.string().min(1),
        }),
      }),
    }),
  }),
})

const largeShape = {}
const largeSchemaProperties = {}
const largeRequired = []
const largeData = {}
for (let index = 0; index < 50; index += 1) {
  const key = `field${index}`
  largeShape[key] = z.number().min(0).max(1000)
  largeSchemaProperties[key] = { type: 'number', minimum: 0, maximum: 1000 }
  largeRequired.push(key)
  largeData[key] = index
}
const sdLargeObject = {
  type: 'object',
  properties: largeSchemaProperties,
  required: largeRequired,
}
const zodLargeObject = z.object(largeShape)

const sdConditional = dsl({
  userType: 'string!',
  email: dsl.if(data => data.userType === 'admin').then('email!').else('email'),
})
const zodConditional = z.object({
  userType: z.string(),
  email: z.string(),
}).superRefine((value, ctx) => {
  if (value.userType === 'admin' && !z.string().email().safeParse(value.email).success) {
    ctx.addIssue({
      code: 'custom',
      path: ['email'],
      message: 'Invalid email',
    })
  }
})
const conditionalValid = { userType: 'admin', email: 'admin@example.com' }
const conditionalInvalid = { userType: 'admin', email: 'bad' }

const syncCustomFn = value => value !== 'admin' || 'reserved'
const sdSyncCustom = { type: 'string', _customValidators: [syncCustomFn] }
const zodSyncCustom = z.string().refine(value => value !== 'admin', { message: 'reserved' })

const asyncCustomFn = async value => value !== 'admin' || 'reserved'
const sdAsyncCustom = { type: 'string', _customValidators: [asyncCustomFn] }
const zodAsyncCustom = z.string().refine(async value => value !== 'admin', { message: 'reserved' })

let coldCounterSchemaDsl = 0
let coldCounterZod = 0
const coldBase = {
  username: 'john_doe',
}

const scenarios = [
  {
    id: 'S1',
    category: 'valid',
    title: 'Simple object valid hot path',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdSimple, SIMPLE_VALID),
    zod: () => zodSimple.safeParse(SIMPLE_VALID),
  },
  {
    id: 'S2',
    category: 'invalid',
    title: 'Simple object invalid, structured/no-format',
    comparable: 'direct',
    expectedValid: false,
    schemaDsl: () => validate(sdSimple, SIMPLE_INVALID, { format: false }),
    zod: () => zodSimple.safeParse(SIMPLE_INVALID),
  },
  {
    id: 'S3',
    category: 'format',
    title: 'Simple object invalid, formatted errors',
    comparable: 'approximate',
    expectedValid: false,
    notes: ['schema-dsl formats ValidationErrorItem; Zod safeParse builds ZodError then flatten() is called.'],
    schemaDsl: () => validate(sdSimple, SIMPLE_INVALID, { format: true, locale: 'zh-CN' }),
    zod: () => {
      const result = zodSimple.safeParse(SIMPLE_INVALID)
      if (!result.success) result.error.flatten()
      return result
    },
  },
  {
    id: 'C1',
    category: 'coerce',
    title: 'Number coercion valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdNumberCoerce, { age: '42' }),
    zod: () => zodNumberCoerce.safeParse({ age: '42' }),
  },
  {
    id: 'C2',
    category: 'coerce-off',
    title: 'Number strict invalid with coercion disabled',
    comparable: 'direct',
    expectedValid: false,
    schemaDsl: () => validate(sdNumberCoerce, { age: '42' }, { coerce: false, format: false }),
    zod: () => zodNumberStrict.safeParse({ age: '42' }),
  },
  {
    id: 'U1',
    category: 'union',
    title: 'Union string valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdUnion, 'hello'),
    zod: () => zodUnion.safeParse('hello'),
  },
  {
    id: 'U2',
    category: 'union',
    title: 'Union number valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdUnion, 42),
    zod: () => zodUnion.safeParse(42),
  },
  {
    id: 'E1',
    category: 'enum',
    title: 'Enum valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdEnum, 'admin'),
    zod: () => zodEnum.safeParse('admin'),
  },
  {
    id: 'A1',
    category: 'array',
    title: 'Array 100 numbers valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdArray100, array100),
    zod: () => zodArray100.safeParse(array100),
  },
  {
    id: 'A2',
    category: 'array',
    title: 'Array 100 numbers invalid',
    comparable: 'direct',
    expectedValid: false,
    schemaDsl: () => validate(sdArray100, array100Invalid, { format: false }),
    zod: () => zodArray100.safeParse(array100Invalid),
  },
  {
    id: 'D1',
    category: 'deep',
    title: 'Deep object valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdDeep, deepData),
    zod: () => zodDeep.safeParse(deepData),
  },
  {
    id: 'L1',
    category: 'large-object',
    title: 'Large object 50 numeric fields valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdLargeObject, largeData),
    zod: () => zodLargeObject.safeParse(largeData),
  },
  {
    id: 'COND1',
    category: 'conditional',
    title: 'Conditional valid',
    comparable: 'approximate',
    expectedValid: true,
    notes: ['schema-dsl uses ConditionalBuilder; Zod uses superRefine.'],
    schemaDsl: () => validate(sdConditional, conditionalValid),
    zod: () => zodConditional.safeParse(conditionalValid),
  },
  {
    id: 'COND2',
    category: 'conditional',
    title: 'Conditional invalid',
    comparable: 'approximate',
    expectedValid: false,
    notes: ['schema-dsl uses ConditionalBuilder; Zod uses superRefine.'],
    schemaDsl: () => validate(sdConditional, conditionalInvalid, { format: false }),
    zod: () => zodConditional.safeParse(conditionalInvalid),
  },
  {
    id: 'CV1',
    category: 'custom',
    title: 'Sync custom validator valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: () => validate(sdSyncCustom, 'alice'),
    zod: () => zodSyncCustom.safeParse('alice'),
  },
  {
    id: 'CV2',
    category: 'custom',
    title: 'Sync custom validator invalid',
    comparable: 'direct',
    expectedValid: false,
    schemaDsl: () => validate(sdSyncCustom, 'admin', { format: false }),
    zod: () => zodSyncCustom.safeParse('admin'),
  },
  {
    id: 'AV1',
    category: 'async',
    title: 'Async custom validator valid',
    comparable: 'direct',
    expectedValid: true,
    schemaDsl: async () => validateAsync(sdAsyncCustom, 'alice'),
    zod: async () => zodAsyncCustom.safeParseAsync('alice'),
  },
  {
    id: 'AV2',
    category: 'async',
    title: 'Async custom validator invalid',
    comparable: 'direct',
    expectedValid: false,
    schemaDsl: async () => {
      try {
        await validateAsync(sdAsyncCustom, 'admin')
        return true
      } catch (error) {
        return error
      }
    },
    zod: async () => zodAsyncCustom.safeParseAsync('admin'),
  },
  {
    id: 'AV2_THROW',
    category: 'async',
    title: 'Async custom validator invalid, throw path',
    comparable: 'diagnostic',
    expectedValid: false,
    notes: ['Diagnostic only: both tasks catch thrown validation errors; excluded from main win/loss summary.'],
    schemaDsl: async () => {
      try {
        await validateAsync(sdAsyncCustom, 'admin')
        return true
      } catch (error) {
        return error
      }
    },
    zod: async () => {
      try {
        await zodAsyncCustom.parseAsync('admin')
        return true
      } catch (error) {
        return error
      }
    },
  },
  {
    id: 'COLD1',
    category: 'cold',
    title: 'Cold unique schema construction + validate',
    comparable: 'approximate',
    expectedValid: true,
    notes: ['Both tasks allocate a new unique schema and validate once per iteration.'],
    schemaDsl: () => {
      const marker = `m${coldCounterSchemaDsl++}`
      const schema = dsl({
        username: 'string:3-32!',
        marker: { type: 'string', const: marker },
      })
      return validate(schema, { ...coldBase, marker })
    },
    zod: () => {
      const marker = `m${coldCounterZod++}`
      const schema = z.object({
        username: z.string().min(3).max(32),
        marker: z.literal(marker),
      })
      return schema.safeParse({ ...coldBase, marker })
    },
  },
]

if (!isJsonOnly) {
  console.log('\nExtended schema-dsl vs Zod Scenario Matrix')
  console.log('='.repeat(88))
  console.log(`Node.js  : ${process.version}`)
  console.log(`Platform : ${process.platform} / ${process.arch}`)
  console.log(`Mode     : ${isSmoke ? 'smoke' : 'full'}`)
  console.log(`Window   : ${benchOptions.time}ms per scenario`)
  console.log('-'.repeat(88))
  console.log(`  ${'ID'.padEnd(14)} ${'Category'.padEnd(14)} ${'schema-dsl'.padStart(10)} ${'Zod'.padStart(10)} ${'Winner'.padStart(28)}`)
  console.log('-'.repeat(88))
}

const metadata = createMetadata()
const results = []
for (const scenario of scenarios) {
  await assertScenarioCorrectness(scenario)
  results.push(await runScenario(scenario))
}
metadata.finishedAt = new Date().toISOString()

const summary = {
  total: results.filter(result => result.comparable !== 'diagnostic').length,
  schemaDslWins: results.filter(result => result.comparable !== 'diagnostic' && result.winner === 'schema-dsl').length,
  zodWins: results.filter(result => result.comparable !== 'diagnostic' && result.winner === 'zod').length,
  diagnosticComparisons: results.filter(result => result.comparable === 'diagnostic').length,
  approximateComparisons: results.filter(result => result.comparable === 'approximate').length,
  directComparisons: results.filter(result => result.comparable === 'direct').length,
}

if (!isJsonOnly) {
  console.log('-'.repeat(88))
  console.log(`  schema-dsl wins: ${summary.schemaDslWins}/${summary.total}`)
  console.log(`  Zod wins       : ${summary.zodWins}/${summary.total}`)
  console.log('  Note: approximate comparisons have semantic differences documented in JSON notes.')
}

const payload = { metadata, summary, scenarios: results }
if (shouldWriteJson) writeJsonReport(payload)
if (isJsonOnly) console.log(JSON.stringify(payload, null, 2))
