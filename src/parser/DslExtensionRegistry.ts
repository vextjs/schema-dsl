import type {
  DslExtensionDefinition,
  DslExtensionParamDefinition,
  DslExtensionParamsDefinition,
  DslExtensionSegmentMode,
  NormalizedDslExtensionDefinition,
} from '../types/dsl.js'
import type { JSONSchema } from '../types/schema.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'

export type DslExtensionParamSource = 'dsl' | 'factory'

export interface NormalizedDslExtension extends NormalizedDslExtensionDefinition {
  readonly literal?: string
  readonly factoryName?: string
  readonly params: DslExtensionParamsDefinition
}

export interface DslExtensionParamInput {
  source: DslExtensionParamSource
  segment?: string
  args?: readonly unknown[]
}

export type DslExtensionRegistryEvent = 'validate' | 'register' | 'rollback' | 'clear'
export type DslExtensionRegistryListener = (
  event: DslExtensionRegistryEvent,
  definition?: NormalizedDslExtension,
) => void

export type DslExtensionDiagnosticCode =
  | 'EXTENSION_SEGMENT_UNSUPPORTED'
  | 'EXTENSION_PARAM_MISSING'
  | 'EXTENSION_PARAM_INVALID'
  | 'EXTENSION_PARAM_EXTRA'
  | 'EXTENSION_PARAM_CONSTRAINT_MIXED'

export class DslExtensionError extends Error {
  readonly code: DslExtensionDiagnosticCode
  readonly extension: string
  readonly param?: string
  readonly inputValue?: unknown

  constructor(
    code: DslExtensionDiagnosticCode,
    message: string,
    options: {
      extension: string
      param?: string
      inputValue?: unknown
    }
  ) {
    super(message)
    this.name = 'DslExtensionError'
    this.code = code
    this.extension = options.extension
    if (options.param !== undefined) this.param = options.param
    if (options.inputValue !== undefined) this.inputValue = options.inputValue
  }
}

const FACTORY_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const LITERAL_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/
const EXTENSION_REGISTRY_STATE_KEY = Symbol.for('schema-dsl.v2.DslExtensionRegistry.default')

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function hasDefault(definition: DslExtensionParamDefinition): boolean {
  return hasOwn(definition, 'default')
}

function kebabToCamel(value: string): string {
  return value.replace(/-([a-zA-Z0-9_$])/g, (_, ch: string) => ch.toUpperCase())
}

function displayExtension(definition: Pick<NormalizedDslExtension, 'literal' | 'factoryName'>): string {
  return definition.literal ?? definition.factoryName ?? '<anonymous>'
}

function normalizeLiteral(raw: string | undefined): string | undefined {
  const literal = raw?.trim()
  if (!literal) return undefined
  if (!LITERAL_PATTERN.test(literal)) {
    throw new Error(`[schema-dsl] Cannot register extension literal "${literal}": literal must use letters, numbers, "_" or "-" and start with a letter`)
  }
  return literal
}

function normalizeFactoryName(raw: string | undefined, literal: string | undefined): string | undefined {
  const name = raw?.trim() || (literal ? kebabToCamel(literal) : undefined)
  if (!name) return undefined
  if (!FACTORY_NAME_PATTERN.test(name)) {
    throw new Error(`[schema-dsl] Cannot register namespace factory "${name}": factoryName must be a valid JavaScript identifier`)
  }
  return name
}

function normalizeSegmentMode(
  mode: DslExtensionSegmentMode | undefined,
  params: DslExtensionParamsDefinition
): DslExtensionSegmentMode {
  if (mode !== undefined) {
    if (mode !== 'none' && mode !== 'params' && mode !== 'constraint') {
      throw new Error(`[schema-dsl] Invalid extension segmentMode "${String(mode)}"`)
    }
    return mode
  }
  return Object.keys(params).length > 0 ? 'params' : 'none'
}

