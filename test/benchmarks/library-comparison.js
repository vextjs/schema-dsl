/**
 * schema-dsl Performance Benchmark Comparison
 *
 * Run: npm run bench  (or node test/benchmarks/library-comparison.js)
 * Prerequisites: npm run build (requires dist/ output)
 *
 * ── Tier Description ────────────────────────────────────────────────────────
 *
 * [Tier 1: JSON Schema validators (same dimension)]
 *   schema-dsl  — this project, built on AJV, providing DSL syntax + i18n + coerce + cache
 *   ajv (raw)   — AJV used directly (the underlying engine of schema-dsl), measures DSL layer overhead
 *   Zod         — popular TS-first schema library, not JSON Schema but same use case
 *   Joi         — classic validation library, not JSON Schema
 *
 * [Tier 2: code-generation validators (different dimension, for reference only)]
 *   fastest-validator — custom code-generation engine, no JSON Schema compliance, fast but limited
 *     - no JSON Schema support ($ref / anyOf / if-then-else etc.)
 *     - no i18n error messages
 *     - email validation is a simple regex, not RFC-compliant
 *     - comparison purpose: understand the performance gap between native code-gen vs JSON Schema compliance
 *
 * Test scenarios:
 *   S1 - simple object (valid data)
 *   S2 - simple object (invalid data / error collection, no i18n formatting)
 *   S3 - nested object (valid data)
 */

import { createRequire } from 'node:module'
import { Bench } from 'tinybench'
import { dsl, validate } from '../../dist/index.js'
import { z } from 'zod'
import Joi from 'joi'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const require = createRequire(import.meta.url)
const FastestValidator = require('fastest-validator')
const fv = new FastestValidator()

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
  username: 'jo',              // too short (min:3)
  email: 'not-an-email',
  age: 15,                    // below 18
  tags: [],                   // min:1 items
}

// ─── schema-dsl (S1/S2) ─────────────────────────────────────────────────────
const sdSimple = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120!',
  tags: 'array:1-10<string>',
})

// ─── Raw AJV (equivalent JSON Schema, no DSL layer overhead) ────────────────
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

// ─── Zod ─────────────────────────────────────────────────────────────────────
const zodSimple = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  tags: z.array(z.string()).min(1).max(10),
})

// ─── Joi ─────────────────────────────────────────────────────────────────────
const joiSimple = Joi.object({
  username: Joi.string().min(3).max(32).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  age: Joi.number().min(18).max(120).required(),
  tags: Joi.array().items(Joi.string()).min(1).max(10).required(),
})

// ─── fastest-validator (code generation, for reference only) ────────────────
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

// schema-dsl: standard nesting syntax
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

// Raw AJV nested (equivalent JSON Schema)
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

// Zod nested
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

// Joi nested
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

// fastest-validator nested (code generation, for reference only)
const fvNestedCheck = fv.compile({
  username: { type: 'string', min: 3, max: 32 },
  email: { type: 'email' },
  age: { type: 'number', min: 18, max: 120 },
  address: {
    type: 'object', props: {
      street: { type: 'string' },
      city: { type: 'string' },
      zipCode: { type: 'string', length: 6 },
    },
  },
  tags: { type: 'array', items: 'string', min: 1, max: 10 },
})

// ─────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────

function formatOps(hz) {
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(3)} M ops/s`
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(2)} K ops/s`
  return `${hz.toFixed(2)} ops/s`
}

// Tier 1: JSON Schema compliance level (includes raw AJV, schema-dsl, Zod, Joi)
const TIER1 = ['schema-dsl', 'ajv (raw)', 'zod', 'joi']
// Reference: code-generation level (different dimension, for reference only)
const TIER2 = ['fastest-validator']

