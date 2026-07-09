/**
 * DslBuilder — chainable DSL builder.
 *
 * v2 changes:
 *   - Constructor delegates to DslParser.parseString() (fixes DA-01/DA-02/DA-03)
 *   - Custom type registration delegates to TypeRegistry (fixes DB-01/DB-02: unifies three type lists)
 *   - _customMessages merges instead of overwriting (fixes v1 overwrite bug)
 *   - Matches IDslBuilder structurally (error/optional/required/enum chain methods)
 */

import type { JSONSchema } from '../types/schema.js'
import type { DslDefinition, DslFactoryInput } from '../types/dsl.js'
import { DslParser, isRawJsonSchemaFactoryInput, type DslParseOptions } from '../parser/DslParser.js'
import { TypeRegistry } from '../parser/TypeRegistry.js'
import { PATTERNS } from '../config/patterns.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'
import { createSchemaRecord, setSchemaRecordValue } from '../utils/schemaRecord.js'
import { compileValidationPlan, type ValidationPlan } from './ValidationPlan.js'
import safeRegex from 'safe-regex'
import type { Validator as ValidatorInstance } from './Validator.js'
import type { ValidationResult } from '../types/validate.js'
import type { SchemaDslPatternRegistry } from '../types/runtime.js'

// ==================== Internal Utilities ====================

type CustomValidatorFn = (value: unknown) => unknown
type CustomTypeSchema = JSONSchema | (() => JSONSchema)
type JsonScalar = string | number | boolean | null

export interface DslBuilderOptions {
  parseOptions?: DslParseOptions
  patterns?: SchemaDslPatternRegistry
  validatorFactory?: () => ValidatorInstance | Promise<ValidatorInstance>
  validatorGuard?: () => void
  cacheValidator?: boolean
}

interface DslBuilderRuntimeState {
  customTypes: Map<string, CustomTypeSchema>
}

const DSL_BUILDER_STATE_KEY = Symbol.for('schema-dsl.v2.DslBuilder.state')
export const DSL_BUILDER_VALIDATION_SCHEMA = Symbol.for('schema-dsl.v2.DslBuilder.validationSchema')
export const DSL_BUILDER_VALIDATION_SIGNATURE = Symbol.for('schema-dsl.v2.DslBuilder.validationSignature')
export const DSL_BUILDER_FAST_VALIDATE = Symbol.for('schema-dsl.v2.DslBuilder.fastValidate')

function getRuntimeState(): DslBuilderRuntimeState {
  const host = globalThis as typeof globalThis & Record<symbol, DslBuilderRuntimeState | undefined>
  const existing = host[DSL_BUILDER_STATE_KEY]
  if (existing) return existing

  const state: DslBuilderRuntimeState = {
    customTypes: new Map(),
  }
  host[DSL_BUILDER_STATE_KEY] = state
  return state
}

/** Password strength presets. */
const PASSWORD_PATTERNS: Record<string, RegExp> = {
  weak: /.{6,}/,
  medium: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
  strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  veryStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{10,}$/,
}
const PASSWORD_MIN_LENGTHS: Record<string, number> = {
  weak: 6, medium: 8, strong: 8, veryStrong: 10,
}
const EMPTY_FAST_VALIDATION_ERRORS = Object.freeze([]) as []
const SIMPLE_DIRECT_FAST_SCHEMA_KEYS = new Set([
  '$id',
  '$schema',
  '$comment',
  'title',
  'description',
  'examples',
  '_label',
  '_description',
  '_required',
  '_customMessages',
  'type',
  'enum',
  'const',
])

function isJsonScalar(value: unknown): value is JsonScalar {
  return value === null || typeof value === 'string' || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
}

function isBuilderPrimitiveType(value: unknown): value is 'string' | 'number' | 'integer' | 'boolean' | 'null' {
  return value === 'string'
    || value === 'number'
    || value === 'integer'
    || value === 'boolean'
    || value === 'null'
}

function createBuilderPrimitiveTypePredicate(type: unknown): ((value: unknown) => boolean) | null {
  if (type === undefined) return null
  const values = Array.isArray(type) ? type : [type]
  if (values.length === 0 || !values.every(isBuilderPrimitiveType)) return null

  const acceptsString = values.includes('string')
  const acceptsNumber = values.includes('number')
  const acceptsInteger = values.includes('integer')
  const acceptsBoolean = values.includes('boolean')
  const acceptsNull = values.includes('null')

  return (value: unknown): boolean => {
    switch (typeof value) {
      case 'string':
        return acceptsString
      case 'number':
        return Number.isFinite(value) && (acceptsNumber || (acceptsInteger && Number.isInteger(value)))
      case 'boolean':
        return acceptsBoolean
      default:
        return value === null && acceptsNull
    }
  }
}