function normalizeParamDefinitions(raw: DslExtensionParamsDefinition | undefined): DslExtensionParamsDefinition {
  if (raw === undefined) return {}
  if (!isPlainObject(raw)) {
    throw new Error('[schema-dsl] extension params must be an object')
  }

  const normalized: DslExtensionParamsDefinition = {}
  for (const [name, value] of Object.entries(raw)) {
    if (!FACTORY_NAME_PATTERN.test(name)) {
      throw new Error(`[schema-dsl] Invalid extension param "${name}": param names must be valid JavaScript identifiers`)
    }
    if (!isPlainObject(value)) {
      throw new Error(`[schema-dsl] Invalid extension param "${name}": definition must be an object`)
    }
    const kind = value.kind
    if (kind !== 'string' && kind !== 'number' && kind !== 'boolean' && kind !== 'enum') {
      throw new Error(`[schema-dsl] Invalid extension param "${name}": kind must be string, number, boolean, or enum`)
    }
    if (kind === 'enum') {
      const values = value.values
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error(`[schema-dsl] Invalid extension param "${name}": enum params require a non-empty values array`)
      }
    }
    normalized[name] = {
      kind,
      ...(Array.isArray(value.values) ? { values: [...value.values] } : {}),
      ...(hasOwn(value, 'default') ? { default: value.default } : {}),
      ...(value.required !== undefined ? { required: value.required === true } : {}),
      ...(typeof value.description === 'string' ? { description: value.description } : {}),
      ...(value.factoryOnly !== undefined ? { factoryOnly: value.factoryOnly === true } : {}),
    }
  }
  return normalized
}

function assertDslParamShape(definition: NormalizedDslExtension): void {
  if (definition.segmentMode !== 'params') return
  const dslParams = Object.entries(definition.params).filter(([, param]) => param.factoryOnly !== true)
  if (dslParams.length > 1) {
    throw new Error(
      `[schema-dsl] Extension "${displayExtension(definition)}" uses segmentMode "params" but exposes multiple DSL params (${dslParams.map(([name]) => name).join(', ')}). ` +
      'Pure DSL supports one short colon parameter; mark extra params as factoryOnly or use s.xxx({ ... }).'
    )
  }
}

export function normalizeDslExtensionDefinition(definition: DslExtensionDefinition): NormalizedDslExtension {
  if (!definition || typeof definition !== 'object') {
    throw new Error('[schema-dsl] registerExtension() requires an extension definition object')
  }

  const literal = normalizeLiteral(definition.literal)
  const factoryName = normalizeFactoryName(definition.factoryName, literal)

  if (!literal && !factoryName) {
    throw new Error('[schema-dsl] registerExtension() requires literal or factoryName')
  }

  const params = normalizeParamDefinitions(definition.params)
  const segmentMode = normalizeSegmentMode(definition.segmentMode, params)
  const transformMethods = [...(definition.transformMethods ?? [])]
  if (definition.exposeStringChain === true) {
    if (factoryName && !transformMethods.includes(factoryName)) {
      transformMethods.push(factoryName)
    } else if (transformMethods.length === 0) {
      throw new Error('[schema-dsl] exposeStringChain requires transformMethods or a valid factoryName')
    }
  }

  const normalized: NormalizedDslExtension = {
    ...definition,
    ...(literal ? { literal } : {}),
    ...(factoryName ? { factoryName } : {}),
    params,
    segmentMode,
    transformMethods,
  }
  assertDslParamShape(normalized)
  return normalized
}

function createParamError(
  definition: NormalizedDslExtension,
  code: DslExtensionDiagnosticCode,
  message: string,
  param?: string,
  inputValue?: unknown
): DslExtensionError {
  return new DslExtensionError(code, message, {
    extension: displayExtension(definition),
    ...(param !== undefined ? { param } : {}),
    ...(inputValue !== undefined ? { inputValue } : {}),
  })
}

function coerceNumber(raw: unknown, definition: NormalizedDslExtension, name: string): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '') {
    const value = Number(raw.trim())
    if (Number.isFinite(value)) return value
  }
  throw createParamError(
    definition,
    'EXTENSION_PARAM_INVALID',
    `[schema-dsl] Extension "${displayExtension(definition)}" param "${name}" expects a finite number`,
    name,
    raw
  )
}

