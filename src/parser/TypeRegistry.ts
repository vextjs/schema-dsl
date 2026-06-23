import type { JSONSchema } from '../types/schema.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'

/**
 * Type definition (structure of each entry in TypeRegistry)
 */
export interface TypeDefinition {
  /** Base JSON Schema fragment for this type */
  baseSchema: Partial<JSONSchema>
  /** Custom messages associated with this type (e.g., error key for phone type) */
  customMessages?: Record<string, string>
  /** Whether this type uses a pattern (keys are standard JSON Schema fields, not stripped in toJsonSchema) */
  isPattern?: boolean
}

export type SchemaDslUnknownTypeMode = 'warn' | 'error' | 'ignore'

export interface SchemaDslDiagnostic {
  code:
    | 'UNKNOWN_TYPE'
    | 'INVALID_CONSTRAINT'
    | 'EXTENSION_SEGMENT_UNSUPPORTED'
    | 'EXTENSION_PARAM_MISSING'
    | 'EXTENSION_PARAM_INVALID'
    | 'EXTENSION_PARAM_EXTRA'
    | 'EXTENSION_PARAM_CONSTRAINT_MIXED'
  severity: 'warning' | 'error'
  path: string
  input: string
  typeName?: string
  constraint?: string
  param?: string
  message: string
}

export interface TypeResolveOptions {
  unknownType?: SchemaDslUnknownTypeMode
  diagnostics?: SchemaDslDiagnostic[]
  path?: string
  input?: string
  emitWarning?: boolean
  throwOnError?: boolean
  registryScope?: TypeRegistryScope
}

export interface TypeRegistryScope {
  customTypes?: Map<string, TypeDefinition>
  dynamicTypes?: Map<string, () => JSONSchema>
  strictMode?: boolean
  includeGlobalCustomTypes?: boolean
}

interface TypeRegistryRuntimeState {
  customTypes: Map<string, TypeDefinition>
  dynamicTypes: Map<string, () => JSONSchema>
  strictMode: boolean
}

const TYPE_REGISTRY_STATE_KEY = Symbol.for('schema-dsl.v2.TypeRegistry.state')

function getRuntimeState(): TypeRegistryRuntimeState {
  const host = globalThis as typeof globalThis & Record<symbol, TypeRegistryRuntimeState | undefined>
  const existing = host[TYPE_REGISTRY_STATE_KEY]
  if (existing) return existing

  const state: TypeRegistryRuntimeState = {
    customTypes: new Map(),
    dynamicTypes: new Map(),
    strictMode: false,
  }
  host[TYPE_REGISTRY_STATE_KEY] = state
  return state
}

/** Known internal key set (stripped from output during toJsonSchema) */
const INTERNAL_KEYS: ReadonlySet<string> = new Set([
  '_label',
  '_customMessages',
  '_description',
  '_required',
  '_isConditional',
  '_runtimeOnlyConditional',
  'conditions',
  '_evaluateCondition',
  // Custom AJV keywords (non-standard JSON Schema fields, stripped on output)
  'exactLength',
  'alphanum',
  'lowercase',
  'uppercase',
  'trim',
  'jsonString',
  'port',
  'requiredAll',
  'strictSchema',
  'noSparse',
  'includesRequired',
  'dateFormat',
  'dateGreater',
  'dateLess',
  'precision',
  // ⚠️ multipleOf is a standard JSON Schema field and is NOT in this list (fix DB-01)
])

/**
 * Built-in type registry
 * 33 types covering v1 DslAdapter.typeMap + DslBuilder type lists (fixes inconsistencies DB-02, DA-01)
 */
