/**
 * schema-dsl 性能对比基准测试
 *
 * 运行方式: npm run bench  （或 node test/benchmarks/library-comparison.js）
 * 前置条件: npm run build（需要 dist/ 产物）
 *
 * ── 分层说明 ────────────────────────────────────────────────────────────────
 *
 * 【第一层：JSON Schema 验证器（同一维度）】
 *   schema-dsl  — 本项目，基于 AJV，提供 DSL 语法 + i18n + coerce + cache
 *   ajv (raw)   — AJV 直接使用（schema-dsl 的底层引擎），用于衡量 DSL 层开销
 *   Zod         — 流行的 TS-first schema 库，非 JSON Schema 但使用场景相同
 *   Joi         — 经典验证库，非 JSON Schema
 *
 * 【第二层：代码生成验证器（不同维度，仅供参考）】
 *   fastest-validator — 自研代码生成引擎，无 JSON Schema 合规性，极速但功能局限
 *     - 不支持 JSON Schema（$ref / anyOf / if-then-else 等）
 *     - 无 i18n 错误消息
 *     - email 验证为简单正则，非 RFC 标准
 *     - 对比意义：了解原生代码生成 vs JSON Schema 合规性的性能差距
 *
 * 测试场景：
 *   S1 - 简单对象（有效数据）
 *   S2 - 简单对象（无效数据 / 错误收集，均不做 i18n 格式化）
 *   S3 - 嵌套对象（有效数据）
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

// ── Raw AJV（直接使用，不经过 schema-dsl 层）────────────────────────────────
const rawAjv = new Ajv({ allErrors: true })
addFormats(rawAjv)

// ─────────────────────────────────────────────────────────────────
// 测试场景 S1 / S2：简单对象（用户登录表单）
// ─────────────────────────────────────────────────────────────────

const SIMPLE_VALID = {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
  tags: ['javascript', 'nodejs'],
}

const SIMPLE_INVALID = {
  username: 'jo',              // 太短（min:3）
  email: 'not-an-email',
  age: 15,                    // 小于 18
  tags: [],                   // min:1 items
}

// ─── schema-dsl（S1/S2）─────────────────────────────────────────────────────
const sdSimple = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120!',
  tags: 'array:1-10<string>',
})

// ─── Raw AJV（等价 JSON Schema，无 DSL 层开销）──────────────────────────────
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

// ─── fastest-validator（代码生成，仅供参考）──────────────────────────────────
const fvSimpleCheck = fv.compile({
  username: { type: 'string', min: 3, max: 32 },
  email: { type: 'email' },
  age: { type: 'number', min: 18, max: 120 },
  tags: { type: 'array', items: 'string', min: 1, max: 10 },
})

// ─────────────────────────────────────────────────────────────────
// 测试场景 S3：嵌套对象（JSON Schema 标准嵌套语法）
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

// schema-dsl: 标准嵌套语法
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

// Raw AJV nested（等价 JSON Schema）
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

// fastest-validator nested（代码生成，仅供参考）
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
// 辅助工具
// ─────────────────────────────────────────────────────────────────

function formatOps(hz) {
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(3)} M ops/s`
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(2)} K ops/s`
  return `${hz.toFixed(2)} ops/s`
}

// 同层库：JSON Schema 合规级别（含 AJV 底层、schema-dsl、Zod、Joi）
const TIER1 = ['schema-dsl', 'ajv (raw)', 'zod', 'joi']
// 参考库：代码生成级别（不同维度，仅供参考）
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

  // 第一层：同维度对比
  console.log('  【同维度对比 — JSON Schema 合规验证器】')
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
    console.log('\n  【参考对比 — 代码生成引擎（非 JSON Schema，不同维度）】')
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
// 场景 S1：简单对象（有效数据）
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
  printTable('S1：简单对象验证（有效数据）', bench)
  return bench
}

// ─────────────────────────────────────────────────────────────────────────────
// 场景 S2：无效数据 — 公平对比（schema-dsl 关闭 i18n 格式化，与其他库同等条件）
// 说明：默认 validate() 会做完整 i18n 模板渲染（这是附加价值），其他库仅返回原始错误。
//       S2 用 { format: false } 关闭格式化，才是真正的苹果对苹果比较。
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
  printTable('S2：无效数据 — 公平对比（均不做 i18n 格式化）', bench,
    ['schema-dsl (no-fmt)', 'ajv (raw)', 'zod', 'joi'])
  return bench
}

// ─────────────────────────────────────────────────────────────────────────────
// 场景 S3：嵌套对象（有效数据）
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
  printTable('S3：嵌套对象验证（有效数据）', bench)
  return bench
}

// ─────────────────────────────────────────────────────────────────────────────
// 综合汇总
// ─────────────────────────────────────────────────────────────────────────────

function printSummary(benchmarks) {
  const libs = ['schema-dsl', 'ajv (raw)', 'zod', 'joi', 'fastest-validator']
  console.log(`\n${'═'.repeat(80)}`)
  console.log('  📊 综合汇总（以 schema-dsl 为基准，横向对比各库）')
  console.log('═'.repeat(80))

  const hdr = `  ${'场景'.padEnd(18)}` + libs.map(l => l.padStart(16)).join('')
  console.log(hdr)
  console.log('─'.repeat(80))

  benchmarks.forEach(({ name, bench, sdKey }) => {
    if (!bench) return
    const hz = Object.fromEntries(bench.tasks.map(t => [t.name, t.result?.hz ?? 0]))
    // sdKey 用于 S2 等特殊命名的 schema-dsl 条目
    const sdName = sdKey ?? 'schema-dsl'
    const sds = hz[sdName] || 1
    const row = `  ${name.padEnd(18)}` + libs.map(lib => {
      // S2 中 schema-dsl 列映射到实际 task name
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
// 主入口
// ─────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗')
console.log('║    schema-dsl 性能基准测试（分层对比：JSON Schema 引擎 vs 代码生成引擎）    ║')
console.log('╚══════════════════════════════════════════════════════════════════════════════╝')
console.log(`\n  Node.js  : ${process.version}`)
console.log(`  Platform : ${process.platform} / ${process.arch}`)
console.log(`  Date     : ${new Date().toISOString()}`)
console.log('\n  ⏳ 运行中，每个场景预热 + 2 秒测量，请稍候...')
console.log('  ℹ️  ajv (raw) 是 schema-dsl 底层引擎，差值 = schema-dsl 自身层的开销')
console.log('  ⚠️  fastest-validator 使用代码生成（非 JSON Schema），仅供参考，不同维度')
console.log('  ℹ️  S2 = 公平对比：均无 i18n 格式化（schema-dsl 使用 { format: false }）\n')

const s1  = await runS1()
const s2  = await runS2()
const s3  = await runS3()

printSummary([
  { name: 'S1 简单(有效)',   bench: s1 },
  { name: 'S2 无效(no-fmt)', bench: s2, sdKey: 'schema-dsl (no-fmt)' },
  { name: 'S3 嵌套(有效)',   bench: s3 },
])

console.log('  ── fastest-validator 架构差异说明 ────────────────────────────────────────')
console.log('  fastest-validator 速度来源（代码生成引擎，与 JSON Schema 是不同技术路线）：')
console.log('  • compile() 时将 schema 编译为原生 JS 函数（if/typeof 直接操作，无解释层）')
console.log('  • 无 JSON Schema 标准合规（不支持 $ref / anyOf / if-then-else / format 规范）')
console.log('  • email 验证 = 简单 /@/ 正则，非 RFC 5322；AJV + ajv-formats 是完整实现')
console.log('  • 无 i18n 错误消息、无类型强制转换、无条件验证')
console.log('  • 代价：功能局限，无法用于 JSON Schema 标准场景')
console.log()
console.log('  ── schema-dsl DSL 层开销（相对 ajv raw）────────────────────────────────')
console.log('  schema-dsl 在 AJV 之上增加：DSL 解析 + i18n 错误格式化 + coerce + cache')
console.log('  overhead = schema-dsl 与 ajv (raw) 的差值，详见上方各场景数据')
console.log()
console.log('  ✅ 基准测试完成\n')