function coerceBoolean(raw: unknown, definition: NormalizedDslExtension, name: string): boolean {
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  throw createParamError(
    definition,
    'EXTENSION_PARAM_INVALID',
    `[schema-dsl] Extension "${displayExtension(definition)}" param "${name}" expects true or false`,
    name,
    raw
  )
}

function coerceEnum(raw: unknown, param: DslExtensionParamDefinition, definition: NormalizedDslExtension, name: string): unknown {
  const values = [...(param.values ?? [])]
  if (values.some(value => Object.is(value, raw))) return raw

  for (const value of values) {
    if (typeof value === 'number') {
      const numeric = typeof raw === 'string' && raw.trim() !== '' ? Number(raw.trim()) : raw
      if (typeof numeric === 'number' && Number.isFinite(numeric) && Object.is(value, numeric)) return value
    }
    if (typeof value === 'boolean' && typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase()
      if ((normalized === 'true' && value === true) || (normalized === 'false' && value === false)) return value
    }
    if (typeof value === 'string' && typeof raw === 'string' && value === raw) return value
  }

  throw createParamError(
    definition,
    'EXTENSION_PARAM_INVALID',
    `[schema-dsl] Extension "${displayExtension(definition)}" param "${name}" must be one of ${values.map(String).join(', ')}`,
    name,
    raw
  )
}

function coerceParamValue(
  raw: unknown,
  param: DslExtensionParamDefinition,
  definition: NormalizedDslExtension,
  name: string
): unknown {
  if (param.kind === 'number') return coerceNumber(raw, definition, name)
  if (param.kind === 'boolean') return coerceBoolean(raw, definition, name)
  if (param.kind === 'enum') return coerceEnum(raw, param, definition, name)
  if (typeof raw === 'string') return raw
  return String(raw)
}

function collectProvidedParams(definition: NormalizedDslExtension, input: DslExtensionParamInput): Record<string, unknown> {
  const entries = Object.entries(definition.params)
  const provided: Record<string, unknown> = {}

  if (input.source === 'dsl') {
    const segment = input.segment?.trim()
    if (!segment) return provided
    const dslParams = entries.filter(([, param]) => param.factoryOnly !== true)
    if (dslParams.length === 0) {
      throw createParamError(
        definition,
        'EXTENSION_PARAM_EXTRA',
        `[schema-dsl] Extension "${displayExtension(definition)}" does not accept a DSL parameter segment`,
        undefined,
        segment
      )
    }
    provided[dslParams[0][0]] = segment
    return provided
  }

  const args = [...(input.args ?? [])]
  if (args.length === 0) return provided

  if (args.length === 1 && isPlainObject(args[0])) {
    const rawObject = args[0]
    for (const key of Object.keys(rawObject)) {
      if (!hasOwn(definition.params, key)) {
        throw createParamError(
          definition,
          'EXTENSION_PARAM_EXTRA',
          `[schema-dsl] Extension "${displayExtension(definition)}" received unknown param "${key}"`,
          key,
          rawObject[key]
        )
      }
    }
    return { ...rawObject }
  }

  if (args.length > entries.length) {
    throw createParamError(
      definition,
      'EXTENSION_PARAM_EXTRA',
      `[schema-dsl] Extension "${displayExtension(definition)}" received too many factory arguments`,
      undefined,
      args.length
    )
  }

  entries.forEach(([name], index) => {
    if (index < args.length) provided[name] = args[index]
  })
  return provided
}

export function normalizeDslExtensionParams(
  definition: NormalizedDslExtension,
  input: DslExtensionParamInput
): Record<string, unknown> {
  const provided = collectProvidedParams(definition, input)
  const result: Record<string, unknown> = {}

  for (const [name, param] of Object.entries(definition.params)) {
    if (hasOwn(provided, name)) {
      result[name] = coerceParamValue(provided[name], param, definition, name)
    } else if (hasDefault(param)) {
      result[name] = coerceParamValue(param.default, param, definition, name)
    } else if (param.required === true) {
      throw createParamError(
        definition,
        'EXTENSION_PARAM_MISSING',
        `[schema-dsl] Extension "${displayExtension(definition)}" requires param "${name}"`,
        name
      )
    }
  }

  return result
}

