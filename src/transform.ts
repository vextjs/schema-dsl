import { Buffer } from 'node:buffer'
import * as generatorModule from '@babel/generator'
import type { GeneratorOptions, GeneratorResult } from '@babel/generator'
import { parse, type ParserOptions } from '@babel/parser'
import * as traverseModule from '@babel/traverse'
import type { NodePath, TraverseOptions } from '@babel/traverse'
import * as t from '@babel/types'

export type TransformSchemaDslWarningCode = 'parse-error' | 'non-dsl-literal'

export interface TransformSchemaDslWarning {
  code: TransformSchemaDslWarningCode
  message: string
  filename?: string
  loc?: {
    line: number
    column: number
  }
}

export interface TransformSchemaDslOptions {
  filename?: string
  sourceMap?: boolean | 'inline'
  importFrom?: string
  methods?: readonly string[]
  include?: (filename: string) => boolean
  onWarning?: (warning: TransformSchemaDslWarning) => void
}

export interface TransformSchemaDslResult {
  code: string
  changed: boolean
  warnings: TransformSchemaDslWarning[]
  map?: object
}

const DEFAULT_IMPORT_FROM = 'schema-dsl/pure'
const DEFAULT_METHODS = ['description'] as const
type GenerateFunction = (ast: t.Node, options?: GeneratorOptions, code?: string | Record<string, string>) => GeneratorResult
type TraverseFunction = (parent: t.Node, options?: TraverseOptions) => void
const generateCode = resolveCallableExport<GenerateFunction>(generatorModule, 'generate', '@babel/generator')
const traverseAst = resolveCallableExport<TraverseFunction>(traverseModule, 'default', '@babel/traverse')

const BUILTIN_DSL_TYPES = new Set([
  'string',
  'number',
  'integer',
  'int',
  'boolean',
  'object',
  'array',
  'null',
  'email',
  'url',
  'uri',
  'uuid',
  'ipv4',
  'ipv6',
  'ip',
  'hostname',
  'date',
  'datetime',
  'time',
  'binary',
  'buffer',
  'objectid',
  'hexcolor',
  'macaddress',
  'slug',
  'chinesename',
  'chinese',
  'emaildomain',
  'alphanum',
  'lower',
  'upper',
  'json',
  'port',
  'float',
  'double',
  'decimal',
  'enum',
])

export function transformSchemaDsl(source: string, options: TransformSchemaDslOptions = {}): TransformSchemaDslResult {
  const filename = options.filename ?? '<unknown>'
  const warnings: TransformSchemaDslWarning[] = []

  if (options.include && !options.include(filename)) {
    return { code: source, changed: false, warnings }
  }

  const warn = (warning: TransformSchemaDslWarning): void => {
    warnings.push(warning)
    options.onWarning?.(warning)
  }

  let ast: t.File
  try {
    ast = parse(source, createParserOptions(filename))
  } catch (error) {
    const warning = createWarning('parse-error', error instanceof Error ? error.message : String(error), filename)
    warn(warning)
    return { code: source, changed: false, warnings }
  }

  const importFrom = options.importFrom ?? DEFAULT_IMPORT_FROM
  const methods = new Set(options.methods ?? DEFAULT_METHODS)
  const existingDslLocalName = findExistingDslImport(ast, importFrom)
  let injectedDslLocalName: string | undefined
  const reservedLocalNames = collectBindingNames(ast)
  let changed = false

  traverseAst(ast, {
    CallExpression(path: NodePath<t.CallExpression>) {
      const dslLocalName = existingDslLocalName && isImportedBindingVisible(path, existingDslLocalName)
        ? existingDslLocalName
        : injectedDslLocalName

      if (!shouldTransformCall(path, methods, dslLocalName)) {
        return
      }

      const callee = path.node.callee
      if (!t.isMemberExpression(callee)) {
        return
      }

      const literalValue = getStaticStringValue(callee.object)
      if (literalValue === undefined) {
        return
      }

      if (!looksLikeSchemaDslLiteral(literalValue)) {
        warn(createWarning('non-dsl-literal', `Skipped non schema-dsl string literal "${literalValue}"`, filename, callee.object.loc))
        return
      }

      const targetDslLocalName = dslLocalName
        ?? (injectedDslLocalName = createDslImport(ast, importFrom, reservedLocalNames))

      callee.object = t.callExpression(t.identifier(targetDslLocalName), [t.stringLiteral(literalValue)])
      changed = true
    },
  })

  if (!changed) {
    return { code: source, changed: false, warnings }
  }

  const generated = generateCode(
    ast,
    {
      sourceMaps: Boolean(options.sourceMap),
      sourceFileName: filename,
      retainLines: false,
    },
    source,
  )

  let code = generated.code
  const map = generated.map

  if (options.sourceMap === 'inline' && map) {
    const encodedMap = Buffer.from(JSON.stringify(map), 'utf8').toString('base64')
    code += `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${encodedMap}`
  }

  const result: TransformSchemaDslResult = { code, changed: true, warnings }
  if (map) {
    result.map = map
  }
  return result
}

