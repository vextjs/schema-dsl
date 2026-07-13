import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const snapshot = JSON.parse(readFileSync(resolve(repoRoot, 'test/benchmarks/performance-docs-snapshot.json'), 'utf8'))

function formatOps(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(3)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toFixed(2)
}

function resultText(scenario) {
  if (scenario.schemaDsl >= scenario.zod) {
    return `schema-dsl ${(scenario.schemaDsl / scenario.zod).toFixed(2)}x`
  }
  return `Zod ${(scenario.zod / scenario.schemaDsl).toFixed(2)}x`
}

function expectedRow(scenario, locale) {
  return `| ${scenario.id} | ${scenario[locale]} | ${formatOps(scenario.schemaDsl)} | ${formatOps(scenario.zod)} | ${resultText(scenario)} |`
}

for (const [locale, relativePath] of [
  ['zh', 'docs/zh/performance-guide.md'],
  ['en', 'docs/en/performance-guide.md'],
]) {
  const doc = readFileSync(resolve(repoRoot, relativePath), 'utf8')
  const rows = snapshot.scenarios.map(scenario => expectedRow(scenario, locale))
  const missing = rows.filter(row => !doc.includes(row))
  if (missing.length > 0) {
    throw new Error(`${relativePath} is not synchronized with the performance snapshot:\n${missing.join('\n')}`)
  }

  const scenarioRows = doc.split(/\r?\n/).filter(line => /^\| (S1|S2|S3|C1|C2|U1|U2|E1|A1|A2|D1|L1|COND1|COND2|CV1|CV2|AV1|AV2|AV2_THROW|COLD1) \|/.test(line))
  if (scenarioRows.length !== snapshot.summary.tableRows || snapshot.scenarios.length !== snapshot.summary.tableRows) {
    throw new Error(`${relativePath} contains ${scenarioRows.length} scenario rows; expected ${snapshot.summary.tableRows}`)
  }
  if (!doc.includes(`${snapshot.summary.schemaDslWins}/19`) || !doc.includes(`${snapshot.summary.zodWins}/19`)) {
    throw new Error(`${relativePath} winner counts do not match the performance snapshot`)
  }
  const summaryLine = doc.split(/\r?\n/).find(line => line.includes(locale === 'zh' ? '计入胜负' : 'winner summary')) ?? ''
  if (!/diagnostic|诊断/.test(summaryLine)) {
    throw new Error(`${relativePath} does not identify the diagnostic comparison in its summary`)
  }
  if (snapshot.summary.diagnosticIds.length !== snapshot.summary.diagnosticComparisons
    || snapshot.summary.diagnosticIds.some(id => !summaryLine.includes(`\`${id}\``))) {
    throw new Error(`${relativePath} diagnostic comparison IDs do not match the performance snapshot`)
  }
  for (const value of [snapshot.metadata.node, snapshot.metadata.platform, snapshot.metadata.startedAt, snapshot.metadata.zod]) {
    if (!doc.includes(value)) throw new Error(`${relativePath} is missing benchmark metadata ${value}`)
  }
}

for (const [locale, relativePath] of [
  ['zh', 'docs/zh/faq.md'],
  ['en', 'docs/en/faq.md'],
]) {
  const doc = readFileSync(resolve(repoRoot, relativePath), 'utf8')
  const summaryLine = doc.split(/\r?\n/).find(line => line.includes(locale === 'zh' ? '性能指南区分' : 'performance guide distinguishes')) ?? ''
  if (!summaryLine.includes('19')
    || snapshot.summary.diagnosticIds.some(id => !summaryLine.includes(`\`${id}\``))) {
    throw new Error(`${relativePath} diagnostic comparison summary does not match the performance snapshot`)
  }
}

console.log('[schema-dsl] performance documentation matches the tracked snapshot')
