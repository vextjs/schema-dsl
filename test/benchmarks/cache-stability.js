/**
 * Cache stability probe for schema-dsl performance work.
 *
 * This is not a micro-benchmark ranking script. It records high-cardinality
 * schema behavior, repeated schema cache hit behavior, clearCache(), and
 * runtime dispose() lifecycle evidence.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { execSync } from 'node:child_process'
import { Validator } from '../../dist/index.js'
import { createRuntime } from '../../dist/runtime.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const args = process.argv.slice(2)
const isSmoke = args.includes('--smoke')
const shouldWriteJson = args.includes('--json') || args.includes('--json-only')
const isJsonOnly = args.includes('--json-only')
const outputPath = getArgValue('--output')
const uniqueCount = Number(getArgValue('--unique') ?? (isSmoke ? 200 : 1000))
const repeatedCount = Number(getArgValue('--repeated') ?? (isSmoke ? 1000 : 5000))
const runtimeCount = Number(getArgValue('--runtime') ?? (isSmoke ? 20 : 100))

function getArgValue(name) {
  const index = args.indexOf(name)
  if (index === -1) return null
  return args[index + 1] ?? null
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

function memorySnapshot() {
  const usage = process.memoryUsage()
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
  }
}

function timed(fn) {
  const startedAt = performance.now()
  const result = fn()
  const elapsedMs = performance.now() - startedAt
  return { elapsedMs, result }
}

function makeSchema(index) {
  return {
    type: 'object',
    properties: {
      value: { type: 'number', minimum: index },
      label: { type: 'string', minLength: 1 },
    },
    required: ['value', 'label'],
    additionalProperties: true,
  }
}

function runUniqueSchemas() {
  const validator = new Validator({ cache: { maxSize: 128 } })
  const beforeMemory = memorySnapshot()
  const { elapsedMs } = timed(() => {
    for (let index = 0; index < uniqueCount; index++) {
      const schema = makeSchema(index)
      const result = validator.validate(schema, { value: index, label: `item-${index}` })
      if (!result.valid) throw new Error(`unique schema validation failed at ${index}`)
    }
  })
  const afterStats = validator.getCacheStats()
  const afterMemory = memorySnapshot()
  validator.clearCache()
  const clearedStats = validator.getCacheStats()

  return {
    count: uniqueCount,
    elapsedMs,
    cacheStatsAfterRun: afterStats,
    cacheStatsAfterClear: clearedStats,
    memoryBefore: beforeMemory,
    memoryAfter: afterMemory,
  }
}

function runRepeatedSchema() {
  const validator = new Validator({ cache: { maxSize: 128 } })
  const schema = makeSchema(0)
  const data = { value: 10, label: 'stable' }
  validator.validate(schema, data)

  const beforeStats = validator.getCacheStats()
  const { elapsedMs } = timed(() => {
    for (let index = 0; index < repeatedCount; index++) {
      const result = validator.validate(schema, data)
      if (!result.valid) throw new Error(`repeated validation failed at ${index}`)
    }
  })
  const afterStats = validator.getCacheStats()
  validator.clearCache()

  return {
    count: repeatedCount,
    elapsedMs,
    cacheStatsBeforeRun: beforeStats,
    cacheStatsAfterRun: afterStats,
  }
}

function runRuntimeLifecycle() {
  const beforeMemory = memorySnapshot()
  const { elapsedMs } = timed(() => {
    for (let index = 0; index < runtimeCount; index++) {
      const runtime = createRuntime()
      const schema = runtime.compile({ value: 'number!', label: 'string!' })
      const result = runtime.validate(schema, { value: index, label: 'runtime' })
      if (!result.valid) throw new Error(`runtime validation failed at ${index}`)
      runtime.clearCache()
      runtime.dispose()
      if (!runtime.getStats().disposed) throw new Error(`runtime dispose failed at ${index}`)
    }
  })
  const afterMemory = memorySnapshot()

  return {
    count: runtimeCount,
    elapsedMs,
    memoryBefore: beforeMemory,
    memoryAfter: afterMemory,
  }
}

function createPayload() {
  const uniqueSchemas = runUniqueSchemas()
  const repeatedSchema = runRepeatedSchema()
  const runtimeLifecycle = runRuntimeLifecycle()
  return {
    metadata: {
      kind: 'schema-dsl-cache-stability',
      mode: isSmoke ? 'smoke' : 'full',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      gitSha: getGitSha(),
      createdAt: new Date().toISOString(),
      params: {
        uniqueCount,
        repeatedCount,
        runtimeCount,
      },
    },
    checks: {
      uniqueSchemas,
      repeatedSchema,
      runtimeLifecycle,
    },
  }
}

function writeJsonReport(payload) {
  const target = outputPath ?? join(__dirname, '.tmp', `cache-stability-${payload.metadata.mode}-${Date.now()}.json`)
  payload.metadata.jsonReport = target
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  if (!isJsonOnly) console.log(`JSON report: ${target}`)
  return target
}

function printSummary(payload) {
  console.log('\nCache stability probe')
  console.log('-'.repeat(80))
  console.log(`mode: ${payload.metadata.mode}`)
  console.log(`unique schemas: ${payload.checks.uniqueSchemas.count} in ${payload.checks.uniqueSchemas.elapsedMs.toFixed(1)}ms`)
  console.log(`cache after unique run: size=${payload.checks.uniqueSchemas.cacheStatsAfterRun.size}, max=${payload.checks.uniqueSchemas.cacheStatsAfterRun.maxSize}`)
  console.log(`cache after clear: size=${payload.checks.uniqueSchemas.cacheStatsAfterClear.size}`)
  console.log(`repeated schema: ${payload.checks.repeatedSchema.count} in ${payload.checks.repeatedSchema.elapsedMs.toFixed(1)}ms`)
  console.log(`runtime lifecycle: ${payload.checks.runtimeLifecycle.count} create/clear/dispose cycles in ${payload.checks.runtimeLifecycle.elapsedMs.toFixed(1)}ms`)
}

const payload = createPayload()
if (!isJsonOnly) printSummary(payload)
if (shouldWriteJson) {
  writeJsonReport(payload)
}
if (isJsonOnly) console.log(JSON.stringify(payload, null, 2))
