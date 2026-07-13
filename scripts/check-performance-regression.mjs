import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { cpus, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluatePerformanceScenario } from './performance-regression-policy.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const mode = args.includes('--full') ? 'full' : 'smoke'
const updateBaseline = args.includes('--update-baseline')
const baselinePath = join(repoRoot, 'test', 'benchmarks', 'performance-baseline.json')
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
const scenarioIds = ['S1', 'S2', 'S3', 'U1', 'U2', 'E1', 'D1', 'L1']
const samples = new Map(scenarioIds.map(id => [id, []]))
const relativeSamples = new Map(scenarioIds.map(id => [id, []]))
const tempRoot = mkdtempSync(join(tmpdir(), 'schema-dsl-performance-guard-'))
const cpu = cpus()[0]?.model.replace(/\s+/g, ' ').trim() ?? 'unknown'

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

try {
  for (let run = 0; run < baseline.runs; run++) {
    const output = join(tempRoot, `${mode}-${run}.json`)
    try {
      execFileSync('node', [
        'test/benchmarks/zod-scenario-matrix.js',
        ...(mode === 'smoke' ? ['--smoke'] : []),
        '--json-only',
        '--output', output,
      ], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      const stdout = error && typeof error === 'object' && 'stdout' in error
        ? String(error.stdout ?? '').trim()
        : ''
      const stderr = error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr ?? '').trim()
        : ''
      const diagnostics = [stdout, stderr].filter(Boolean).join('\n')
      throw new Error(
        `Performance benchmark ${mode} run ${run + 1}/${baseline.runs} failed` +
        (diagnostics ? `:\n${diagnostics}` : ''),
        { cause: error },
      )
    }

    const payload = JSON.parse(readFileSync(output, 'utf8'))
    for (const id of scenarioIds) {
      const scenario = payload.scenarios.find(item => item.id === id)
      const task = scenario?.tasks.find(item => item.name === 'schema-dsl')
      const comparisonTask = scenario?.tasks.find(item => item.name === 'zod')
      if (!task?.opsPerSecond) throw new Error(`Benchmark ${id} did not produce schema-dsl throughput`)
      if (!comparisonTask?.opsPerSecond) throw new Error(`Benchmark ${id} did not produce zod throughput`)
      samples.get(id).push(task.opsPerSecond)
      relativeSamples.get(id).push(task.opsPerSecond / comparisonTask.opsPerSecond)
    }
  }

  const medians = Object.fromEntries(scenarioIds.map(id => [id, median(samples.get(id))]))
  const relativeMedians = Object.fromEntries(scenarioIds.map(id => [id, median(relativeSamples.get(id))]))
  if (updateBaseline) {
    baseline.profiles[mode] = {
      generatedAt: new Date().toISOString(),
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      cpu,
      scenarios: medians,
      relativeToZod: relativeMedians,
    }
    writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
    console.log(`[schema-dsl] updated ${mode} performance baseline`)
    console.log(JSON.stringify({ scenarios: medians, relativeToZod: relativeMedians }, null, 2))
  } else {
    const profile = baseline.profiles[mode]
    if (!profile?.scenarios || !profile?.relativeToZod) {
      throw new Error(`Missing approved ${mode} absolute or relative performance baseline`)
    }
    const sameEnvironment = profile.node === process.version
      && profile.platform === `${process.platform}-${process.arch}`
      && profile.cpu === cpu

    const comparisons = scenarioIds.map(id => {
      const expected = profile.scenarios[id]
      const current = medians[id]
      const expectedRelative = profile.relativeToZod[id]
      const currentRelative = relativeMedians[id]
      const evaluation = evaluatePerformanceScenario({
        current,
        expected,
        currentRelative,
        expectedRelative,
        minRatio: baseline.minRatio,
        sameEnvironment,
      })
      return { id, current, expected, currentRelative, expectedRelative, ...evaluation }
    })

    console.log(`[schema-dsl] ${sameEnvironment ? 'same-environment absolute + relative + comparison calibration' : 'cross-environment relative'} gate`)
    for (const item of comparisons) {
      console.log(
        `${item.id.padEnd(3)} current=${Math.round(item.current).toString().padStart(9)} ` +
        `absolute=${item.absoluteRatio.toFixed(3)} relative=${item.relativeRatio.toFixed(3)} ` +
        `calibration=${item.calibrationRatio.toFixed(3)} ${item.status}`
      )
    }

    const failed = comparisons.filter(item => !item.pass)
    if (failed.length > 0) {
      throw new Error(
        `Performance regression below ${(baseline.minRatio * 100).toFixed(0)}% baseline: ` +
        failed.map(item => item.id).join(', ')
      )
    }
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