function createBuilderEnumPredicate(values: JsonScalar[]): (value: unknown) => boolean {
  switch (values.length) {
    case 0:
      return () => false
    case 1: {
      const first = values[0]
      return (value: unknown): boolean => value === first
    }
    case 2: {
      const first = values[0]
      const second = values[1]
      return (value: unknown): boolean => value === first || value === second
    }
    case 3: {
      const first = values[0]
      const second = values[1]
      const third = values[2]
      return (value: unknown): boolean => value === first || value === second || value === third
    }
    default: {
      const enumSet = new Set(values)
      return (value: unknown): boolean => enumSet.has(value as JsonScalar)
    }
  }
}

// ==================== DslBuilder ====================

export class DslBuilder {
  // Required IDslBuilder field
  readonly _isDslBuilder = true as const

  /** schema-dsl custom validation keyword set (stripped during toJsonSchema). */
  static readonly _internalKeys: ReadonlySet<string> = TypeRegistry.getInternalKeys()

  /** Custom type cache (BC with v1 DslBuilder._customTypes). */
  private static readonly _customTypes = getRuntimeState().customTypes

  private _baseSchema: JSONSchema
  /** v1 compatibility marker read by downstream schema converters such as vext. */
  _required: boolean
  /** v1 compatibility marker for nullable/optional field syntax. */
  _optional: boolean
  private _customMessages: Record<string, string>
  private _label: string | null
  private _description: string | null
  private _customValidators: CustomValidatorFn[]
  private _whenConditions: unknown[]
  private readonly _parseOptions: DslParseOptions | undefined
  private readonly _patterns: SchemaDslPatternRegistry
  private readonly _validatorFactory: (() => ValidatorInstance | Promise<ValidatorInstance>) | undefined
  private readonly _validatorGuard: (() => void) | undefined
  private readonly _cacheValidator: boolean
  private _schemaVersion = 0
  private _stateVersion = 0
  private _validationSchemaCache: JSONSchema | null = null
  private _validationSchemaSignature: string | null = null
  private _validationPlanCache: ValidationPlan | null = null
  private _validationFastPredicate: ((data: unknown) => boolean) | null = null
  private _validationPlanSchemaVersion = -1
  private _validationPlanStateVersion = -1
  private _validationPlanRequired = false
  private _validationPlanOptional = false

  // ==================== Constructor ====================

  constructor(dslString: string, options: DslBuilderOptions = {}) {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('[schema-dsl] DSL string is required')
    }

    let s = dslString.trim()

    // array!N-M special syntax (v1 compat) → array:N-M + required=true
    const arrayBangMatch = /^array!([\d-]+)$/.exec(s)
    if (arrayBangMatch) {
      s = `array:${arrayBangMatch[1]}`
      this._required = true
      this._optional = false
    } else {
      this._required = s.endsWith('!')
      this._optional = s.endsWith('?') && !this._required
      if (this._required || this._optional) s = s.slice(0, -1)
    }

    this._customMessages = {}
    this._label = null
    this._description = null
    this._customValidators = []
    this._whenConditions = []
    this._parseOptions = options.parseOptions
    this._patterns = options.patterns ?? (PATTERNS as SchemaDslPatternRegistry)
    this._validatorFactory = options.validatorFactory
    this._validatorGuard = options.validatorGuard
    this._cacheValidator = options.cacheValidator ?? true

