import type { JSONSchema } from '../types/schema.js'

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

/** Known internal key set (stripped from output during toJsonSchema) */
const INTERNAL_KEYS: ReadonlySet<string> = new Set([
  '_label',
  '_customMessages',
  '_description',
  '_required',
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
  ['boolean', { baseSchema: { type: 'boolean' } }],
  ['object', { baseSchema: { type: 'object' } }],
  ['array', { baseSchema: { type: 'array' } }],
  ['null', { baseSchema: { type: 'null' } }],
  ['any', { baseSchema: {} }],

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
  ['objectId', { baseSchema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }, customMessages: { pattern: 'pattern.objectId' } }],
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
])

/**
 * Custom type registry (populated via registerType)
 */
const CUSTOM_TYPES: Map<string, TypeDefinition> = new Map()
const DYNAMIC_TYPES: Map<string, () => JSONSchema> = new Map()

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
  resolve(typeName: string): TypeDefinition {
    // Dynamic types: call factory function each time
    const dynamicFn = DYNAMIC_TYPES.get(typeName)
    if (dynamicFn) {
      return { baseSchema: dynamicFn() as Partial<JSONSchema> }
    }

    const custom = CUSTOM_TYPES.get(typeName)
    if (custom) return custom

    const builtin = BUILTIN_TYPES.get(typeName)
    if (builtin) return builtin

    // Unknown type: warn and fall back to string
    console.warn(`[schema-dsl] Unknown type "${typeName}", falling back to string`)
    return { baseSchema: { type: 'string' } }
  },

  /**
   * Register a custom type (delegated from DslBuilder.registerType)
   */
  register(name: string, def: TypeDefinition | Partial<JSONSchema>): void {
    if (!name || typeof name !== 'string') {
      throw new Error('[schema-dsl] TypeRegistry.register: name must be a non-empty string')
    }
    // Accept a raw Partial<JSONSchema> and wrap it automatically
    const normalized: TypeDefinition =
      'baseSchema' in def ? (def as TypeDefinition) : { baseSchema: def as Partial<JSONSchema> }
    CUSTOM_TYPES.set(name, normalized)
  },

  /**
   * Register a dynamic type (factory function invoked on every resolve call)
   */
  registerDynamic(name: string, factory: () => JSONSchema): void {
    if (!name || typeof name !== 'string') {
      throw new Error('[schema-dsl] TypeRegistry.registerDynamic: name must be a non-empty string')
    }
    DYNAMIC_TYPES.set(name, factory)
  },

  /**
   * Unregister a custom type
   */
  unregister(name: string): void {
    CUSTOM_TYPES.delete(name)
    DYNAMIC_TYPES.delete(name)
  },

  /**
   * Check whether a type is registered (built-in or custom)
   */
  has(typeName: string): boolean {
    return BUILTIN_TYPES.has(typeName) || CUSTOM_TYPES.has(typeName) || DYNAMIC_TYPES.has(typeName)
  },

  /**
   * Return an iterator over all registered types (built-in + custom; custom overrides same-name built-in)
   * BC-4 compat: consumed by the DslAdapter.typeMap getter
   */
  entries(): IterableIterator<[string, TypeDefinition]> {
    const merged: Map<string, TypeDefinition> = new Map([...BUILTIN_TYPES, ...CUSTOM_TYPES])
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
    const result: JSONSchema = {}
    for (const [k, v] of Object.entries(schema)) {
      if (k === 'exactLength' && typeof v === 'number') {
        // BC-compat: exactLength (AJV custom keyword) → standard JSON Schema minLength + maxLength
        result.minLength = v
        result.maxLength = v
      } else if (!INTERNAL_KEYS.has(k)) {
        result[k] = v
      }
    }
    return result
  },
} as const
