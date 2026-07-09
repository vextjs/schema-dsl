/**
 * Targeted Conditional validation regression benchmark.
 *
 * This script records schema-dsl Conditional hot-path throughput without
 * comparing against other libraries. It expects built dist output:
 *   npm run build
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { cpus } from 'node:os'
import { createRequire } from 'node:module'
import { Bench } from 'tinybench'
import { ConditionalBuilder, dsl, validate } from '../../dist/index.js'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..', '..')

const args = process.argv.slice(2)
const isSmoke = args.includes('--smoke')
const shouldWriteJson = args.includes('--json') || args.includes('--json-only')
const isJsonOnly = args.includes('--json-only')
const outputPath = getArgValue('--output')
const baselinePath = getArgValue('--baseline')
const minRatioValue = getArgValue('--min-ratio')
const minRatio = minRatioValue === null ? null : Number(minRatioValue)
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
    return execSync('git rev-parse --short HEAD', { cwd: repoRoot })
      .toString()
      .trim()
  } catch {
    return null
  }
}

function getGitDirtyStatus() {
  try {
    const lines = execSync('git status --short', { cwd: repoRoot })
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

function createResult(scenario, task) {
  return {
    id: scenario.id,
    category: scenario.category,
    title: scenario.title,
    expectedValid: scenario.expectedValid,
    notes: scenario.notes ?? [],
    task,
    opsPerSecond: task.opsPerSecond,
  }
}

function printResult(result) {
  console.log(
    `  ${result.id.padEnd(8)} ${result.category.padEnd(14)} ` +
    `${formatOps(result.opsPerSecond).padStart(10)} ` +
    `${result.title}`
  )
}

function inferValidity(output) {
  if (output && typeof output === 'object' && 'valid' in output) {
    return output.valid === true
  }
  return Boolean(output)
}

function assertScenarioCorrectness(scenario) {
  const isValid = inferValidity(scenario.run())
  if (isValid !== scenario.expectedValid) {
    throw new Error(
      `[${scenario.id}] correctness preflight failed: ` +
      `expected=${scenario.expectedValid}, actual=${isValid}`
    )
  }
}

async function runScenario(scenario) {
  assertScenarioCorrectness(scenario)

  const bench = new Bench(benchOptions)
  bench.add('schema-dsl', scenario.run)

  await bench.warmup()
  await bench.run()

  const result = createResult(scenario, collectTask(bench.tasks[0]))
  if (!isJsonOnly) printResult(result)
  return result
}

function createMetadata() {
  return {
    kind: 'schema-dsl-conditional-regression',
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
    },
    benchOptions,
    baselinePath,
    minRatio,
    startedAt: new Date().toISOString(),
  }
}

function writeJsonReport(payload) {
  const target = outputPath ?? join(__dirname, '.tmp', `conditional-regression-${payload.metadata.mode}-${Date.now()}.json`)
  payload.metadata.jsonReport = target
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  if (!isJsonOnly) console.log(`\n  JSON report: ${target}`)
  return target
}

function loadBaseline() {
  if (!baselinePath) return null
  return JSON.parse(readFileSync(baselinePath, 'utf8'))
}

function compareWithBaseline(results) {
  const baseline = loadBaseline()
  if (!baseline) return []

  const baselineById = new Map(
    (baseline.scenarios ?? []).map(result => [result.id, result])
  )

  return results
    .map(result => {
      const previous = baselineById.get(result.id)
      const baselineOps = previous?.opsPerSecond ?? previous?.task?.opsPerSecond ?? null
      const ratio = baselineOps && baselineOps > 0 ? result.opsPerSecond / baselineOps : null
      return {
        id: result.id,
        currentOpsPerSecond: result.opsPerSecond,
        baselineOpsPerSecond: baselineOps,
        ratio,
        pass: minRatio === null || ratio === null || ratio >= minRatio,
      }
    })
}

function printComparisons(comparisons) {
  if (comparisons.length === 0 || isJsonOnly) return

  console.log('\nBaseline comparison:')
  for (const item of comparisons) {
    const ratioLabel = item.ratio === null ? 'n/a' : item.ratio.toFixed(3)
    console.log(`  ${item.id.padEnd(8)} ratio=${ratioLabel} ${item.pass ? 'PASS' : 'FAIL'}`)
  }
}

const sdConditional = dsl({
  userType: 'string!',
  email: dsl.if(data => data.userType === 'admin').then('email!').else('email'),
})

const conditionalValid = { userType: 'admin', email: 'admin@example.com' }
const conditionalInvalid = { userType: 'admin', email: 'bad' }

const nestedConditional = {
  type: 'object',
  properties: {
    profile: {
      type: 'object',
      properties: {
        score: ConditionalBuilder.start(() => true).then('number!').toSchema(),
      },
    },
  },
}

const nestedInvalid = { profile: { score: 'bad' } }

const scenarios = [
  {
    id: 'COND1',
    category: 'conditional',
    title: 'Conditional valid',
    expectedValid: true,
    run: () => validate(sdConditional, conditionalValid),
  },
  {
    id: 'COND2',
    category: 'conditional',
    title: 'Conditional invalid no-format',
    expectedValid: false,
    run: () => validate(sdConditional, conditionalInvalid, { format: false }),
  },
  {
    id: 'COND3',
    category: 'conditional',
    title: 'Nested applicator conditional invalid',
    expectedValid: false,
    notes: ['Covers nested object traversal instead of only a top-level property.'],
    run: () => validate(nestedConditional, nestedInvalid, { format: false }),
  },
]

async function main() {
  if (!isJsonOnly) {
    console.log('schema-dsl Conditional regression benchmark')
    console.log(`  Mode: ${isSmoke ? 'smoke' : 'full'}`)
    console.log(`  Node: ${process.version}`)
    console.log('\nResults:')
  }

  const results = []
  for (const scenario of scenarios) {
    results.push(await runScenario(scenario))
  }

  const comparisons = compareWithBaseline(results)
  printComparisons(comparisons)

  const payload = {
    metadata: createMetadata(),
    scenarios: results,
    comparisons,
  }

  if (shouldWriteJson) {
    writeJsonReport(payload)
  }

  const failed = comparisons.filter(item => !item.pass)
  if (failed.length > 0) {
    throw new Error(
      `Conditional benchmark regression: ${failed.map(item => item.id).join(', ')} ` +
      `below min ratio ${minRatio}`
    )
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