    this._baseSchema = this._trackBaseSchema(DslBuilder._parseBody(s, this._parseOptions))
  }

  static fromSchema(schema: JSONSchema, options: DslBuilderOptions = {}): DslBuilder {
    const builder = new DslBuilder('any', options)
    const cloned = cloneSchemaValue(schema)
    const { _required, ...baseSchema } = cloned as JSONSchema & { _required?: boolean }
    builder._baseSchema = builder._trackBaseSchema(baseSchema)
    builder._required = _required === true
    builder._optional = false
    builder._markValidationSchemaDirty()
    return builder
  }

  private _markValidationSchemaDirty(): void {
    this._stateVersion += 1
    this._validationSchemaCache = null
    this._validationSchemaSignature = null
    this._validationPlanCache = null
    this._validationFastPredicate = null
    this._validationPlanSchemaVersion = -1
    this._validationPlanStateVersion = -1
  }

  private _trackBaseSchema(schema: JSONSchema): JSONSchema {
    return new Proxy(schema, {
      set: (target, property, value): boolean => {
        const record = target as Record<PropertyKey, unknown>
        if (record[property] !== value) {
          record[property] = value
          this._schemaVersion += 1
          this._markValidationSchemaDirty()
          return true
        }
        record[property] = value
        return true
      },
      deleteProperty: (target, property): boolean => {
        const record = target as Record<PropertyKey, unknown>
        if (property in record) {
          delete record[property]
          this._schemaVersion += 1
          this._markValidationSchemaDirty()
        }
        return true
      },
    })
  }

  // ==================== Internal Parsing ====================

  /**
   * Parse DSL body (without ! or ?).
   * Delegates to the unified parser so string and builder DSL parsing stay in lockstep.
   */
  private static _parseBody(dsl: string, options?: DslParseOptions): JSONSchema {
    return DslParser.parseString(dsl, options)
  }

  // ==================== Static Methods (BC with v1) ====================

  /**
   * Register a custom type (delegates to TypeRegistry).
   */
  static registerType(name: string, schema: JSONSchema | (() => JSONSchema)): void {
    if (!name || typeof name !== 'string') {
      throw new Error('[schema-dsl] Type name must be a non-empty string')
    }
    if (!schema || (typeof schema !== 'object' && typeof schema !== 'function')) {
      throw new Error('[schema-dsl] Schema must be an object or function')
    }
    DslBuilder._customTypes.set(name, schema)
    if (typeof schema === 'function') {
      // Store function as a dynamic type — resolved on each access
      TypeRegistry.registerDynamic(name, schema)
    } else {
      TypeRegistry.register(name, schema)
    }
  }

  /** Unregister a custom type from both DslBuilder and TypeRegistry. */
  static unregisterType(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('[schema-dsl] Type name must be a non-empty string')
    }
    TypeRegistry.unregister(name)
    DslBuilder._customTypes.delete(name)
  }

  /** Check whether a type is registered (built-in or custom). */
  static hasType(type: string): boolean {
    return TypeRegistry.has(type)
  }

  /** Get all registered custom type names. */
  static getCustomTypes(): string[] {
    return Array.from(DslBuilder._customTypes.keys())
  }

  /** Clear all custom types (primarily for testing). */
  static clearCustomTypes(): void {
    TypeRegistry.clearCustomTypes()
    DslBuilder._customTypes.clear()
  }

  /**
   * Validate schema nesting depth.
   * @param schema - JSON Schema to validate
   * @param maxDepth - maximum allowed depth (default 3)
   */
  static validateNestingDepth(
    schema: JSONSchema,
    maxDepth = 3,
  ): { valid: boolean; depth: number; path: string; message: string } {
    let maxFound = 0
    let deepestPath = ''

    function traverse(obj: JSONSchema, depth: number, path: string, isRoot: boolean): void {
      if (!isRoot && (obj.properties || obj.items)) {
        if (depth > maxFound) {
          maxFound = depth
          deepestPath = path
        }
      }
      if (obj.properties) {
        const nextDepth = depth + 1
        for (const key of Object.keys(obj.properties)) {
          traverse(
            (obj.properties as Record<string, JSONSchema>)[key],
            nextDepth,
            `${path}.${key}`.replace(/^\./, ''),
            false,
          )
        }
      }
      if (obj.items && !Array.isArray(obj.items)) {
        traverse(obj.items as JSONSchema, depth, `${path}[]`, false)
      }
    }

    traverse(schema, 0, '', true)

    return {
      valid: maxFound <= maxDepth,
      depth: maxFound,
      path: deepestPath,
      message:
        maxFound > maxDepth
          ? `Nesting depth ${maxFound} exceeds limit ${maxDepth}, path: ${deepestPath}`
          : `Nesting depth ${maxFound} is within the limit`,
    }
  }

  // ==================== Private Utilities ====================

  private _assertType(method: string, ...types: string[]): void {
    const t = this._baseSchema.type as string
    if (!types.includes(t)) {
      throw new Error(`[schema-dsl] ${method}() only applies to ${types.join('/')} type`)
    }
  }

  private _assertStringType(method: string): void {
    this._assertType(method, 'string')
  }

  private _assertNumberType(method: string): void {
    this._assertType(method, 'number', 'integer')
  }

  private _assertObjectType(method: string): void {
    this._assertType(method, 'object')
  }

  private _assertArrayType(method: string): void {
    this._assertType(method, 'array')
  }

  private _schemaFromFactoryInput(value: DslFactoryInput): JSONSchema {
    if (typeof value === 'string') {
      const options: DslBuilderOptions = {
        patterns: this._patterns,
        cacheValidator: this._cacheValidator,
      }
      if (this._parseOptions !== undefined) options.parseOptions = this._parseOptions
      if (this._validatorFactory !== undefined) options.validatorFactory = this._validatorFactory
      if (this._validatorGuard !== undefined) options.validatorGuard = this._validatorGuard
      return new DslBuilder(value, options).toSchema()
    }
    if (value && typeof value === 'object' && typeof (value as { toSchema?: unknown }).toSchema === 'function') {
      return ((value as { toSchema: () => JSONSchema }).toSchema())
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const objectValue = value as Record<string, unknown>
      if (!isRawJsonSchemaFactoryInput(objectValue)) {
        return DslParser.parseObject(value as DslDefinition, this._parseOptions)
      }
    }
    return cloneSchemaValue(value as JSONSchema)
  }

  private _schemaForNestedUse(value: DslFactoryInput): JSONSchema {
    const schema = this._schemaFromFactoryInput(value)
    const clean = (current: unknown): unknown => {
      if (Array.isArray(current)) {
        return current.map(item => clean(item))
      }
      if (!current || typeof current !== 'object') return current

      const { _required, ...rest } = current as JSONSchema & { _required?: boolean }
      void _required
      if (rest.properties) {
        const properties = createSchemaRecord<JSONSchema>()
        for (const [key, child] of Object.entries(rest.properties)) {
          setSchemaRecordValue(properties, key, clean(child) as JSONSchema)
        }
        rest.properties = properties
      }
      if (Array.isArray(rest.items)) {
        rest.items = rest.items.map(item => clean(item) as JSONSchema)
      } else if (rest.items) {
        rest.items = clean(rest.items) as JSONSchema
      }
      return rest
    }
    return clean(cloneSchemaValue(schema)) as JSONSchema
  }

  private _normalizeEnumValues(values: unknown[]): unknown[] {
    if (values.length === 1 && Array.isArray(values[0]) && this._baseSchema.type !== 'array') {
      return [...values[0]]
    }
    return values
  }

  private _assertEnumCompatible(values: unknown[]): void {
    if (values.length === 0) {
      throw new Error('[schema-dsl] enum() requires at least one value')
    }

    const t = this._baseSchema.type
    if (Array.isArray(t) || t === undefined) return

    const isCompatible = (value: unknown): boolean => {
      switch (t) {
        case 'string':
          return typeof value === 'string'
        case 'number':
          return typeof value === 'number' && Number.isFinite(value)
        case 'integer':
          return typeof value === 'number' && Number.isInteger(value)
        case 'boolean':
          return typeof value === 'boolean'
        case 'null':
          return value === null
        default:
          return true
      }
    }

    const invalidIndex = values.findIndex(value => !isCompatible(value))
    if (invalidIndex !== -1) {
      const invalid = values[invalidIndex]
      throw new Error(`[schema-dsl] enum() value ${JSON.stringify(invalid)} is not compatible with ${String(t)} schema`)
    }
  }

  // ==================== Common Chain Methods ====================

  /**
   * Set format.
   */
  format(fmt: string): this {
    this._baseSchema.format = fmt
    return this
  }

  /**
   * Add regex validation.
   */
  pattern(regex: RegExp | string, message?: string): this {
    const source = regex instanceof RegExp ? regex.source : regex
    if (!safeRegex(source)) {
      throw new Error(`[schema-dsl] Unsafe regex pattern rejected (potential ReDoS): ${source}`)
    }
    return this._setPattern(source, message)
  }

  /** Internal: set pattern without safe-regex check (used by built-in validators with pre-approved patterns). */
  private _setPattern(source: string, message?: string): this {
    this._baseSchema.pattern = source
    if (message) {
      this._customMessages['string.pattern'] = message
      this._markValidationSchemaDirty()
    }
    return this
  }

  /**
   * Custom error messages (IDslBuilder: error; BC alias: messages).
   */
  messages(msgs: Record<string, string>): this {
    Object.assign(this._customMessages, msgs)
    this._markValidationSchemaDirty()
    return this
  }

  /** IDslBuilder.error — alias for messages() */
  error(msgs: Record<string, string>): this {
    return this.messages(msgs)
  }

  /**
   * Set field label (used in error messages).
   */
  label(text: string): this {
    this._label = text
    this._markValidationSchemaDirty()
    return this
  }

  /**
   * Set description.
   */
  description(text: string): this {
    this._description = text
    this._markValidationSchemaDirty()
    return this
  }

  /**
   * Set default value.
   */
  default(value: unknown): this {
    this._baseSchema.default = value
    return this
  }

  /**
   * Set allowed enum values (IDslBuilder).
   */
  enum(...values: unknown[]): this {
    const normalizedValues = this._normalizeEnumValues(values)
    this._assertEnumCompatible(normalizedValues)
    this._baseSchema.enum = normalizedValues
    return this
  }

  /**
   * Mark field as optional.
   */
  optional(): this {
    this._required = false
    this._optional = true
    this._markValidationSchemaDirty()
    return this
  }

  /**
   * Mark field as required (preferred alias).
   */
  require(...args: never[]): this {
    if (args.length > 0) {
      throw new Error('[schema-dsl] require() on a field builder does not accept arguments; use dsl.if(...).require(field) for conditional requirements')
    }
    return this.required()
  }

  /**
   * Mark field as required.
   */
  required(): this {
    this._required = true
    this._optional = false
    this._markValidationSchemaDirty()
    return this
  }

  /**
   * Add a custom validator function.
   */
  custom(validatorFn: CustomValidatorFn): this {
    if (typeof validatorFn !== 'function') {
      throw new Error('[schema-dsl] Custom validator must be a function')
    }
    this._customValidators.push(validatorFn)
    this._markValidationSchemaDirty()
    return this
  }

  // ==================== String Chain Methods ====================

  /** String minimum length. */
  min(n: number): this {
    const t = this._baseSchema.type
    if (t === 'string') {
      this._baseSchema.minLength = n
    } else if (t === 'number' || t === 'integer') {
      this._baseSchema.minimum = n
    } else if (t === 'array') {
      this._baseSchema.minItems = n
    } else {
      this._assertType('min', 'string', 'number', 'integer', 'array')
    }
    return this
  }

  /** String maximum length. */
  max(n: number): this {
    const t = this._baseSchema.type
    if (t === 'string') {
      this._baseSchema.maxLength = n
    } else if (t === 'number' || t === 'integer') {
      this._baseSchema.maximum = n
    } else if (t === 'array') {
      this._baseSchema.maxItems = n
    } else {
      this._assertType('max', 'string', 'number', 'integer', 'array')
    }
    return this
  }

  /** String exact length (→ exactLength custom keyword). */
  length(n: number): this {
    this._assertStringType('length')
    this._baseSchema.exactLength = n
    return this
  }

  /** String: only alphanumeric characters allowed. */
  alphanum(): this {
    this._assertStringType('alphanum')
    this._baseSchema.alphanum = true
    return this
  }

  /** String: no leading/trailing whitespace. */
  trim(): this {
    this._assertStringType('trim')
    this._baseSchema.trim = true
    return this
  }

  /** String: must be lowercase. */
  lowercase(): this {
    this._assertStringType('lowercase')
    this._baseSchema.lowercase = true
    return this
  }

  /** String: must be uppercase. */
  uppercase(): this {
    this._assertStringType('uppercase')
    this._baseSchema.uppercase = true
    return this
  }

  /** String: must be a valid JSON string. */
  json(): this {
    this._assertStringType('json')
    this._baseSchema.jsonString = true
    return this
  }

  /** String date format validation. */
  dateFormat(fmt: string): this {
    this._assertStringType('dateFormat')
    this._baseSchema.dateFormat = fmt
    return this
  }

  /** String: must be after the given date. */
  after(date: string): this {
    this._assertStringType('after')
    this._baseSchema.dateGreater = date
    return this
  }

  /** String: must be before the given date. */
  before(date: string): this {
    this._assertStringType('before')
    this._baseSchema.dateLess = date
    return this
  }

  /** v1.0.2 alias: dateGreater. */
  dateGreater(date: string): this {
    this._assertStringType('dateGreater')
    this._baseSchema.dateGreater = date
    return this
  }

  /** v1.0.2 alias: dateLess. */
  dateLess(date: string): this {
    this._assertStringType('dateLess')
    this._baseSchema.dateLess = date
    return this
  }

  /** String slug format validation. */
  slug(): this {
    this._assertStringType('slug')
    this._baseSchema.pattern = '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    const existing = (this._baseSchema._customMessages as Record<string, string> | undefined) || {}
    this._baseSchema._customMessages = { ...existing, pattern: 'pattern.slug' }
    return this
  }

  /** String domain validation. */
  domain(): this {
    this._assertStringType('domain')
    const cfg = this._patterns.common?.domain
    if (!cfg) throw new Error('[schema-dsl] Unsupported common pattern: domain')
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /** String IP address validation (IPv4 or IPv6). */
  ip(): this {
    this._assertStringType('ip')
    const cfg = this._patterns.common?.ip
    if (!cfg) throw new Error('[schema-dsl] Unsupported common pattern: ip')
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /** String Base64 encoding validation. */
  base64(): this {
    this._assertStringType('base64')
    const cfg = this._patterns.common?.base64
    if (!cfg) throw new Error('[schema-dsl] Unsupported common pattern: base64')
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /** String JWT token validation. */
  jwt(): this {
    this._assertStringType('jwt')
    const cfg = this._patterns.common?.jwt
    if (!cfg) throw new Error('[schema-dsl] Unsupported common pattern: jwt')
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  // ==================== Identity / Pattern Chain Methods ====================

  /** Phone number validation. */
  phone(country = 'cn'): this {
    this._assertStringType('phone')
    const cfg = this._patterns.phone?.[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country: ${country}`)
    if (cfg.min !== undefined && !this._baseSchema.minLength) this._baseSchema.minLength = cfg.min
    if (cfg.max !== undefined && !this._baseSchema.maxLength) this._baseSchema.maxLength = cfg.max
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /** phone() alias (BC). */
  phoneNumber(country = 'cn'): this {
    return this.phone(country)
  }

  /** National ID (idCard) validation. */
  idCard(country = 'cn'): this {
    this._assertStringType('idCard')
    const lower = country.toLowerCase()
    const cfg = this._patterns.idCard?.[lower]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for idCard: ${country}`)
    if (cfg.min !== undefined && !this._baseSchema.minLength) this._baseSchema.minLength = cfg.min
    if (cfg.max !== undefined && !this._baseSchema.maxLength) this._baseSchema.maxLength = cfg.max
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /** URL slug validation. */
  slugChain(): this {
    this._assertStringType('slugChain')
    return this._setPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.source).messages({ pattern: 'pattern.slug' })
  }

  /** Credit card number validation. */
  creditCard(type = 'visa'): this {
    this._assertStringType('creditCard')
    const cfg = this._patterns.creditCard?.[type.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported credit card type: ${type}`)
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /** Vehicle license plate validation. */
  licensePlate(country = 'cn'): this {
    this._assertStringType('licensePlate')
    const cfg = this._patterns.licensePlate?.[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for licensePlate: ${country}`)
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /** Postal code validation. */
  postalCode(country = 'cn'): this {
    this._assertStringType('postalCode')
    const cfg = this._patterns.postalCode?.[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for postalCode: ${country}`)
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /** Passport number validation. */
  passport(country = 'cn'): this {
    this._assertStringType('passport')
    const cfg = this._patterns.passport?.[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for passport: ${country}`)
    return this._setPattern(cfg.pattern.source).messages({ pattern: cfg.key })
  }

  /**
   * Username validation.
   * @param preset - 'short'(3-16) | 'medium'(3-32) | 'long'(3-64) | 'N-M' | object
   */
  username(preset: string | { minLength?: number; maxLength?: number; allowUnderscore?: boolean; allowNumber?: boolean } = 'medium'): this {
    this._assertStringType('username')
    let minLength: number
    let maxLength: number
    let allowUnderscore = true
    let allowNumber = true

    if (typeof preset === 'string') {
      const rangeMatch = /^(\d+)-(\d+)$/.exec(preset)
      if (rangeMatch) {
        minLength = parseInt(rangeMatch[1], 10)
        maxLength = parseInt(rangeMatch[2], 10)
      } else {
        const presets: Record<string, { min: number; max: number }> = {
          short: { min: 3, max: 16 },
          medium: { min: 3, max: 32 },
          long: { min: 3, max: 64 },
        }
        const p = presets[preset] ?? presets['medium']
        minLength = p.min
        maxLength = p.max
      }
    } else {
      minLength = preset.minLength ?? 3
      maxLength = preset.maxLength ?? 32
      allowUnderscore = preset.allowUnderscore !== false
      allowNumber = preset.allowNumber !== false
    }

    if (!this._baseSchema.minLength) this._baseSchema.minLength = minLength
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = maxLength

    let pat = '^[a-zA-Z]'
    let tailChars = 'a-zA-Z'
    if (allowNumber) tailChars += '0-9'
    if (allowUnderscore) tailChars += '_'
    pat += `[${tailChars}]*$`

    return this._setPattern(pat).messages({ pattern: 'pattern.username' })
  }

  /**
   * Password strength validation.
   * @param strength - 'weak' | 'medium' | 'strong' | 'veryStrong'
   */
  password(strength = 'medium'): this {
    this._assertStringType('password')
    const pat = PASSWORD_PATTERNS[strength]
    if (!pat) throw new Error(`[schema-dsl] Invalid password strength: ${strength}`)
    if (!this._baseSchema.minLength) this._baseSchema.minLength = PASSWORD_MIN_LENGTHS[strength]
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = 64
    return this._setPattern(pat.source).messages({ pattern: `pattern.password.${strength}` })
  }

  // ==================== Number Chain Methods ====================

  /** Number decimal places limit. */
  precision(n: number): this {
    this._assertNumberType('precision')
    if (!Number.isInteger(n) || n < 0) {
      throw new Error('[schema-dsl] precision() requires a non-negative integer')
    }
    this._baseSchema.precision = n
    return this
  }

  /** Number multiple-of validation (standard JSON Schema multipleOf). */
  multiple(n: number): this {
    this._assertNumberType('multiple')
    this._baseSchema.multipleOf = n
    return this
  }

  /** Number port validation (1–65535). */
  port(): this {
    this._assertNumberType('port')
    this._baseSchema.port = true
    return this
  }

  // ==================== Object Chain Methods ====================

  /** Object: all defined properties are required. */
  requireAll(): this {
    this._assertObjectType('requireAll')
    this._baseSchema.requiredAll = true
    return this
  }

  /** Object strict mode: no additional properties allowed. */
  strict(): this {
    this._assertObjectType('strict')
    this._baseSchema.strictSchema = true
    return this
  }

  // ==================== Array Chain Methods ====================

  /** Array: sparse arrays are not allowed. */
  noSparse(): this {
    this._assertArrayType('noSparse')
    this._baseSchema.noSparse = true
    return this
  }

  /** Array: must contain the specified element. */
  includesRequired(items: unknown[]): this {
    this._assertArrayType('includesRequired')
    if (!Array.isArray(items)) {
      throw new Error('[schema-dsl] includesRequired() requires an array parameter')
    }
    this._baseSchema.includesRequired = items
    return this
  }

  /** Array: set item schema. */
  items(item: DslFactoryInput): this {
    this._assertArrayType('items')
    this._baseSchema.items = this._schemaForNestedUse(item)
    return this
  }

  // ==================== Output Methods ====================

  /**
   * Convert to a schema with schema-dsl internal fields (for use by Validator).
   */
  toSchema(): JSONSchema {
    const schema: JSONSchema = cloneSchemaValue(this._baseSchema)

    if (this._description) {
      schema.description = this._description
    }

    // Merge _customMessages: base type messages + user custom messages (user takes priority)
    const baseCustomMsgs = (schema._customMessages as Record<string, string> | undefined) || {}
    const mergedMsgs = { ...baseCustomMsgs, ...this._customMessages }
    if (Object.keys(mergedMsgs).length > 0) {
      schema._customMessages = mergedMsgs
    } else {
      delete (schema as Record<string, unknown>)['_customMessages']
    }

    if (this._label) {
      schema._label = this._label
    }

    if (this._customValidators.length > 0) {
      schema._customValidators = [...this._customValidators] as unknown[]
    }

    if (this._whenConditions.length > 0) {
      schema._whenConditions = cloneSchemaValue(this._whenConditions)
    }

    // Always output _required (BC with v1: output even when false)
    schema._required = this._required

    return schema
  }

  [DSL_BUILDER_VALIDATION_SCHEMA](): JSONSchema {
    const signature = this._getValidationSchemaSignature()
    if (this._validationSchemaCache && this._validationSchemaSignature === signature) {
      return this._validationSchemaCache
    }

    const schema = this.toSchema()
    this._attachValidationSchemaSignature(schema, signature)
    this._validationSchemaCache = schema
    this._validationSchemaSignature = signature
    return schema
  }

  [DSL_BUILDER_FAST_VALIDATE](data: unknown): ValidationResult<unknown> | null {
    if (this._validationPlanSchemaVersion !== this._schemaVersion
      || this._validationPlanStateVersion !== this._stateVersion
      || this._validationPlanRequired !== this._required
      || this._validationPlanOptional !== this._optional) {
      this._validationPlanCache = null
      this._validationFastPredicate = this._tryCreateSimpleDirectFastPredicate()
      if (!this._validationFastPredicate) {
        const signature = this._getValidationSchemaSignature()
        const schema = this[DSL_BUILDER_VALIDATION_SCHEMA]()
        const result = compileValidationPlan(schema, {
          cacheKey: `builder:${signature}`,
          ajvOptions: { coerceTypes: false, removeAdditional: false },
        })
        this._validationPlanCache = result.status === 'compiled' ? result.plan : null
        this._validationFastPredicate = this._validationPlanCache?.validate ?? null
      }
      this._validationPlanSchemaVersion = this._schemaVersion
      this._validationPlanStateVersion = this._stateVersion
      this._validationPlanRequired = this._required
      this._validationPlanOptional = this._optional
    }

    return this._validationFastPredicate?.(data)
      ? { valid: true, data, errors: EMPTY_FAST_VALIDATION_ERRORS }
      : null
  }

  private _tryCreateSimpleDirectFastPredicate(): ((data: unknown) => boolean) | null {
    if (this._customValidators.length > 0 || this._whenConditions.length > 0) return null

    const source = this._baseSchema as Record<string, unknown>
    for (const key of Object.keys(source)) {
      if (!SIMPLE_DIRECT_FAST_SCHEMA_KEYS.has(key)) return null
    }

    const typePredicate = createBuilderPrimitiveTypePredicate(source['type'])
    if (source['type'] !== undefined && !typePredicate) return null

    const enumValues = source['enum']
    let enumPredicate: ((value: unknown) => boolean) | null = null
    if (enumValues !== undefined) {
      if (!Array.isArray(enumValues) || !enumValues.every(isJsonScalar)) return null
      enumPredicate = createBuilderEnumPredicate(enumValues as JsonScalar[])
    }

    const hasConst = Object.prototype.hasOwnProperty.call(source, 'const')
    const constValue = source['const']
    if (hasConst && !isJsonScalar(constValue)) return null
    if (!typePredicate && !enumPredicate && !hasConst) return null
    if (!typePredicate && enumPredicate && !hasConst) return enumPredicate
    if (typePredicate && !enumPredicate && !hasConst) return typePredicate

    return (value: unknown): boolean => {
      if (typePredicate && !typePredicate(value)) return false
      if (enumPredicate && !enumPredicate(value)) return false
      if (hasConst && value !== constValue) return false
      return true
    }
  }

  private _attachValidationSchemaSignature(schema: JSONSchema, signature: string): void {
    Object.defineProperty(schema, DSL_BUILDER_VALIDATION_SIGNATURE, {
      value: signature,
      enumerable: false,
      configurable: true,
    })
  }

  private _getValidationSchemaSignature(): string {
    return `${this._schemaVersion}|${this._stateVersion}|${this._required ? 1 : 0}|${this._optional ? 1 : 0}`
  }

  /**
   * Output a clean JSON Schema (strips all schema-dsl internal fields and custom keywords).
   * Can be embedded directly in OpenAPI / standard JSON Schema documents.
   */
  toJsonSchema(): JSONSchema {
    return TypeRegistry.toJsonSchema(this.toSchema())
  }

  toString(): string {
    return JSON.stringify(this.toJsonSchema())
  }

  /**
   * Validate data (BC with v1).
   * @param data - data to validate
   */
  private _validator: ValidatorInstance | null = null

  async validate(data: unknown): Promise<ValidationResult<unknown>> {
    this._validatorGuard?.()
    let validator = this._validator
    if (!validator || !this._cacheValidator) {
      if (this._validatorFactory) {
        validator = await this._validatorFactory()
      } else {
        const { Validator } = await import('./Validator.js')
        validator = new Validator()
      }
      if (this._cacheValidator) this._validator = validator
    }
    const schema = this.toSchema()
    return validator.validate(schema, data)
  }
}