function createParserOptions(filename: string): ParserOptions {
  const hasUnknownExtension = filename === '<unknown>'
  const isTypeScript = hasUnknownExtension || /\.[cm]?tsx?$/i.test(filename)
  const isJsx = hasUnknownExtension || /\.[cm]?[jt]sx$/i.test(filename)
  const plugins: NonNullable<ParserOptions['plugins']> = []

  if (isTypeScript) {
    plugins.push('typescript')
  }
  if (isJsx) {
    plugins.push('jsx')
  }

  return {
    sourceType: 'unambiguous',
    plugins,
    allowReturnOutsideFunction: true,
    errorRecovery: false,
  }
}

function resolveCallableExport<T>(moduleValue: unknown, namedExport: string, moduleName: string): T {
  const moduleRecord = toRecord(moduleValue)
  const defaultRecord = toRecord(moduleRecord?.['default'])
  const candidates = [
    moduleRecord?.[namedExport],
    moduleRecord?.['default'],
    defaultRecord?.[namedExport],
    defaultRecord?.['default'],
  ]
  const callable = candidates.find(candidate => typeof candidate === 'function')

  if (!callable) {
    throw new Error(`[schema-dsl] Unable to load callable export from ${moduleName}`)
  }

  return callable as T
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined
}

function shouldTransformCall(
  path: NodePath<t.CallExpression>,
  methods: ReadonlySet<string>,
  dslLocalName: string | undefined,
): boolean {
  const callee = path.node.callee
  if (!t.isMemberExpression(callee) || callee.computed) {
    return false
  }

  if (!t.isIdentifier(callee.property) || !methods.has(callee.property.name)) {
    return false
  }

  if (isAlreadyDslCall(callee.object, dslLocalName)) {
    return false
  }

  return getStaticStringValue(callee.object) !== undefined
}

function isAlreadyDslCall(node: t.Expression | t.Super, dslLocalName: string | undefined): boolean {
  if (!t.isCallExpression(node)) {
    return false
  }

  const callee = node.callee
  return t.isIdentifier(callee) && dslLocalName !== undefined && callee.name === dslLocalName
}

function getStaticStringValue(node: t.Expression | t.Super): string | undefined {
  if (t.isStringLiteral(node)) {
    return node.value
  }
  if (t.isTemplateLiteral(node) && node.expressions.length === 0 && node.quasis.length === 1) {
    return node.quasis[0]?.value.cooked ?? node.quasis[0]?.value.raw
  }
  return undefined
}

function looksLikeSchemaDslLiteral(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || /\s/.test(trimmed)) {
    return false
  }

  const firstPart = trimmed.split('|', 1)[0] ?? trimmed
  const typeName = firstPart.match(/^[A-Za-z][A-Za-z0-9_-]*/)?.[0]?.toLowerCase()
  return typeName !== undefined && BUILTIN_DSL_TYPES.has(typeName)
}

