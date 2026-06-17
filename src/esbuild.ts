import { readFile } from 'node:fs/promises'
import { dirname, extname } from 'node:path'
import type { Loader, Plugin } from 'esbuild'
import { transformSchemaDsl, type TransformSchemaDslOptions } from './transform.js'

export interface SchemaDslEsbuildPluginOptions extends TransformSchemaDslOptions {
  filter?: RegExp
}

const DEFAULT_FILTER = /\.[cm]?[jt]sx?$/

export function schemaDslEsbuildPlugin(options: SchemaDslEsbuildPluginOptions = {}): Plugin {
  const { filter = DEFAULT_FILTER, ...transformOptions } = options

  return {
    name: 'schema-dsl',
    setup(build) {
      build.onLoad({ filter, namespace: 'file' }, async (args) => {
        if (isNodeModulesPath(args.path)) {
          return undefined
        }

        const source = await readFile(args.path, 'utf8')
        const sourceMap = transformOptions.sourceMap ?? (build.initialOptions.sourcemap ? 'inline' : false)
        const result = transformSchemaDsl(source, {
          ...transformOptions,
          filename: args.path,
          sourceMap,
        })

        if (!result.changed) {
          return undefined
        }

        return {
          contents: result.code,
          loader: loaderFromPath(args.path),
          resolveDir: dirname(args.path),
        }
      })
    },
  }
}

function loaderFromPath(path: string): Loader {
  switch (extname(path).toLowerCase()) {
    case '.ts':
    case '.mts':
    case '.cts':
      return 'ts'
    case '.tsx':
      return 'tsx'
    case '.jsx':
      return 'jsx'
    default:
      return 'js'
  }
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|[\\/])node_modules(?:[\\/]|$)/.test(path)
}
