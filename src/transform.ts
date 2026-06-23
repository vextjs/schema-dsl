import { Buffer } from 'node:buffer'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { GeneratorOptions, GeneratorResult } from '@babel/generator'
import type { parse, ParserOptions } from '@babel/parser'
import type { NodePath, TraverseOptions } from '@babel/traverse'
import type * as BabelTypes from '@babel/types'

import { STRING_EXTENSION_METHODS } from './core/StringExtensions.js'

export type TransformSchemaDslWarningCode =
  | 'parse-error'
  | 'non-dsl-literal'
  | 'root-import'
  | 'unconfigured-extension-method'

export interface TransformSchemaDslWarning {
  code: TransformSchemaDslWarningCode
  message: string
  filename?: string
  loc?: {
    line: number
    column: number
  }
}

export interface TransformSchemaDslStrictOptions {
  parseError?: boolean
  rootImport?: boolean
  unconfiguredExtensionMethod?: boolean
  nonDslLiteral?: boolean
}

export interface TransformSchemaDslOptions {
  filename?: string
  sourceMap?: boolean | 'inline'
  importFrom?: string
  methods?: readonly string[]
  additionalMethods?: readonly string[]
  additionalTypes?: readonly string[]
  additionalTypePatterns?: readonly (RegExp | string)[]
  include?: (filename: string) => boolean
  strict?: boolean | TransformSchemaDslStrictOptions
  onWarning?: (warning: TransformSchemaDslWarning) => void
}

export interface TransformSchemaDslResult {
  code: string
  changed: boolean
  warnings: TransformSchemaDslWarning[]
  map?: object
}

export class TransformSchemaDslError extends Error {
  readonly warning: TransformSchemaDslWarning

  constructor(warning: TransformSchemaDslWarning) {
    super(formatStrictErrorMessage(warning))
    this.name = 'TransformSchemaDslError'
    this.warning = warning
  }
}

const DEFAULT_IMPORT_FROM = 'schema-dsl/pure'
const DEFAULT_METHODS = STRING_EXTENSION_METHODS
type ParseFunction = typeof parse
type GenerateFunction = (ast: BabelTypes.Node, options?: GeneratorOptions, code?: string | Record<string, string>) => GeneratorResult
type TraverseFunction = (parent: BabelTypes.Node, options?: TraverseOptions) => void
type BabelTypesModule = typeof BabelTypes

interface BabelRuntime {
  parse: ParseFunction
  generateCode: GenerateFunction
  traverseAst: TraverseFunction
  types: BabelTypesModule
}

const packageRequire = createRequire(
  typeof __filename === 'string' ? __filename : join(process.cwd(), 'schema-dsl-transform-runtime.js')
)
const cwdRequire = createRequire(join(process.cwd(), 'schema-dsl-transform-runtime.js'))
let babelRuntime: BabelRuntime | null = null

const BABEL_PEER_MESSAGE = [
  '[schema-dsl] schema-dsl/transform requires optional Babel peer dependencies.',
  'Install @babel/parser, @babel/traverse, @babel/generator and @babel/types to use transformSchemaDsl().',
].join(' ')

