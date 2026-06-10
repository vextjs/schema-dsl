import { Ajv } from 'ajv'
import type { ValidateFunction, KeywordDefinition, Format } from 'ajv'
import addFormats from 'ajv-formats'
import type { JSONSchema } from '../types/schema.js'
import type { ValidateOptions, ValidationResult, ValidationErrorItem } from '../types/validate.js'
import type { ErrorMessages } from '../types/error.js'
import { CacheManager } from './CacheManager.js'
import type { CacheStats } from './CacheManager.js'
import { ErrorFormatter } from './ErrorFormatter.js'
import { CustomKeywords } from '../validators/CustomKeywords.js'
import { Locale, DEFAULT_LOCALE } from './Locale.js'
import { ConditionalValidator, type ConditionalInternalSchema } from './ConditionalValidator.js'

// Non-AJV custom option keys (V-Y01 fix: filter before passing to new Ajv())
const NON_AJV_KEYS = new Set([
  'cache', 'smartCoerce', 'locale', 'messages', 'format',
  'strict',  // v2 redefines this as strictSchema; do not forward to AJV
])

// AJV ValidateFunction type
type AjvValidateFn = ValidateFunction
type KeywordDefinitionInput = KeywordDefinition | ({ keyword?: string;[key: string]: unknown })
type SchemaCacheKeyCarrier = JSONSchema & Record<symbol, unknown>

// Schema with _removeAdditional or _isConditional internal markers
type InternalSchema = JSONSchema & {
  _removeAdditional?: boolean
  _isConditional?: boolean
  _runtimeOnlyConditional?: boolean
} & ConditionalInternalSchema

// Performance: share empty array on valid path to avoid `{ errors: [] }` allocation every time
const EMPTY_ERRORS: ValidationErrorItem[] = []
const FLAT_LOCALE_CACHE_MAX_SIZE = 32

export const SCHEMA_DSL_CACHE_KEY = Symbol.for('schema-dsl.schemaCacheKey')

export function createSchemaCacheKey(schema: unknown): string | null {
  const serialized = stableStringify(schema, new WeakSet<object>())
  return serialized === null ? null : `schema:${serialized}`
}

function stableStringify(value: unknown, seen: WeakSet<object>): string | null {
  if (value === null) return 'null'

  switch (typeof value) {
    case 'string':
      return JSON.stringify(value)
    case 'number':
      return Number.isFinite(value) ? JSON.stringify(value) : null
    case 'boolean':
      return value ? 'true' : 'false'
    case 'object':
      break
    default:
      return null
  }

  if (Array.isArray(value)) {
    const items: string[] = []
    for (const item of value) {
      const serialized = stableStringify(item, seen)
      if (serialized === null) return null
      items.push(serialized)
    }
    return `[${items.join(',')}]`
  }

  const obj = value as Record<string, unknown>
  const proto = Object.getPrototypeOf(obj)
  if (proto !== Object.prototype && proto !== null) return null
  if (seen.has(obj)) return null

  seen.add(obj)
  const entries: string[] = []
  for (const key of Object.keys(obj).sort()) {
    const serialized = stableStringify(obj[key], seen)
    if (serialized === null) {
      seen.delete(obj)
      return null
    }
    entries.push(`${JSON.stringify(key)}:${serialized}`)
  }
  seen.delete(obj)

  return `{${entries.join(',')}}`
}

/**
 * ValidatorOptions — constructor options for Validator (extends AJV base options).
 */
export interface ValidatorOptions {
  allErrors?: boolean
  useDefaults?: boolean
  coerceTypes?: boolean | 'array'
  removeAdditional?: boolean | 'all' | 'failing'
  verbose?: boolean
  cache?: boolean | {
    maxSize?: number
    ttl?: number
    enabled?: boolean
    statsEnabled?: boolean
  }
  [key: string]: unknown
}