function printTable(title, bench, tier1Override) {
  const tier1 = tier1Override ?? TIER1
  const byName = Object.fromEntries(bench.tasks.map(t => [t.name, t]))
  const results = bench.tasks
    .map(t => ({ name: t.name, hz: t.result?.hz ?? 0, p99: t.result?.p99 ?? 0, mean: t.result?.mean ?? 0 }))
    .sort((a, b) => b.hz - a.hz)

  const tier1Results = results.filter(r => tier1.includes(r.name))
  const tier2Results = results.filter(r => TIER2.includes(r.name))

  console.log(`\n${'─'.repeat(80)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(80))

  const header = `  ${'Library'.padEnd(26)}  ${'ops/sec'.padStart(18)}  ${'avg(μs)'.padStart(10)}  ${'p99(μs)'.padStart(10)}  vs fastest`
  console.log(header)
  console.log('─'.repeat(80))

  // Tier 1: same-dimension comparison
  console.log('  [Tier 1 — JSON Schema Compliant Validators]')
  const tier1Fastest = tier1Results[0]?.hz ?? 1
  tier1Results.forEach((r, i) => {
    const ratio = tier1Fastest / r.hz
    const ratioStr = i === 0 ? '⚡ baseline' : `${ratio.toFixed(2)}x slower`
    const mark = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '
    console.log(
      `  ${mark} ${r.name.padEnd(24)}  ${formatOps(r.hz).padStart(18)}  ` +
      `${((r.mean || 0) * 1e6).toFixed(1).padStart(9)}  ` +
      `${((r.p99 || 0) * 1e6).toFixed(1).padStart(9)}  ${ratioStr}`
    )
  })

  if (tier2Results.length) {
    console.log('\n  [Reference — Code-generation Engines (non-JSON Schema, different dimension)]')
    tier2Results.forEach(r => {
      const ratio = tier1Fastest / r.hz
      const ratioStr = r.hz > tier1Fastest
        ? `${(r.hz / tier1Fastest).toFixed(2)}x faster than tier1`
        : `${ratio.toFixed(2)}x slower than tier1`
      console.log(
        `  ⚡ ${r.name.padEnd(24)}  ${formatOps(r.hz).padStart(18)}  ` +
        `${((r.mean || 0) * 1e6).toFixed(1).padStart(9)}  ` +
        `${((r.p99 || 0) * 1e6).toFixed(1).padStart(9)}  ${ratioStr}`
      )
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario S1: Simple Object (valid data)
// ─────────────────────────────────────────────────────────────────────────────

async function runS1() {
  const bench = new Bench({ time: 2000, iterations: 100 })
  bench
    .add('schema-dsl',        () => validate(sdSimple, SIMPLE_VALID))
    .add('ajv (raw)',         () => ajvSimpleValidate(SIMPLE_VALID))
    .add('zod',               () => zodSimple.safeParse(SIMPLE_VALID))
    .add('joi',               () => joiSimple.validate(SIMPLE_VALID))
    .add('fastest-validator', () => fvSimpleCheck(SIMPLE_VALID))
  await bench.warmup()
  await bench.run()
  printTable('S1: Simple Object Validation (valid data)', bench)
  return bench
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario S2: Invalid Data — fair comparison (schema-dsl disables i18n formatting, same conditions as other libraries)
// Note: the default validate() does full i18n template rendering (an added-value feature); other libraries return raw errors.
//       S2 uses { format: false } to disable formatting for a true apples-to-apples comparison.
// ─────────────────────────────────────────────────────────────────────────────

async function runS2() {
  const bench = new Bench({ time: 2000, iterations: 100 })
  bench
    .add('schema-dsl (no-fmt)', () => validate(sdSimple, SIMPLE_INVALID, { format: false }))
    .add('ajv (raw)',            () => ajvSimpleValidate(SIMPLE_INVALID))
    .add('zod',                  () => zodSimple.safeParse(SIMPLE_INVALID))
    .add('joi',                  () => joiSimple.validate(SIMPLE_INVALID, { abortEarly: false }))
    .add('fastest-validator',    () => fvSimpleCheck(SIMPLE_INVALID))
  await bench.warmup()
  await bench.run()
  printTable('S2: Invalid Data — fair comparison (no i18n formatting)', bench,
    ['schema-dsl (no-fmt)', 'ajv (raw)', 'zod', 'joi'])
  return bench
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario S3: Nested Object (valid data)
// ─────────────────────────────────────────────────────────────────────────────

async function runS3() {
  const bench = new Bench({ time: 2000, iterations: 100 })
  bench
    .add('schema-dsl',        () => validate(sdNested, NESTED_VALID))
    .add('ajv (raw)',         () => ajvNestedValidate(NESTED_VALID))
    .add('zod',               () => zodNested.safeParse(NESTED_VALID))
    .add('joi',               () => joiNested.validate(NESTED_VALID))
    .add('fastest-validator', () => fvNestedCheck(NESTED_VALID))
  await bench.warmup()
  await bench.run()
  printTable('S3: Nested Object Validation (valid data)', bench)
  return bench
}

// ─────────────────────────────────────────────────────────────────────────────
// Overall Summary
// ─────────────────────────────────────────────────────────────────────────────

function printSummary(benchmarks) {
  const libs = ['schema-dsl', 'ajv (raw)', 'zod', 'joi', 'fastest-validator']
  console.log(`\n${'═'.repeat(80)}`)
  console.log('  📊 Overall Summary (schema-dsl as baseline, cross-library comparison)')
  console.log('═'.repeat(80))

  const hdr = `  ${'Scenario'.padEnd(18)}` + libs.map(l => l.padStart(16)).join('')
  console.log(hdr)
  console.log('─'.repeat(80))

  benchmarks.forEach(({ name, bench, sdKey }) => {
    if (!bench) return
    const hz = Object.fromEntries(bench.tasks.map(t => [t.name, t.result?.hz ?? 0]))
    // sdKey is used for specially named schema-dsl entries like S2
    const sdName = sdKey ?? 'schema-dsl'
    const sds = hz[sdName] || 1
    const row = `  ${name.padEnd(18)}` + libs.map(lib => {
      // For S2, map the schema-dsl column to the actual task name
      const actualLib = lib === 'schema-dsl' ? sdName : lib
      const v = hz[actualLib]
      if (!v) return '           N/A'.padStart(16)
      if (actualLib === sdName) return '    baseline'.padStart(16)
      const ratio = v / sds
      const label = ratio >= 1
        ? `×${ratio.toFixed(2)} faster`
        : `×${(sds / v).toFixed(2)} slower`
      return label.padStart(16)
    }).join('')
    console.log(row)
  })
  console.log()
}

// ─────────────────────────────────────────────────────────────────
// Main Entry
// ─────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗')
console.log('║    schema-dsl Performance Benchmark (Tiered: JSON Schema vs Code-gen)       ║')
console.log('╚══════════════════════════════════════════════════════════════════════════════╝')
console.log(`\n  Node.js  : ${process.version}`)
console.log(`  Platform : ${process.platform} / ${process.arch}`)
console.log(`  Date     : ${new Date().toISOString()}`)
console.log('\n  ⏳ Running, each scenario takes warmup + 2 s measurement, please wait...')
console.log('  ℹ️  ajv (raw) is the underlying engine of schema-dsl; the gap = schema-dsl layer overhead')
console.log('  ⚠️  fastest-validator uses code generation (not JSON Schema), for reference only, different dimension')
console.log('  ℹ️  S2 = fair comparison: no i18n formatting in any library (schema-dsl uses { format: false })\n')

const s1  = await runS1()
const s2  = await runS2()
const s3  = await runS3()

printSummary([
  { name: 'S1 simple(valid)',   bench: s1 },
  { name: 'S2 invalid(no-fmt)', bench: s2, sdKey: 'schema-dsl (no-fmt)' },
  { name: 'S3 nested(valid)',   bench: s3 },
])

console.log('  ── fastest-validator architecture difference ──────────────────────────────')
console.log('  fastest-validator speed source (code-generation engine, a different technical approach from JSON Schema):')
console.log('  • compile() compiles the schema into a native JS function (direct if/typeof operations, no interpretation layer)')
console.log('  • no JSON Schema standard compliance (no $ref / anyOf / if-then-else / format spec support)')
console.log('  • email validation = simple /@/ regex, not RFC 5322; AJV + ajv-formats is a full implementation')
console.log('  • no i18n error messages, no type coercion, no conditional validation')
console.log('  • trade-off: limited functionality, cannot be used in JSON Schema standard scenarios')
console.log()
console.log('  ── schema-dsl DSL layer overhead (relative to ajv raw) ──────────────────')
console.log('  schema-dsl adds on top of AJV: DSL parsing + i18n error formatting + coerce + cache')
console.log('  overhead = the difference between schema-dsl and ajv (raw); see per-scenario data above')
console.log()
console.log('  ✅ Benchmark complete\n')