function findExistingDslImport(ast: t.File, importFrom: string): string | undefined {
  for (const statement of ast.program.body) {
    if (!t.isImportDeclaration(statement) || statement.source.value !== importFrom) {
      continue
    }

    for (const specifier of statement.specifiers) {
      if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported) && specifier.imported.name === 'dsl') {
        return specifier.local.name
      }
      if (t.isImportDefaultSpecifier(specifier)) {
        return specifier.local.name
      }
    }
  }
  return undefined
}

function isImportedBindingVisible(path: NodePath, localName: string): boolean {
  const binding = path.scope.getBinding(localName)
  if (!binding) {
    return false
  }

  const bindingNode = binding.path.node
  return t.isImportSpecifier(bindingNode) || t.isImportDefaultSpecifier(bindingNode)
}

function createDslImport(ast: t.File, importFrom: string, reservedLocalNames: Set<string>): string {
  const localName = createUniqueImportName(reservedLocalNames)
  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(t.identifier(localName), t.identifier('dsl'))],
    t.stringLiteral(importFrom),
  )

  ast.program.body.unshift(importDeclaration)
  reservedLocalNames.add(localName)
  return localName
}

function createUniqueImportName(reservedLocalNames: Set<string>): string {
  let candidate = '__schemaDslDsl'
  let index = 2

  while (reservedLocalNames.has(candidate)) {
    candidate = `__schemaDslDsl${index}`
    index += 1
  }

  return candidate
}

function collectBindingNames(ast: t.File): Set<string> {
  const names = new Set<string>()

  traverseAst(ast, {
    ImportDeclaration(path) {
      for (const specifier of path.node.specifiers) {
        names.add(specifier.local.name)
      }
    },
    VariableDeclarator(path) {
      collectPatternNames(path.node.id, names)
    },
    FunctionDeclaration(path) {
      if (path.node.id) {
        names.add(path.node.id.name)
      }
      for (const parameter of path.node.params) {
        collectPatternNames(parameter, names)
      }
    },
    FunctionExpression(path) {
      if (path.node.id) {
        names.add(path.node.id.name)
      }
      for (const parameter of path.node.params) {
        collectPatternNames(parameter, names)
      }
    },
    ArrowFunctionExpression(path) {
      for (const parameter of path.node.params) {
        collectPatternNames(parameter, names)
      }
    },
    ClassDeclaration(path) {
      if (path.node.id) {
        names.add(path.node.id.name)
      }
    },
    ClassExpression(path) {
      if (path.node.id) {
        names.add(path.node.id.name)
      }
    },
    CatchClause(path) {
      collectPatternNames(path.node.param, names)
    },
  })

  return names
}

function collectPatternNames(pattern: t.Node | null | undefined, names: Set<string>): void {
  if (!pattern) {
    return
  }

  if (t.isIdentifier(pattern)) {
    names.add(pattern.name)
    return
  }

  if (t.isObjectPattern(pattern)) {
    for (const property of pattern.properties) {
      if (t.isObjectProperty(property)) {
        collectPatternNames(property.value, names)
      } else if (t.isRestElement(property)) {
        collectPatternNames(property.argument, names)
      }
    }
    return
  }

  if (t.isArrayPattern(pattern)) {
    for (const element of pattern.elements) {
      if (element) {
        collectPatternNames(element, names)
      }
    }
    return
  }

  if (t.isAssignmentPattern(pattern)) {
    collectPatternNames(pattern.left, names)
  } else if (t.isRestElement(pattern)) {
    collectPatternNames(pattern.argument, names)
  }
}

function createWarning(
  code: TransformSchemaDslWarningCode,
  message: string,
  filename: string,
  loc?: t.SourceLocation | null,
): TransformSchemaDslWarning {
  const warning: TransformSchemaDslWarning = {
    code,
    message,
    filename,
  }

  if (loc) {
    warning.loc = {
      line: loc.start.line,
      column: loc.start.column,
    }
  }

  return warning
}
