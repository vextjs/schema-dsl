import { readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const docsDir = join(process.cwd(), '.tmp', 'docs')
const files = readdirSync(docsDir)
  .filter(file => file.endsWith('.js'))
  .sort()

const failures = []

for (const file of files) {
  const result = spawnSync(process.execPath, [join(docsDir, file)], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })

  if (result.status !== 0 || result.signal) {
    failures.push({
      file,
      status: result.status,
      signal: result.signal,
      stderr: result.stderr?.trim() ?? '',
    })
  }
}

if (failures.length > 0) {
  console.error(`examples:run failed (${failures.length}/${files.length})`)
  for (const failure of failures) {
    console.error(`\n[${failure.file}] status=${failure.status ?? 'signal'} signal=${failure.signal ?? 'none'}`)
    console.error(failure.stderr)
  }
  process.exit(1)
}

console.log(`examples:run passed (${files.length} files)`)
console.log(`examples:run output directory: .tmp/${basename(docsDir)}/`)
