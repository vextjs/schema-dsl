import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build, context, type Plugin } from 'esbuild'
import { describe, expect, it } from 'vitest'

import { schemaDslEsbuildPlugin } from '../../src/esbuild.js'

describe('schemaDslEsbuildPlugin', () => {
  it('transforms files loaded by esbuild build', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'schema-dsl-esbuild-'))
    try {
      const entry = join(workspace, 'entry.ts')
      await writeFile(entry, 'export const field = "email!".description("Email")', 'utf8')

      const result = await build({
        entryPoints: [entry],
        bundle: false,
        format: 'esm',
        platform: 'node',
        write: false,
        plugins: [schemaDslEsbuildPlugin()],
      })

      const output = result.outputFiles[0]?.text ?? ''
      expect(output).toContain('from "schema-dsl/pure"')
      expect(output).toContain('__schemaDslDsl("email!").description("Email")')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('works with esbuild context rebuild', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'schema-dsl-context-'))
    try {
      const entry = join(workspace, 'entry.ts')
      await writeFile(entry, 'export const field = "string!".description("Name")', 'utf8')

      const ctx = await context({
        entryPoints: [entry],
        bundle: false,
        format: 'esm',
        platform: 'node',
        write: false,
        plugins: [schemaDslEsbuildPlugin()],
      })

      try {
        const result = await ctx.rebuild()
        const output = result.outputFiles[0]?.text ?? ''
        expect(output).toContain('__schemaDslDsl("string!").description("Name")')
      } finally {
        await ctx.dispose()
      }
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('does not intercept virtual modules owned by other plugins', async () => {
    const virtualPlugin: Plugin = {
      name: 'virtual-entry',
      setup(buildApi) {
        buildApi.onResolve({ filter: /^virtual:entry$/ }, () => ({
          path: 'entry.ts',
          namespace: 'virtual',
        }))
        buildApi.onLoad({ filter: /^entry\.ts$/, namespace: 'virtual' }, () => ({
          contents: 'export const field = "email!".description("Email")',
          loader: 'ts',
        }))
      },
    }

    const result = await build({
      entryPoints: ['virtual:entry'],
      bundle: false,
      format: 'esm',
      platform: 'node',
      write: false,
      plugins: [schemaDslEsbuildPlugin(), virtualPlugin],
    })

    const output = result.outputFiles[0]?.text ?? ''
    expect(output).toContain('"email!".description("Email")')
  })
})