/**
 * Validator — AJV-backed validator (v2).
 *
 * Fixes:
 *   V-Y01: filter non-AJV options before new Ajv() to prevent unknown-option warnings
 *   V-02:  sync cleanSchema.required when conditional fields are removed (v1 missed this)
 *   V-Y03: _removeAdditional mode reuses cached internal Ajv instance (v1 created new Validator each time)
 *   V-Y07: static quickValidate reuses a singleton Ajv (v1 created new Ajv each time)
 */
export class Validator {
  private readonly _ajvOptions: Record<string, unknown>
  private readonly _ajv: InstanceType<typeof Ajv>
  private readonly _cache: CacheManager
  private readonly _errorFormatter: ErrorFormatter

  // WeakMap: schema object → unique cacheKey (avoids JSON.stringify)
  private readonly _schemaMap = new WeakMap<object, string>()
  private _schemaKeyCounter = 0
  private readonly _compiledSchemaRefs = new Map<string, JSONSchema>()
  private readonly _compiledSchemaLru = new Map<string, true>()
  private readonly _removeAdditionalCache = new Map<string, AjvValidateFn>()
  private readonly _removeAdditionalSchemaRefs = new Map<string, JSONSchema>()
  private readonly _removeAdditionalSchemaLru = new Map<string, true>()

  // Performance: cache whether a schema has any conditional fields (avoids traversing properties on every validation)
  private readonly _conditionalFlagCache = new WeakMap<object, boolean>()
  private readonly _conditionalValidator = new ConditionalValidator({
    validateSchema: <T>(schema: JSONSchema, data: T, options: ValidateOptions): ValidationResult<T> => this._validateInternal(schema, data, options),
    internalError: <T>(error: unknown, data: T): ValidationResult<T> => this._internalError(error, data),
  })

  // V-Y03 fix: cached removeAdditional Ajv instance (no longer new Validator each time)
  private _removeAdditionalAjv: InstanceType<typeof Ajv> | null = null

  // V-Y07 fix: static singleton Ajv
  private static _quickValidateAjv: InstanceType<typeof Ajv> | null = null