function loadBabelRuntime(): BabelRuntime {
  if (babelRuntime) return babelRuntime
  try {
    const parserModule = requireBabelPeer('@babel/parser')
    const generatorModule = requireBabelPeer('@babel/generator')
    const traverseModule = requireBabelPeer('@babel/traverse')
    const typesModule = requireBabelPeer('@babel/types') as BabelTypesModule
    babelRuntime = {
      parse: resolveCallableExport<ParseFunction>(parserModule, 'parse', '@babel/parser'),
      generateCode: resolveCallableExport<GenerateFunction>(generatorModule, 'generate', '@babel/generator'),
      traverseAst: resolveCallableExport<TraverseFunction>(traverseModule, 'default', '@babel/traverse'),
      types: typesModule,
    }
    return babelRuntime
  } catch (error) {
    throw new Error(`${BABEL_PEER_MESSAGE} Cause: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function requireBabelPeer(moduleName: string): unknown {
  try {
    return packageRequire(moduleName)
  } catch (packageError) {
    try {
      return cwdRequire(moduleName)
    } catch (cwdError) {
      const packageMessage = packageError instanceof Error ? packageError.message : String(packageError)
      const cwdMessage = cwdError instanceof Error ? cwdError.message : String(cwdError)
      throw new Error(
        `Unable to resolve ${moduleName} from the schema-dsl package location or process cwd. package: ${packageMessage}; cwd: ${cwdMessage}`
      )
    }
  }
}

const t = new Proxy({}, {
  get(_target, prop) {
    return (loadBabelRuntime().types as unknown as Record<PropertyKey, unknown>)[prop]
  },
}) as BabelTypesModule

const parseCode: ParseFunction = (...args) => loadBabelRuntime().parse(...args)
const generateCode: GenerateFunction = (...args) => loadBabelRuntime().generateCode(...args)
const traverseAst: TraverseFunction = (...args) => loadBabelRuntime().traverseAst(...args)

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
    if (shouldThrowForWarning(warning.code, options.strict)) {
      throw new TransformSchemaDslError(warning)
    }
  }

  let ast: BabelTypes.File
  try {
    ast = parseCode(source, createParserOptions(filename))
  } catch (error) {
    const warning = createWarning('parse-error', error instanceof Error ? error.message : String(error), filename)
    warn(warning)
    return { code: source, changed: false, warnings }
  }

  const importFrom = options.importFrom ?? DEFAULT_IMPORT_FROM
  const methods = createConfiguredMethodSet(options)
  const literalMatcher = createDslLiteralMatcher(options)
  const existingDslLocalName = findExistingDslImport(ast, importFrom)
  let injectedDslLocalName: string | undefined
  const reservedLocalNames = collectBindingNames(ast)
  let changed = false

  for (const warning of findRootImportWarnings(ast, filename)) {
    warn(warning)
  }

  traverseAst(ast, {
    CallExpression(path: NodePath<BabelTypes.CallExpression>) {
      warnIfUnconfiguredExtensionMethod(path, methods, filename, warn)

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

      if (!literalMatcher(literalValue)) {
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

  plugins.push(['decorators', { decoratorsBeforeExport: false }])
  plugins.push('importAttributes')
  plugins.push('explicitResourceManagement')

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

function createConfiguredMethodSet(options: TransformSchemaDslOptions): ReadonlySet<string> {
  return new Set([
    ...(options.methods ?? DEFAULT_METHODS),
    ...(options.additionalMethods ?? []),
  ])
}

function createDslLiteralMatcher(options: TransformSchemaDslOptions): (value: string) => boolean {
  const additionalTypes = new Set((options.additionalTypes ?? []).map(type => type.toLowerCase()))
  const additionalTypePatterns = (options.additionalTypePatterns ?? []).map(pattern =>
    typeof pattern === 'string' ? new RegExp(pattern) : pattern
  )

  return (value: string): boolean => {
    if (looksLikeSchemaDslLiteral(value)) {
      return true
    }

    const typeName = getDslLiteralTypeName(value)
    if (typeName && additionalTypes.has(typeName.toLowerCase())) {
      return true
    }

    return additionalTypePatterns.some(pattern => {
      pattern.lastIndex = 0
      return pattern.test(value)
    })
  }
}

function shouldThrowForWarning(
  code: TransformSchemaDslWarningCode,
  strict: TransformSchemaDslOptions['strict'],
): boolean {
  if (!strict) {
    return false
  }

  if (strict === true) {
    return code === 'parse-error'
      || code === 'root-import'
      || code === 'unconfigured-extension-method'
  }

  switch (code) {
    case 'parse-error':
      return strict.parseError === true
    case 'root-import':
      return strict.rootImport === true
    case 'unconfigured-extension-method':
      return strict.unconfiguredExtensionMethod === true
    case 'non-dsl-literal':
      return strict.nonDslLiteral === true
  }
}

function formatStrictErrorMessage(warning: TransformSchemaDslWarning): string {
  const location = warning.loc
    ? `${warning.filename ?? '<unknown>'}:${warning.loc.line}:${warning.loc.column + 1}`
    : warning.filename ?? '<unknown>'
  return `[schema-dsl] Transform strict mode failed (${warning.code}) at ${location}: ${warning.message}`
}

function findRootImportWarnings(ast: BabelTypes.File, filename: string): TransformSchemaDslWarning[] {
  const warnings: TransformSchemaDslWarning[] = []

  for (const statement of ast.program.body) {
    const source = 'source' in statement ? statement.source : undefined
    if (!source || source.value !== 'schema-dsl') {
      continue
    }

    if (t.isImportDeclaration(statement) && isTypeOnlyImportDeclaration(statement)) {
      continue
    }
    if (t.isExportNamedDeclaration(statement) && isTypeOnlyExportNamedDeclaration(statement)) {
      continue
    }
    if (t.isExportAllDeclaration(statement) && statement.exportKind === 'type') {
      continue
    }

    warnings.push(createWarning(
      'root-import',
      'Root import "schema-dsl" keeps the compatibility String.prototype side effect; use "schema-dsl/pure" with the transform output or import "schema-dsl/register-string" explicitly when the side effect is intended.',
      filename,
      statement.loc,
    ))
  }

  traverseAst(ast, {
    CallExpression(path: NodePath<BabelTypes.CallExpression>) {
      const firstArg = path.node.arguments[0]
      if (t.isIdentifier(path.node.callee, { name: 'require' })
        && t.isStringLiteral(firstArg)
        && firstArg.value === 'schema-dsl') {
        warnings.push(createWarning(
          'root-import',
          'require("schema-dsl") keeps the compatibility String.prototype side effect; require "schema-dsl/pure" with the transform output or require "schema-dsl/register-string" explicitly when the side effect is intended.',
          filename,
          path.node.loc,
        ))
      }
    },
    Import(path: NodePath<BabelTypes.Import>) {
      const parent = path.parentPath.node
      if (!t.isCallExpression(parent)) {
        return
      }

      const firstArg = parent.arguments[0]
      if (!t.isStringLiteral(firstArg) || firstArg.value !== 'schema-dsl') {
        return
      }

      warnings.push(createWarning(
        'root-import',
        'import("schema-dsl") keeps the compatibility String.prototype side effect; import "schema-dsl/pure" with the transform output or import "schema-dsl/register-string" explicitly when the side effect is intended.',
        filename,
        parent.loc,
      ))
    },
  })

  return warnings
}

function isTypeOnlyImportDeclaration(statement: BabelTypes.ImportDeclaration): boolean {
  return statement.importKind === 'type'
    || (
      statement.specifiers.length > 0
      && statement.specifiers.every(specifier => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
    )
}

function isTypeOnlyExportNamedDeclaration(statement: BabelTypes.ExportNamedDeclaration): boolean {
  return statement.exportKind === 'type'
    || (
      statement.specifiers.length > 0
      && statement.specifiers.every(specifier => t.isExportSpecifier(specifier) && specifier.exportKind === 'type')
    )
}

function warnIfUnconfiguredExtensionMethod(
  path: NodePath<BabelTypes.CallExpression>,
  methods: ReadonlySet<string>,
  filename: string,
  warn: (warning: TransformSchemaDslWarning) => void,
): void {
  if (path.parentPath.isMemberExpression() && path.parentPath.node.object === path.node) {
    return
  }

  const chain = getStaticStringCallChain(path.node)
  if (!chain) {
    return
  }

  const missingMethod = chain.methods.find(method => !methods.has(method))
  if (!missingMethod) {
    return
  }

  warn(createWarning(
    'unconfigured-extension-method',
    `Found schema-dsl string chain method "${missingMethod}" that is not configured for compile-time transformation. Add it with additionalMethods, or pass methods when intentionally replacing the full method set.`,
    filename,
    chain.loc,
  ))
}

interface StaticStringCallChain {
  literalValue: string
  methods: string[]
  loc: BabelTypes.SourceLocation | null | undefined
}

function getStaticStringCallChain(node: BabelTypes.CallExpression): StaticStringCallChain | undefined {
  const methods: string[] = []
  let current: BabelTypes.Expression | BabelTypes.Super = node

  while (t.isCallExpression(current)) {
    const currentCall: BabelTypes.CallExpression = current
    const callee = currentCall.callee
    if (!t.isMemberExpression(callee) || callee.computed || !t.isIdentifier(callee.property)) {
      return undefined
    }

    methods.unshift(callee.property.name)
    current = callee.object
  }

  const literalValue = getStaticStringValue(current)
  return literalValue === undefined
    ? undefined
    : { literalValue, methods, loc: current.loc }
}

function shouldTransformCall(
  path: NodePath<BabelTypes.CallExpression>,
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

function isAlreadyDslCall(node: BabelTypes.Expression | BabelTypes.Super, dslLocalName: string | undefined): boolean {
  if (!t.isCallExpression(node)) {
    return false
  }

  const callee = node.callee
  return t.isIdentifier(callee) && dslLocalName !== undefined && callee.name === dslLocalName
}

function getStaticStringValue(node: BabelTypes.Expression | BabelTypes.Super): string | undefined {
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

  if (looksLikePipeEnumLiteral(trimmed)) {
    return true
  }

  const typeName = getDslLiteralTypeName(trimmed)?.toLowerCase()
  return typeName !== undefined && BUILTIN_DSL_TYPES.has(typeName)
}

function getDslLiteralTypeName(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed || /\s/.test(trimmed) || looksLikePipeEnumLiteral(trimmed)) {
    return undefined
  }

  const firstPart = trimmed.split('|', 1)[0] ?? trimmed
  return firstPart.match(/^[A-Za-z][A-Za-z0-9_-]*/)?.[0]
}

function looksLikePipeEnumLiteral(value: string): boolean {
  if (!value.includes('|')) {
    return false
  }

  const parts = value.split('|')
  return parts.length > 1 && parts.every(part => part.length > 0 && !part.includes(','))
}

function findExistingDslImport(ast: BabelTypes.File, importFrom: string): string | undefined {
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

function createDslImport(ast: BabelTypes.File, importFrom: string, reservedLocalNames: Set<string>): string {
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

function collectBindingNames(ast: BabelTypes.File): Set<string> {
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

function collectPatternNames(pattern: BabelTypes.Node | null | undefined, names: Set<string>): void {
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
  loc?: BabelTypes.SourceLocation | null,
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