const BUILTIN_TYPES: Map<string, TypeDefinition> = new Map([
  // --- Primitive types ---
  ['string', { baseSchema: { type: 'string' } }],
  ['number', { baseSchema: { type: 'number' } }],
  ['integer', { baseSchema: { type: 'integer' } }],
  ['int', { baseSchema: { type: 'integer' } }],
  ['boolean', { baseSchema: { type: 'boolean' } }],
  ['object', { baseSchema: { type: 'object' } }],
  ['array', { baseSchema: { type: 'array' } }],
  ['null', { baseSchema: { type: 'null' } }],
  ['any', { baseSchema: {} }],
  ['mixed', { baseSchema: {} }],

  // --- Format types ---
  ['email', { baseSchema: { type: 'string', format: 'email' } }],
  ['url', { baseSchema: { type: 'string', format: 'uri' } }],
  ['uri', { baseSchema: { type: 'string', format: 'uri' } }],
  ['uuid', { baseSchema: { type: 'string', format: 'uuid' } }],
  ['ipv4', { baseSchema: { type: 'string', format: 'ipv4' } }],
  ['ipv6', { baseSchema: { type: 'string', format: 'ipv6' } }],
  ['ip', { baseSchema: { anyOf: [{ type: 'string', format: 'ipv4' }, { type: 'string', format: 'ipv6' }] } }],
  ['hostname', { baseSchema: { type: 'string', format: 'hostname' } }],
  ['date', { baseSchema: { type: 'string', format: 'date' } }],
  ['datetime', { baseSchema: { type: 'string', format: 'date-time' } }],
  ['time', { baseSchema: { type: 'string', format: 'time' } }],

  // --- Special string types ---
  ['binary', { baseSchema: { type: 'string', contentEncoding: 'base64' } }],
  ['buffer', { baseSchema: { type: 'string', contentEncoding: 'base64' } }],
  ['objectId', { baseSchema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }, customMessages: { pattern: 'pattern.objectId' } }],
  ['objectid', { baseSchema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }, customMessages: { pattern: 'pattern.objectId' } }],
  ['hexColor', { baseSchema: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' }, customMessages: { pattern: 'pattern.hexColor' } }],
  ['macAddress', {
    baseSchema: { type: 'string', pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$' },
    customMessages: { pattern: 'pattern.macAddress' },
  }],
  ['cron', {
    baseSchema: {
      type: 'string',
      pattern:
        '^(\\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\\*\\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) ' +
        '(\\*|([0-9]|1[0-9]|2[0-3])|\\*\\/([0-9]|1[0-9]|2[0-3])) ' +
        '(\\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\\*\\/([1-9]|1[0-9]|2[0-9]|3[0-1])) ' +
        '(\\*|([1-9]|1[0-2])|\\*\\/([1-9]|1[0-2])) ' +
        '(\\*|([0-6])|\\*\\/([0-6]))$',
    },
    customMessages: { pattern: 'pattern.cron' },
  }],

  // --- slug (fix DB-02: v1 DslAdapter was missing slug type definition) ---
  ['slug', {
    baseSchema: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
    customMessages: { pattern: 'pattern.slug' },
  }],

  // --- CJK / Chinese ---
  ['chineseName', {
    baseSchema: { type: 'string', pattern: '^[\\u4e00-\\u9fa5]{2,10}$' },
    customMessages: { pattern: 'chineseName' },
  }],
  ['chinese', {
    baseSchema: { type: 'string', pattern: '^[\\u4e00-\\u9fa5]+$' },
  }],

  // --- Domain-related (handled by CustomKeywords; only baseSchema registered here) ---
  ['emailDomain', { baseSchema: { type: 'string', format: 'email' } }],

  // --- v1 extension types (DslBuilder v1.0.2) ---
  ['alphanum', { baseSchema: { type: 'string', alphanum: true } }],
  ['lower', { baseSchema: { type: 'string', lowercase: true } }],
  ['upper', { baseSchema: { type: 'string', uppercase: true } }],
  ['json', { baseSchema: { type: 'string', jsonString: true } }],
  ['port', { baseSchema: { type: 'integer', port: true } }],

  // --- Numeric aliases used by legacy schema-dsl / ODM consumers ---
  ['float', { baseSchema: { type: 'number' } }],
  ['double', { baseSchema: { type: 'number' } }],
  ['decimal', { baseSchema: { type: 'number' } }],
])

const PROTECTED_BUILTIN_TYPES = new Set([
  'string',
  'number',
  'integer',
  'int',
  'boolean',
  'object',
  'array',
  'null',
  'any',
  'mixed',
])

function getUnknownTypeMessage(typeName: string): string {
  return `[schema-dsl] Unknown type "${typeName}"`
}

function recordUnknownType(typeName: string, options: TypeResolveOptions, severity: 'warning' | 'error'): void {
  options.diagnostics?.push({
    code: 'UNKNOWN_TYPE',
    severity,
    path: options.path ?? '',
    input: options.input ?? typeName,
    typeName,
    message: `${getUnknownTypeMessage(typeName)}, falling back to string`,
  })
}

/**
 * Custom type registry (populated via registerType)
 */
const RUNTIME_STATE = getRuntimeState()
const CUSTOM_TYPES = RUNTIME_STATE.customTypes
const DYNAMIC_TYPES = RUNTIME_STATE.dynamicTypes

/**
 * TypeRegistry — unified type registration and resolution
 *
 * Replaces the three inconsistent type lists in v1 (fixes DB-01/DB-02/DA-01)
 */
export const TypeRegistry = {
  /**
   * Resolve a type name to its TypeDefinition.
   * Built-in types take priority; custom types may override non-primitive built-ins.
   */
  resolve(typeName: string, options: TypeResolveOptions = {}): TypeDefinition {
    const protectedBuiltin = PROTECTED_BUILTIN_TYPES.has(typeName) ? BUILTIN_TYPES.get(typeName) : undefined
    if (protectedBuiltin) return protectedBuiltin

    const scope = options.registryScope
    const scopedDynamicTypes = scope?.dynamicTypes
    const scopedCustomTypes = scope?.customTypes
    const includeGlobalCustomTypes = scope?.includeGlobalCustomTypes !== false

    // Dynamic types: call factory function each time
    const dynamicFn = scopedDynamicTypes?.get(typeName) ?? (includeGlobalCustomTypes ? DYNAMIC_TYPES.get(typeName) : undefined)
    if (dynamicFn) {
      return { baseSchema: dynamicFn() as Partial<JSONSchema> }
    }

    const custom = scopedCustomTypes?.get(typeName) ?? (includeGlobalCustomTypes ? CUSTOM_TYPES.get(typeName) : undefined)
    if (custom) return custom

    const builtin = BUILTIN_TYPES.get(typeName)
    if (builtin) return builtin

    const unknownType = options.unknownType ?? ((scope?.strictMode ?? RUNTIME_STATE.strictMode) ? 'error' : 'warn')

    if (unknownType === 'error') {
      recordUnknownType(typeName, options, 'error')
      if (options.throwOnError !== false) {
        throw new Error(getUnknownTypeMessage(typeName))
      }
      return { baseSchema: { type: 'string' } }
    }

    if (unknownType === 'warn') {
      recordUnknownType(typeName, options, 'warning')
      if (options.emitWarning !== false) {
        console.warn(`${getUnknownTypeMessage(typeName)}, falling back to string`)
      }
    }
    return { baseSchema: { type: 'string' } }
  },

  /**
   * Register a custom type (delegated from DslBuilder.registerType)
   */
  register(name: string, def: TypeDefinition | Partial<JSONSchema>): void {
    if (!name || typeof name !== 'string') {
      throw new Error('[schema-dsl] TypeRegistry.register: name must be a non-empty string')
    }
    if (PROTECTED_BUILTIN_TYPES.has(name)) {
      throw new Error(`[schema-dsl] Cannot override built-in primitive type "${name}"`)
    }
    // Accept a raw Partial<JSONSchema> and wrap it automatically
    const normalized: TypeDefinition =
      'baseSchema' in def ? (def as TypeDefinition) : { baseSchema: def as Partial<JSONSchema> }
    CUSTOM_TYPES.set(name, normalized)
    DYNAMIC_TYPES.delete(name)
  },

  /**
   * Register a dynamic type (factory function invoked on every resolve call)
   */
  registerDynamic(name: string, factory: () => JSONSchema): void {
    if (!name || typeof name !== 'string') {
      throw new Error('[schema-dsl] TypeRegistry.registerDynamic: name must be a non-empty string')
    }
    if (PROTECTED_BUILTIN_TYPES.has(name)) {
      throw new Error(`[schema-dsl] Cannot override built-in primitive type "${name}"`)
    }
    DYNAMIC_TYPES.set(name, factory)
    CUSTOM_TYPES.delete(name)
  },

  /**
   * Unregister a custom type
   */
  unregister(name: string): void {
    CUSTOM_TYPES.delete(name)
    DYNAMIC_TYPES.delete(name)
  },

  /**
   * Clear all custom and dynamic types (primarily for testing; called by DslBuilder.clearCustomTypes).
   * Built-in types are unaffected.
   */
  clearCustomTypes(): void {
    CUSTOM_TYPES.clear()
    DYNAMIC_TYPES.clear()
  },

  /**
   * Enable or disable strict mode for type resolution.
   * In strict mode, resolving an unknown type throws instead of warning and falling back to string.
   */
  setStrict(flag: boolean): void {
    RUNTIME_STATE.strictMode = flag
  },

  /**
   * Check whether a type is registered (built-in or custom)
   */
  has(typeName: string): boolean {
    return BUILTIN_TYPES.has(typeName) || CUSTOM_TYPES.has(typeName) || DYNAMIC_TYPES.has(typeName)
  },

  /**
   * Check whether a type name is one of schema-dsl's built-in names.
   * Runtime instances use this to reject built-in overrides without reading
   * global custom types from the root/pure singleton registry.
   */
  hasBuiltin(typeName: string): boolean {
    return BUILTIN_TYPES.has(typeName)
  },

  /**
   * Return an iterator over all registered types (built-in + custom + dynamic; later entries override earlier ones)
   * BC-4 compat: consumed by the DslAdapter.typeMap getter
   */
  entries(): IterableIterator<[string, TypeDefinition]> {
    const merged: Map<string, TypeDefinition> = new Map([...BUILTIN_TYPES, ...CUSTOM_TYPES])
    for (const [name, factory] of DYNAMIC_TYPES) {
      merged.set(name, { baseSchema: factory() as Partial<JSONSchema> })
    }
    return merged.entries()
  },

  /**
   * Return the internal key set (used to strip non-standard fields during toJsonSchema)
   */
  getInternalKeys(): ReadonlySet<string> {
    return INTERNAL_KEYS
  },

  /**
   * Strip internal keys from a schema and return a clean JSON Schema.
   *
   * Special case for exactLength: translated to standard minLength + maxLength
   * instead of being stripped. This preserves v1 DslBuilder string:N behavior
   * (output {minLength:N, maxLength:N}) while keeping AJV's exactLength Unicode
   * code-point counting advantage internally (CK-Y04).
   */
  toJsonSchema(schema: JSONSchema): JSONSchema {
    const strip = (value: unknown, seen: WeakMap<object, unknown>): unknown => {
      if (Array.isArray(value)) {
        const existing = seen.get(value)
        if (existing) return existing
        const result: unknown[] = []
        seen.set(value, result)
        for (const item of value) result.push(strip(item, seen))
        return result
      }

      if (!value || typeof value !== 'object') return value

      const existing = seen.get(value)
      if (existing) return existing

      const result: JSONSchema = {}
      seen.set(value, result)
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (k === 'exactLength' && typeof v === 'number') {
          // BC-compat: exactLength (AJV custom keyword) → standard JSON Schema minLength + maxLength
          result.minLength = v
          result.maxLength = v
        } else if (!INTERNAL_KEYS.has(k)) {
          result[k] = strip(v, seen)
        }
      }
      return result
    }

    return strip(cloneSchemaValue(schema), new WeakMap<object, unknown>()) as JSONSchema
  },
} as const