  constructor(options: ValidatorOptions = {}) {
    // V-Y01 fix: filter non-AJV options
    const ajvOptions: Record<string, unknown> = {
      allErrors: options.allErrors !== false,
      useDefaults: options.useDefaults !== false,
      coerceTypes: options.coerceTypes ?? false,
      removeAdditional: options.removeAdditional ?? false,
      verbose: true, // verbose mode: enables parentSchema access on error objects
    }

    // Forward remaining valid AJV options
    for (const [k, v] of Object.entries(options)) {
      if (!NON_AJV_KEYS.has(k) && !(k in ajvOptions)) {
        ajvOptions[k] = v
      }
    }

    this._ajvOptions = ajvOptions
    this._ajv = new Ajv(ajvOptions)
      ; (addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(this._ajv)
    CustomKeywords.registerAll(this._ajv)

    const cacheOpts = options.cache === false
      ? { enabled: false }
      : options.cache === true || options.cache == null
        ? {}
        : options.cache

    this._cache = new CacheManager({
      ...(cacheOpts.maxSize !== undefined ? { maxSize: cacheOpts.maxSize } : {}),
      ...(cacheOpts.ttl !== undefined ? { ttl: cacheOpts.ttl } : {}),
      ...(cacheOpts.enabled !== undefined ? { enabled: cacheOpts.enabled } : {}),
      ...(cacheOpts.statsEnabled !== undefined ? { statsEnabled: cacheOpts.statsEnabled } : {}),
    })

    this._errorFormatter = new ErrorFormatter()
  }

  get ajvOptions(): Record<string, unknown> {
    return this._ajvOptions
  }

  // ─── Public API ────────────────────────────────────────────────────────

  /**
   * Compile a schema → AJV validate function (with cache).
   */
  compile(schema: JSONSchema, cacheKey?: string | null): AjvValidateFn {
    const key = cacheKey || this._getSchemaCacheKey(schema)
    try {
      return this._compileWithManagedCache(schema, key)
    } catch (error) {
      throw new Error(`Schema compilation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Synchronous validation.
   */
  validate<T = unknown>(schema: JSONSchema | AjvValidateFn, data: T, options: ValidateOptions = {}): ValidationResult<T> {
    return this._validateInternal(schema, data, options)
  }

  /**
   * Async validation (throws ValidationError on failure).
   * V-Y02 fix: v1 validateAsync lacked smartCoerceTypes; v2 routes through _validateInternal uniformly.
   * BC-6 fix: validateAsync runs async custom validators (sync AJV pass skips async fn; this method runs the full set).
   */
  async validateAsync<T = unknown>(schema: JSONSchema | AjvValidateFn, data: T, options: ValidateOptions = {}): Promise<T> {
    // Resolve DslBuilder/ObjectDslBuilder duck type to raw schema (mirrors _validateInternal logic)
    // so _runCustomValidators can access schema._customValidators
    let resolvedSchema = schema as JSONSchema | AjvValidateFn
    if (typeof (schema as Record<string, unknown>)['toSchema'] === 'function') {
      const obj = schema as Record<string, unknown>
      resolvedSchema = (obj['toSchema'] as () => JSONSchema)()
    }

    const validationSchema =
      typeof resolvedSchema === 'function'
        ? resolvedSchema
        : this._stripCustomValidators(resolvedSchema)

    const result = this._validateInternal(validationSchema, data, options)
    if (!result.valid) {
      const { ValidationError } = await import('../errors/ValidationError.js')
      throw new ValidationError(result.errors ?? [], data)
    }

    // BC-6: run async custom validators (sync AJV pass skips Promise-returning validators)
    const customErr =
      typeof resolvedSchema === 'function'
        ? null
        : await this._runCustomValidators(resolvedSchema, result.data)
    if (customErr) {
      const { ValidationError } = await import('../errors/ValidationError.js')
      throw new ValidationError([customErr], data)
    }

    return result.data as T
  }

  /**
   * BC-6: run all validators in schema._customValidators (including async).
   * AJV's sync keyword skips Promise-returning validators; this method runs the complete set in validateAsync.
   * Returns the first failing ValidationErrorItem, or null if all pass.
   */
  private _stripCustomValidators(schema: JSONSchema): JSONSchema {
    const strip = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        let changed = false
        const next = value.map(item => {
          const stripped = strip(item)
          if (stripped !== item) changed = true
          return stripped
        })
        return changed ? next : value
      }

      if (!value || typeof value !== 'object') return value

      const source = value as Record<string, unknown>
      let changed = false
      const next: Record<string, unknown> = {}

      for (const [key, child] of Object.entries(source)) {
        if (key === '_customValidators') {
          changed = true
          continue
        }

        const stripped = strip(child)
        next[key] = stripped
        if (stripped !== child) changed = true
      }

      return changed ? next : value
    }

    return strip(schema) as JSONSchema
  }

  private async _runCustomValidators(schema: JSONSchema, data: unknown, path = ''): Promise<ValidationErrorItem | null> {
    const validators = (schema as Record<string, unknown>)['_customValidators'] as Array<(v: unknown) => unknown> | undefined
    if (validators?.length) {
      for (const fn of validators) {
        try {
          const result = await Promise.resolve(fn(data))
          if (result === false) {
            return {
              message: Locale.getMessageText('CUSTOM_VALIDATION_FAILED'),
              path,
              keyword: '_customValidators',
              params: {},
              field: path,
              type: '_customValidators',
            }
          }
          if (typeof result === 'string') {
            return {
              message: result,
              path,
              keyword: '_customValidators',
              params: {},
              field: path,
              type: '_customValidators',
            }
          }
          if (result !== null && typeof result === 'object' && (result as Record<string, unknown>)['error']) {
            const r = result as { error: unknown; message?: string }
            return {
              message: r.message ?? Locale.getMessageText('CUSTOM_VALIDATION_FAILED'),
              path,
              keyword: '_customValidators',
              params: {},
              field: path,
              type: '_customValidators',
            }
          }
        } catch (err) {
          return {
            message: err instanceof Error ? err.message : String(err),
            path,
            keyword: '_customValidators',
            params: {},
            field: path,
            type: '_customValidators',
          }
        }
      }
    }

    if (schema.properties && data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      for (const [key, childSchema] of Object.entries(schema.properties)) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) continue
        const childPath = path ? `${path}/${key}` : key
        const err = await this._runCustomValidators(childSchema, record[key], childPath)
        if (err) return err
      }
    }

    if (schema.items && Array.isArray(data)) {
      const itemSchemas = Array.isArray(schema.items) ? schema.items : null
      for (let i = 0; i < data.length; i++) {
        const childSchema = itemSchemas ? itemSchemas[i] : schema.items
        if (!childSchema || Array.isArray(childSchema)) continue
        const childPath = `${path}/${i}`.replace(/^\//, '')
        const err = await this._runCustomValidators(childSchema, data[i], childPath)
        if (err) return err
      }
    }

    return null
  }

  /**
   * Batch validation (compile once, reuse for each item).
   */
  validateBatch<T = unknown>(schema: JSONSchema, dataArray: T[]): ValidationResult<T>[] {
    if (!Array.isArray(dataArray)) throw new Error('Data must be an array')
    const cacheKey = this._generateCacheKey(schema)
    const validate = this.compile(schema, cacheKey)
    return dataArray.map(data => this.validate(validate, data))
  }

  /**
   * Add a custom keyword.
   */
  addKeyword(keyword: string, definition: KeywordDefinitionInput): this {
    try {
      this._ajv.addKeyword({
        ...definition,
        keyword,
      })
      return this
    } catch (error) {
      throw new Error(`Failed to add keyword '${keyword}': ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Add a custom format.
   */
  addFormat(name: string, validator: Format): this {
    this._ajv.addFormat(name, validator)
    return this
  }

  /**
   * Add a schema reference.
   */
  addSchema(uri: string, schema: JSONSchema): this {
    this._ajv.addSchema(schema, uri)
    return this
  }

  /**
   * Remove a schema reference.
   */
  removeSchema(uri: string): this {
    this._ajv.removeSchema(uri)
    return this
  }

  getAjv(): InstanceType<typeof Ajv> { return this._ajv }
  get cache(): CacheManager { return this._cache }
  clearCache(): void {
    this._cache.clear()
    this._releaseAllManagedSchemas(this._ajv, this._compiledSchemaRefs, this._compiledSchemaLru)
    if (this._removeAdditionalAjv) {
      this._releaseAllManagedSchemas(this._removeAdditionalAjv, this._removeAdditionalSchemaRefs, this._removeAdditionalSchemaLru, this._removeAdditionalCache)
      this._removeAdditionalAjv = null
    }
    this._flatLocaleCache.clear()
  }
  getCacheStats(): CacheStats { return this._cache.getStats() }

  // ─── Static Factory ────────────────────────────────────────────────────

  static create(options?: ValidatorOptions): Validator {
    return new Validator(options)
  }

  /**
   * Quick validate (V-Y07 fix: reuses singleton Ajv instead of creating new Ajv each time).
   */
  static quickValidate(schema: JSONSchema, data: unknown): boolean {
    if (!Validator._quickValidateAjv) {
      Validator._quickValidateAjv = new Ajv()
        ; (addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(Validator._quickValidateAjv)
      CustomKeywords.registerAll(Validator._quickValidateAjv)
    }
    try {
      return Validator._quickValidateAjv.validate(schema, data) as boolean
    } catch {
      return false
    }
  }

  // ─── Internal Implementation ───────────────────────────────────────────

  private _validateInternal<T>(
    schema: JSONSchema | AjvValidateFn,
    data: T,
    options: ValidateOptions = {}
  ): ValidationResult<T> {
    const shouldFormat = options.format !== false
    const locale = options.locale ?? Locale.getLocale()
    const messages = (options.messages ?? {}) as ErrorMessages

    // DslBuilder/ObjectDslBuilder/ConditionalBuilder duck type.
    // Builders are mutable, so their toSchema() result must be re-materialized on every call.
    if (typeof (schema as Record<string, unknown>)['toSchema'] === 'function') {
      const obj = schema as Record<string, unknown>
      schema = (obj['toSchema'] as () => JSONSchema)()
    }

    const internalSchema = schema as InternalSchema

    // ConditionalBuilder (top-level)
    if (internalSchema._isConditional) {
      return this._conditionalValidator.validateConditional(internalSchema, data as Record<string, unknown>, null, data, options)
    }

    // Object schema containing ConditionalBuilder properties (including arbitrary nesting depth)
    if (internalSchema.properties) {
      // Performance: cache conditional detection result to avoid traversing properties on every validation
      let hasConditionals = this._conditionalFlagCache.get(internalSchema as object)
      if (hasConditionals === undefined) {
        hasConditionals = this._conditionalValidator.hasAnyConditional(internalSchema)
        this._conditionalFlagCache.set(internalSchema as object, hasConditionals)
      }
      if (hasConditionals) {
        return this._conditionalValidator.validateWithConditionals(internalSchema, data, options)
      }
    }

    // V-Y03 fix: _removeAdditional reuses internal Ajv instance
    if (internalSchema._removeAdditional) {
      if (!this._removeAdditionalAjv) {
        this._removeAdditionalAjv = new Ajv({ ...this._ajvOptions, removeAdditional: true })
          ; (addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(this._removeAdditionalAjv)
        CustomKeywords.registerAll(this._removeAdditionalAjv)
      }

      const cleanSchema: JSONSchema = JSON.parse(JSON.stringify(schema)) as JSONSchema
      delete (cleanSchema as InternalSchema)._removeAdditional

      try {
        const cacheKey = this._getRemoveAdditionalCacheKey(cleanSchema)
        const validate = this._compileRemoveAdditionalSchema(cleanSchema, cacheKey)
        const valid = validate(data) as boolean
        if (valid) return { valid: true, data, errors: EMPTY_ERRORS }
        const fmtErrors = this._formatErrors(validate.errors ?? [], messages, locale, shouldFormat)
        return { valid: false, data, errors: fmtErrors, errorMessage: fmtErrors[0]?.message }
      } catch (error) {
        return this._internalError(error, data)
      }
    }

    try {
      let validate: AjvValidateFn
      if (typeof schema === 'function') {
        validate = schema as AjvValidateFn
      } else {
        const cacheKey = this._getSchemaCacheKey(schema)
        validate = this._compileWithManagedCache(schema, cacheKey)
      }

      const valid = validate(data) as boolean
      if (valid) return { valid: true, data, errors: EMPTY_ERRORS }
      const fmtErrors2 = this._formatErrors(validate.errors ?? [], messages, locale, shouldFormat)
      return { valid: false, data, errors: fmtErrors2, errorMessage: fmtErrors2[0]?.message }
    } catch (error) {
      return this._internalError(error, data)
    }
  }

  // ─── Helper methods ─────────────────────────────────────────────────────

  private _generateCacheKey(schema: object): string {
    return this._getSchemaCacheKey(schema as JSONSchema)
  }

  private _getSchemaCacheKey(schema: JSONSchema): string {
    const markedKey = (schema as SchemaCacheKeyCarrier)[SCHEMA_DSL_CACHE_KEY]
    if (typeof markedKey === 'string' && markedKey) return markedKey

    const structuralKey = createSchemaCacheKey(schema)
    if (structuralKey) return structuralKey

    const schemaObj = schema as object
    let cacheKey = this._schemaMap.get(schemaObj)
    if (!cacheKey) {
      cacheKey = `schema_${++this._schemaKeyCounter}`
      this._schemaMap.set(schemaObj, cacheKey)
    }
    return cacheKey
  }

  private _getRemoveAdditionalCacheKey(schema: JSONSchema): string {
    const structuralKey = createSchemaCacheKey(schema)
    if (structuralKey) return `removeAdditional:${structuralKey}`
    return `removeAdditional:${this._getSchemaCacheKey(schema)}`
  }

  private _compileWithManagedCache(schema: JSONSchema, cacheKey: string): AjvValidateFn {
    const cached = this._cache.get(cacheKey) as AjvValidateFn | null
    if (cached !== null) {
      this._touchManagedKey(this._compiledSchemaLru, cacheKey)
      return cached
    }

    return this._compileAndRememberSchema(this._ajv, schema, cacheKey, this._compiledSchemaRefs, this._compiledSchemaLru, this._cache)
  }

  private _compileRemoveAdditionalSchema(schema: JSONSchema, cacheKey: string): AjvValidateFn {
    const cached = this._removeAdditionalCache.get(cacheKey)
    if (cached) {
      this._touchManagedKey(this._removeAdditionalSchemaLru, cacheKey)
      return cached
    }

    return this._compileAndRememberSchema(
      this._removeAdditionalAjv!,
      schema,
      cacheKey,
      this._removeAdditionalSchemaRefs,
      this._removeAdditionalSchemaLru,
      undefined,
      this._removeAdditionalCache
    )
  }

  private _compileAndRememberSchema(
    ajv: InstanceType<typeof Ajv>,
    schema: JSONSchema,
    cacheKey: string,
    schemaRefs: Map<string, JSONSchema>,
    lru: Map<string, true>,
    cache?: CacheManager,
    values?: Map<string, AjvValidateFn>
  ): AjvValidateFn {
    if (!this._cache.options.enabled || this._cache.options.maxSize <= 0) {
      const validate = ajv.compile(schema)
      ajv.removeSchema(schema)
      return validate
    }

    if (schemaRefs.has(cacheKey)) {
      this._releaseManagedSchema(ajv, cacheKey, schemaRefs, lru, cache, values)
    }
    this._ensureManagedCapacity(ajv, schemaRefs, lru, cache, values)

    const validate = ajv.compile(schema)
    schemaRefs.set(cacheKey, schema)
    this._touchManagedKey(lru, cacheKey)

    if (cache) {
      cache.set(cacheKey, validate as unknown as object)
    }
    if (values) {
      values.set(cacheKey, validate)
    }

    return validate
  }

  private _ensureManagedCapacity(
    ajv: InstanceType<typeof Ajv>,
    schemaRefs: Map<string, JSONSchema>,
    lru: Map<string, true>,
    cache?: CacheManager,
    values?: Map<string, AjvValidateFn>
  ): void {
    const maxSize = this._cache.options.maxSize
    while (lru.size >= maxSize) {
      const oldestKey = lru.keys().next().value as string | undefined
      if (!oldestKey) return
      this._releaseManagedSchema(ajv, oldestKey, schemaRefs, lru, cache, values)
    }
  }

  private _releaseManagedSchema(
    ajv: InstanceType<typeof Ajv>,
    cacheKey: string,
    schemaRefs: Map<string, JSONSchema>,
    lru: Map<string, true>,
    cache?: CacheManager,
    values?: Map<string, AjvValidateFn>
  ): void {
    const schemaRef = schemaRefs.get(cacheKey)
    if (schemaRef) {
      try {
        ajv.removeSchema(schemaRef)
      } catch {
        // AJV may reject removal for already-pruned refs; cache bookkeeping still needs cleanup.
      }
    }
    schemaRefs.delete(cacheKey)
    lru.delete(cacheKey)
    cache?.delete(cacheKey)
    values?.delete(cacheKey)
  }

  private _releaseAllManagedSchemas(
    ajv: InstanceType<typeof Ajv>,
    schemaRefs: Map<string, JSONSchema>,
    lru: Map<string, true>,
    values?: Map<string, AjvValidateFn>
  ): void {
    for (const cacheKey of Array.from(schemaRefs.keys())) {
      this._releaseManagedSchema(ajv, cacheKey, schemaRefs, lru, undefined, values)
    }
    lru.clear()
    values?.clear()
  }

  private _touchManagedKey(lru: Map<string, true>, cacheKey: string): void {
    lru.delete(cacheKey)
    lru.set(cacheKey, true)
  }

  // Performance: cache flattened locale messages (key = locale, value = flat ErrorMessages)
  // to avoid re-running Locale.getMessages + Object.entries.map on every validation failure
  private readonly _flatLocaleCache = new Map<string, ErrorMessages>()
  private _flatLocaleCacheRevision = Locale.revision

  private _getFlatLocaleMessages(locale: string): ErrorMessages {
    if (this._flatLocaleCacheRevision !== Locale.revision) {
      this._flatLocaleCache.clear()
      this._flatLocaleCacheRevision = Locale.revision
    }

    const cacheKey = this._resolveLocaleCacheKey(locale)
    let flat = this._flatLocaleCache.get(cacheKey)
    if (!flat) {
      flat = this._flattenLocaleMessages(cacheKey)
      this._rememberFlatLocaleMessages(cacheKey, flat)
    } else {
      this._touchFlatLocaleKey(cacheKey, flat)
    }
    return flat
  }

  private _resolveLocaleCacheKey(locale: string): string {
    if (Locale.isSupportedLocale(locale) || this._hasCustomLocale(locale)) {
      return locale
    }
    return DEFAULT_LOCALE
  }

  private _hasCustomLocale(locale: string): boolean {
    return Object.keys(Locale.customMessages).some(key => key.startsWith(`${locale}:`))
  }

  private _flattenLocaleMessages(locale: string): ErrorMessages {
    const raw = Locale.getMessages(locale)
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [
        k,
        typeof v === 'string' ? v : (v as { message: string }).message,
      ])
    ) as ErrorMessages
  }

  private _rememberFlatLocaleMessages(locale: string, messages: ErrorMessages): void {
    while (this._flatLocaleCache.size >= FLAT_LOCALE_CACHE_MAX_SIZE) {
      const oldestKey = this._flatLocaleCache.keys().next().value as string | undefined
      if (!oldestKey) break
      this._flatLocaleCache.delete(oldestKey)
    }
    this._flatLocaleCache.set(locale, messages)
  }

  private _touchFlatLocaleKey(locale: string, messages: ErrorMessages): void {
    this._flatLocaleCache.delete(locale)
    this._flatLocaleCache.set(locale, messages)
  }

  private _formatErrors(
    rawErrors: unknown[],
    messages: ErrorMessages,
    locale: string,
    shouldFormat: boolean
  ): ValidationErrorItem[] {
    if (!shouldFormat) return rawErrors as ValidationErrorItem[]
    const localeMessages = this._getFlatLocaleMessages(locale)
    // Only merge when there are custom messages (avoid unnecessary object spread)
    const mergedMessages: ErrorMessages =
      Object.keys(messages).length === 0
        ? localeMessages
        : { ...localeMessages, ...messages }
    // alreadyMerged=true: mergedMessages already contains locale+custom, skip re-expansion inside formatDetailed
    return this._errorFormatter.formatDetailed(rawErrors as Parameters<ErrorFormatter['formatDetailed']>[0], locale, mergedMessages, true)
  }

  private _internalError<T>(error: unknown, data: T): ValidationResult<T> {
    const message = `Validation error: ${error instanceof Error ? error.message : String(error)}`
    return {
      valid: false,
      data,
      errors: [{ message, path: '', keyword: 'error', params: {} }],
      errorMessage: message,
    }
  }
}
