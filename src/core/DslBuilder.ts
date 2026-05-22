/**
 * DslBuilder — chainable DSL builder.
 *
 * v2 changes:
 *   - Constructor delegates to DslParser.parseString() (fixes DA-01/DA-02/DA-03)
 *   - Custom type registration delegates to TypeRegistry (fixes DB-01/DB-02: unifies three type lists)
 *   - _customMessages merges instead of overwriting (fixes v1 overwrite bug)
 *   - Implements IDslBuilder interface (error/optional/required/enum chain methods)
 */

import type { JSONSchema } from '../types/schema.js'
import type { IDslBuilder } from '../types/dsl.js'
import { DslParser } from '../parser/DslParser.js'
import { TypeRegistry } from '../parser/TypeRegistry.js'
import { PATTERNS } from '../config/patterns.js'
import type { Validator as ValidatorInstance } from './Validator.js'
import type { ValidationResult } from '../types/validate.js'

// ==================== Internal Utilities ====================

type CustomValidatorFn = (value: unknown) => unknown

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

// ==================== DslBuilder ====================

export class DslBuilder implements IDslBuilder {
  // Required IDslBuilder field
  readonly _isDslBuilder = true as const

  /** schema-dsl custom validation keyword set (stripped during toJsonSchema). */
  static readonly _internalKeys: ReadonlySet<string> = TypeRegistry.getInternalKeys()

  /** Custom type cache (BC with v1 DslBuilder._customTypes). */
  private static readonly _customTypes = new Map<string, JSONSchema | (() => JSONSchema)>()

  private _baseSchema: JSONSchema
  private _required: boolean
  private _optional: boolean
  private _customMessages: Record<string, string>
  private _label: string | null
  private _description: string | null
  private _customValidators: CustomValidatorFn[]
  private _whenConditions: unknown[]

  // ==================== Constructor ====================

  constructor(dslString: string) {
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

    this._baseSchema = DslBuilder._parseBody(s)
  }

  // ==================== Internal Parsing ====================

  /**
   * Parse DSL body (without ! or ?).
   * Delegates to the unified parser so string and builder DSL parsing stay in lockstep.
   */
  private static _parseBody(dsl: string): JSONSchema {
    return DslParser.parseString(dsl)
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
    this._baseSchema.pattern = regex instanceof RegExp ? regex.source : regex
    if (message) {
      this._customMessages['string.pattern'] = message
    }
    return this
  }

  /**
   * Custom error messages (IDslBuilder: error; BC alias: messages).
   */
  messages(msgs: Record<string, string>): this {
    Object.assign(this._customMessages, msgs)
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
    return this
  }

  /**
   * Set description.
   */
  description(text: string): this {
    this._description = text
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
    this._baseSchema.enum = values
    return this
  }

  /**
   * Mark field as optional.
   */
  optional(): this {
    this._required = false
    this._optional = true
    return this
  }

  /**
   * Mark field as required.
   */
  required(): this {
    this._required = true
    this._optional = false
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
    return this
  }

  // ==================== String Chain Methods ====================

  /** String minimum length. */
  min(n: number): this {
    this._assertStringType('min')
    this._baseSchema.minLength = n
    return this
  }