export function buildDslExtensionSchema(
  definition: NormalizedDslExtension,
  params: Record<string, unknown>
): JSONSchema {
  if (definition.schema === undefined) {
    throw new Error(`[schema-dsl] Extension "${displayExtension(definition)}" does not provide schema`)
  }
  const schema = typeof definition.schema === 'function'
    ? (definition.schema as (params: Record<string, unknown>) => JSONSchema)(params)
    : definition.schema
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new Error(`[schema-dsl] Extension "${displayExtension(definition)}" schema must return a JSON Schema object`)
  }
  return cloneSchemaValue(schema)
}

export class DslExtensionRegistry {
  private readonly byLiteral = new Map<string, NormalizedDslExtension>()
  private readonly byFactoryName = new Map<string, NormalizedDslExtension>()
  private readonly listeners = new Set<DslExtensionRegistryListener>()

  define(definition: DslExtensionDefinition): NormalizedDslExtension {
    return normalizeDslExtensionDefinition(definition)
  }

  register(definition: DslExtensionDefinition): NormalizedDslExtension {
    const normalized = this.define(definition)
    if (normalized.literal && normalized.schema === undefined) {
      throw new Error(`[schema-dsl] Extension "${normalized.literal}" requires schema so pure DSL and s("...") can resolve it`)
    }
    if (normalized.literal && this.byLiteral.has(normalized.literal)) {
      throw new Error(`[schema-dsl] Extension literal "${normalized.literal}" already exists`)
    }
    if (normalized.factoryName && this.byFactoryName.has(normalized.factoryName)) {
      throw new Error(`[schema-dsl] Extension factory "${normalized.factoryName}" already exists`)
    }

    for (const listener of this.listeners) listener('validate', normalized)

    if (normalized.literal) this.byLiteral.set(normalized.literal, normalized)
    if (normalized.factoryName) this.byFactoryName.set(normalized.factoryName, normalized)
    const attemptedListeners: DslExtensionRegistryListener[] = []
    try {
      for (const listener of this.listeners) {
        attemptedListeners.push(listener)
        listener('register', normalized)
      }
    } catch (error) {
      if (normalized.literal) this.byLiteral.delete(normalized.literal)
      if (normalized.factoryName) this.byFactoryName.delete(normalized.factoryName)
      for (const listener of attemptedListeners.reverse()) {
        try {
          listener('rollback', normalized)
        } catch {
          // Preserve the original registration failure after best-effort rollback.
        }
      }
      throw error
    }
    return normalized
  }

  getByLiteral(literal: string): NormalizedDslExtension | undefined {
    return this.byLiteral.get(literal)
  }

  getByFactoryName(factoryName: string): NormalizedDslExtension | undefined {
    return this.byFactoryName.get(factoryName)
  }

  list(): NormalizedDslExtension[] {
    return [...new Set([...this.byLiteral.values(), ...this.byFactoryName.values()])]
  }

  subscribe(listener: DslExtensionRegistryListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  clear(): void {
    this.byLiteral.clear()
    this.byFactoryName.clear()
    for (const listener of this.listeners) listener('clear')
  }
}

export function getDefaultDslExtensionRegistry(): DslExtensionRegistry {
  const host = globalThis as typeof globalThis & Record<symbol, DslExtensionRegistry | undefined>
  const existing = host[EXTENSION_REGISTRY_STATE_KEY]
  if (existing) return existing
  const created = new DslExtensionRegistry()
  host[EXTENSION_REGISTRY_STATE_KEY] = created
  return created
}

export const DEFAULT_DSL_EXTENSION_REGISTRY = getDefaultDslExtensionRegistry()