  /** String maximum length. */
  max(n: number): this {
    this._assertStringType('max')
    this._baseSchema.maxLength = n
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
    const cfg = PATTERNS.common.domain
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** String IP address validation (IPv4 or IPv6). */
  ip(): this {
    this._assertStringType('ip')
    const cfg = PATTERNS.common.ip
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** String Base64 encoding validation. */
  base64(): this {
    this._assertStringType('base64')
    const cfg = PATTERNS.common.base64
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** String JWT token validation. */
  jwt(): this {
    this._assertStringType('jwt')
    const cfg = PATTERNS.common.jwt
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  // ==================== Identity / Pattern Chain Methods ====================

  /** Phone number validation (auto-corrects number → string). */
  phone(country = 'cn'): this {
    // Auto-correct type
    if (this._baseSchema.type === 'number' || this._baseSchema.type === 'integer') {
      this._baseSchema.type = 'string'
      delete (this._baseSchema as Record<string, unknown>)['minimum']
      delete (this._baseSchema as Record<string, unknown>)['maximum']
    }
    const cfg = PATTERNS.phone[country]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country: ${country}`)
    if (cfg.min !== undefined && !this._baseSchema.minLength) this._baseSchema.minLength = cfg.min
    if (cfg.max !== undefined && !this._baseSchema.maxLength) this._baseSchema.maxLength = cfg.max
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** phone() alias (BC). */
  phoneNumber(country = 'cn'): this {
    return this.phone(country)
  }

  /** National ID (idCard) validation. */
  idCard(country = 'cn'): this {
    const lower = country.toLowerCase()
    const cfg = PATTERNS.idCard[lower]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for idCard: ${country}`)
    if (cfg.min !== undefined && !this._baseSchema.minLength) this._baseSchema.minLength = cfg.min
    if (cfg.max !== undefined && !this._baseSchema.maxLength) this._baseSchema.maxLength = cfg.max
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** URL slug validation. */
  slugChain(): this {
    return this.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).messages({ pattern: 'pattern.slug' })
  }

  /** Credit card number validation. */
  creditCard(type = 'visa'): this {
    const cfg = PATTERNS.creditCard[type.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported credit card type: ${type}`)
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** Vehicle license plate validation. */
  licensePlate(country = 'cn'): this {
    const cfg = PATTERNS.licensePlate[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for licensePlate: ${country}`)
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** Postal code validation. */
  postalCode(country = 'cn'): this {
    const cfg = PATTERNS.postalCode[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for postalCode: ${country}`)
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** Passport number validation. */
  passport(country = 'cn'): this {
    const cfg = PATTERNS.passport[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for passport: ${country}`)
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /**
   * Username validation.
   * @param preset - 'short'(3-16) | 'medium'(3-32) | 'long'(3-64) | 'N-M' | object
   */
  username(preset: string | { minLength?: number; maxLength?: number; allowUnderscore?: boolean; allowNumber?: boolean } = 'medium'): this {
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
    if (allowUnderscore && allowNumber) {
      pat += '[a-zA-Z0-9_]*$'
    } else if (allowNumber) {
      pat += '[a-zA-Z0-9]*$'
    } else {
      pat += '[a-zA-Z]*$'
    }

    return this.pattern(new RegExp(pat)).messages({ pattern: 'pattern.username' })
  }

  /**
   * Password strength validation.
   * @param strength - 'weak' | 'medium' | 'strong' | 'veryStrong'
   */
  password(strength = 'medium'): this {
    const pat = PASSWORD_PATTERNS[strength]
    if (!pat) throw new Error(`[schema-dsl] Invalid password strength: ${strength}`)
    if (!this._baseSchema.minLength) this._baseSchema.minLength = PASSWORD_MIN_LENGTHS[strength]
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = 64
    return this.pattern(pat).messages({ pattern: `pattern.password.${strength}` })
  }

  // ==================== Number Chain Methods ====================

  /** Number decimal places limit. */
  precision(n: number): this {
    this._assertNumberType('precision')
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

  // ==================== Output Methods ====================

  /**
   * Convert to a schema with schema-dsl internal fields (for use by Validator).
   */
  toSchema(): JSONSchema {
    const schema: JSONSchema = { ...this._baseSchema }

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
      schema._customValidators = this._customValidators as unknown[]
    }

    if (this._whenConditions.length > 0) {
      schema._whenConditions = this._whenConditions
    }

    // Always output _required (BC with v1: output even when false)
    schema._required = this._required

    return schema
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
    if (!this._validator) {
      const { Validator } = await import('./Validator.js')
      this._validator = new Validator()
    }
    const schema = this.toSchema()
    return this._validator.validate(schema, data)
  }
}
