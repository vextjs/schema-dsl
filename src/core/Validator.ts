import { Ajv } from 'ajv'
import type { ValidateFunction, KeywordDefinition, Format } from 'ajv'
import addFormats from 'ajv-formats'
import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'
import type { ValidateOptions, ValidationResult, ValidationErrorItem } from '../types/validate.js'
import type { ErrorMessages } from '../types/error.js'
import type { DslDefinition } from '../types/dsl.js'
import { CacheManager } from './CacheManager.js'
import type { CacheStats } from './CacheManager.js'
import { ErrorFormatter } from './ErrorFormatter.js'
import { CustomKeywords } from '../validators/CustomKeywords.js'
import { Locale, DEFAULT_LOCALE } from './Locale.js'
import { ConditionalValidator, type ConditionalInternalSchema } from './ConditionalValidator.js'
import { CONDITIONAL_RUNTIME_STATE, type ConditionalRuntimeState } from './ConditionalRuntime.js'
import { DslParser, type DslParseOptions } from '../parser/DslParser.js'
import type { RuntimeIssueSource } from './RuntimeIssueFormatter.js'
import { SchemaCompileError } from '../errors/SchemaCompileError.js'
import { CACHE } from '../config/constants.js'
import { createSchemaRecord, setSchemaRecordValue } from '../utils/schemaRecord.js'
import {
  SchemaRuntimeMetadataStore,
  applySmartCoerce,
  getSchemaCoerceCandidates,
  type SchemaRuntimeMetadata,
} from './SchemaRuntimeMetadataStore.js'
import {
  compileValidationPlan,
  type ValidationPlan,
  type ValidationPlanUnsupportedReason,
} from './ValidationPlan.js'
import { createJsonSchemaIR } from './ir/JsonSchemaToIR.js'
import { createExecutionPlanProjection } from './ir/RuntimeMetadataToIR.js'
import type { SchemaIRProjection } from '../types/ir.js'

// Non-AJV custom option keys (V-Y01 fix: filter before passing to new Ajv())
const NON_AJV_KEYS = new Set([
  'cache', 'smartCoerce', 'locale', 'messages', 'format', 'messageProvider',
  'messageResolver', 'messageTableProvider', 'parseOptions', 'quickValidate',
  '__schemaDslPreCoerced',
  'strict',  // v2 redefines this as strictSchema; do not forward to AJV
])

// AJV ValidateFunction type
type AjvValidateFn = ValidateFunction
type KeywordDefinitionInput = KeywordDefinition | ({ keyword?: string;[key: string]: unknown })
type SchemaCacheKeyCarrier = JSONSchema & Record<symbol, unknown>
type ErrorFormatContext = {
  shouldFormat: boolean
  locale: string
  messages: ErrorMessages
}
type ValidationPlanCacheEntry = {
  plan: ValidationPlan | null
  reason: ValidationPlanUnsupportedReason | null
}
type AsyncFastValidationResult<T> =
  | { status: 'valid'; data: T }
  | { status: 'fallback' }

// Schema with _removeAdditional or _isConditional internal markers
type InternalSchema = JSONSchema & {
  _removeAdditional?: boolean
  _isConditional?: boolean
  _runtimeOnlyConditional?: boolean
} & ConditionalInternalSchema

// Performance: share empty array on valid path to avoid `{ errors: [] }` allocation every time
const EMPTY_ERRORS: ValidationErrorItem[] = []
const EMPTY_VALIDATE_OPTIONS = Object.freeze({}) as ValidateOptions
const FLAT_LOCALE_CACHE_MAX_SIZE = 32
const QUICK_VALIDATE_CACHE_MAX_SIZE = CACHE.SCHEMA_CACHE.MAX_SIZE
const AJV_SKIPPED_PROPERTY_NAMES = ['__proto__'] as const

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
  messageResolver?: ValidatorMessageResolver
  messageTableProvider?: ValidatorMessageTableProvider
  parseOptions?: DslParseOptions
  quickValidate?: (schema: JSONSchemaInput, data: unknown) => boolean
  [key: string]: unknown
}

export type ValidatorMessageResolver = (
  key: string,
  params: Record<string, unknown>,
  options: ValidateOptions,
  source: RuntimeIssueSource
) => string

export type ValidatorMessageTableProvider = (
  options: ValidateOptions,
  locale: string
) => ErrorMessages

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
  private readonly _smartCoerceEnabled: boolean
  private readonly _messageResolver: ValidatorMessageResolver | undefined
  private readonly _messageTableProvider: ValidatorMessageTableProvider | undefined
  private readonly _parseOptions: DslParseOptions | undefined
  private readonly _quickValidate: (schema: JSONSchemaInput, data: unknown) => boolean
  private _activeValidateOptions: ValidateOptions | null = null

  // WeakMap: schema object → unique cacheKey (avoids JSON.stringify)
  private readonly _schemaMap = new WeakMap<object, string>()
  private _schemaKeyCounter = 0
  private readonly _compiledSchemaRefs = new Map<string, JSONSchemaInput>()
  private readonly _compiledSchemaLru = new Map<string, true>()
  private readonly _removeAdditionalCache = new Map<string, AjvValidateFn>()
  private readonly _removeAdditionalSchemaRefs = new Map<string, JSONSchemaInput>()
  private readonly _removeAdditionalSchemaLru = new Map<string, true>()
  private readonly _patternMatcherCache = new Map<string, RegExp | null>()
  private readonly _metadataStore = new SchemaRuntimeMetadataStore()
  private readonly _validationPlanCache = new Map<string, ValidationPlanCacheEntry>()

  private readonly _conditionalValidator = new ConditionalValidator({
    validateSchema: <T>(schema: JSONSchemaInput, data: T, options: ValidateOptions): ValidationResult<T> => this._validateInternal(schema, data, options),
    internalError: <T>(error: unknown, data: T): ValidationResult<T> => this._internalError(error, data),
    getMessageText: (key: string, params: Record<string, unknown>, options: ValidateOptions): string =>
      this._getMessageText(key, params, options, 'conditional'),
    parseString: (dsl: string): JSONSchema => DslParser.parseString(dsl, this._parseOptions),
    parseObject: (dsl: DslDefinition): JSONSchema => DslParser.parseObject(dsl, this._parseOptions),
    getPatternCacheMaxSize: (): number => this._cache.options.enabled ? this._cache.options.maxSize : 0,
  })

  // V-Y03 fix: cached removeAdditional Ajv instance (no longer new Validator each time)
  private _removeAdditionalAjv: InstanceType<typeof Ajv> | null = null

  // V-Y07 fix: static singleton Ajv
  private static _quickValidateAjv: InstanceType<typeof Ajv> | null = null
  private static _quickValidateSchemaMap = new WeakMap<object, string>()
  private static _quickValidateSchemaKeyCounter = 0
  private static _quickValidateCacheMaxSize = QUICK_VALIDATE_CACHE_MAX_SIZE
  private static readonly _quickValidateSchemaRefs = new Map<string, JSONSchemaInput>()
  private static readonly _quickValidateSchemaLru = new Map<string, true>()

  constructor(options: ValidatorOptions = {}) {
    // V-Y01 fix: filter non-AJV options
    const ajvOptions: Record<string, unknown> = {
      allErrors: options.allErrors !== false,
      useDefaults: options.useDefaults !== false,
      coerceTypes: options.coerceTypes === true || options.coerceTypes === 'array' ? options.coerceTypes : false,
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
    this._smartCoerceEnabled = options.coerceTypes !== false && options.smartCoerce !== false
    this._messageResolver = options.messageResolver
    this._messageTableProvider = options.messageTableProvider
    this._parseOptions = options.parseOptions
    this._quickValidate = options.quickValidate ?? Validator.quickValidate
    this._ajv = new Ajv(ajvOptions)
      ; (addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(this._ajv)
    CustomKeywords.registerAll(this._ajv, {
      getMessageText: (key, params) =>
        this._getMessageText(key, params ?? {}, this._activeValidateOptions ?? {}, 'customKeyword'),
    })

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
  compile(schema: JSONSchemaInput, cacheKey?: string | null): AjvValidateFn {
    const key = cacheKey || this._getSchemaCacheKey(schema)
    try {
      return this._compileWithManagedCache(schema, key)
    } catch (error) {
      throw new SchemaCompileError(error, schema)
    }
  }

  /**
   * Synchronous validation.
   */
  validate<T = unknown>(schema: JSONSchemaInput | AjvValidateFn, data: T, options: ValidateOptions = EMPTY_VALIDATE_OPTIONS): ValidationResult<T> {
    return this._validateInternal(schema, data, options)
  }

  /**
   * Async validation (throws ValidationError on failure).
   * V-Y02 fix: v1 validateAsync lacked smartCoerceTypes; v2 routes through _validateInternal uniformly.
   * BC-6 fix: validateAsync runs async custom validators (sync AJV pass skips async fn; this method runs the full set).
   */
  async validateAsync<T = unknown>(schema: JSONSchemaInput | AjvValidateFn, data: T, options: ValidateOptions = EMPTY_VALIDATE_OPTIONS): Promise<T> {
    // Resolve DslBuilder/ObjectDslBuilder duck type to raw schema (mirrors _validateInternal logic)
    // so _runCustomValidators can access schema._customValidators
    let resolvedSchema = schema as JSONSchema | AjvValidateFn
    if (typeof (schema as Record<string, unknown>)['toSchema'] === 'function') {
      const obj = schema as Record<string, unknown>
      resolvedSchema = (obj['toSchema'] as () => JSONSchema)()
    }

    if (typeof resolvedSchema !== 'function') {
      const fastResult = await this._tryValidateAsyncFastPath(resolvedSchema, data, options)
      if (fastResult.status === 'valid') return fastResult.data as T
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
        : await this._runCustomValidators(resolvedSchema, result.data, '', options, resolvedSchema)
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
  private _stripCustomValidators(schema: JSONSchemaInput): JSONSchemaInput {
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
      const runtimeState = (source as { [CONDITIONAL_RUNTIME_STATE]?: ConditionalRuntimeState })[CONDITIONAL_RUNTIME_STATE]
      let changed = false
      const next = createSchemaRecord<unknown>()

      for (const [key, child] of Object.entries(source)) {
        if (key === '_customValidators' || (key === 'validate' && typeof child === 'function')) {
          changed = true
          continue
        }

        const stripped = strip(child)
        setSchemaRecordValue(next, key, stripped)
        if (stripped !== child) changed = true
      }

      if (runtimeState) {
        let runtimeChanged = false
        const strippedConditions = runtimeState.conditions.map(condition => {
          if (!condition || typeof condition !== 'object') return condition
          const conditionRecord = condition as Record<string, unknown>
          if (!Object.prototype.hasOwnProperty.call(conditionRecord, 'then')) return condition

          const strippedThen = strip(conditionRecord['then'])
          if (strippedThen === conditionRecord['then']) return condition

          runtimeChanged = true
          return { ...conditionRecord, then: strippedThen }
        })

        const strippedElse = strip(runtimeState.elseSchema)
        runtimeChanged = runtimeChanged || strippedElse !== runtimeState.elseSchema

        if (runtimeChanged) {
          changed = true
          Object.defineProperty(next, CONDITIONAL_RUNTIME_STATE, {
            value: {
              ...runtimeState,
              conditions: strippedConditions,
              elseSchema: strippedElse as ConditionalRuntimeState['elseSchema'],
            },
            enumerable: false,
            configurable: false,
            writable: false,
          })
        }
      }

      return changed ? next : value
    }

    return strip(schema) as JSONSchemaInput
  }

  private async _runCustomValidators(
    schema: JSONSchemaInput,
    data: unknown,
    path = '',
    options: ValidateOptions = EMPTY_VALIDATE_OPTIONS,
    rootSchema: unknown = schema,
    seenRefs = new Set<string>()
  ): Promise<ValidationErrorItem | null> {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null

    const source = schema as Record<string, unknown>
    const ref = source['$ref']
    if (typeof ref === 'string' && !seenRefs.has(ref)) {
      const resolved = this._resolveLocalRef(rootSchema, ref)
      if (resolved && resolved !== schema) {
        seenRefs.add(ref)
        try {
          return await this._runCustomValidators(resolved as JSONSchemaInput, data, path, options, rootSchema, seenRefs)
        } finally {
          seenRefs.delete(ref)
        }
      }
    }

    const conditionalErr = await this._runCustomValidatorsForConditionalRuntime(schema, data, path, options, rootSchema, seenRefs)
    if (conditionalErr) return conditionalErr

    const validators = source['_customValidators'] as Array<(v: unknown) => unknown> | undefined
    if (validators?.length) {
      for (const fn of validators) {
        try {
          const result = await Promise.resolve(fn(data))
          if (result === false) {
            return {
              message: this._getMessageText('CUSTOM_VALIDATION_FAILED', {}, options, 'customValidator'),
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
              message: r.message ?? this._getMessageText('CUSTOM_VALIDATION_FAILED', {}, options, 'customValidator'),
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

    const legacyValidate = source['validate']
    if (typeof legacyValidate === 'function') {
      const legacyErr = await this._runLegacyValidateKeyword(legacyValidate as (value: unknown) => unknown, data, path, options)
      if (legacyErr) return legacyErr
    }

    if (schema.properties && data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      for (const [key, childSchema] of Object.entries(schema.properties)) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) continue
        const childPath = path ? `${path}/${key}` : key
        const err = await this._runCustomValidators(childSchema, record[key], childPath, options, rootSchema, seenRefs)
        if (err) return err
      }
    }

    if (schema.patternProperties && data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      for (const [pattern, childSchema] of Object.entries(schema.patternProperties as Record<string, JSONSchema>)) {
        const matcher = this._createPatternMatcher(pattern)
        if (!matcher) continue
        for (const [key, value] of Object.entries(record)) {
          if (!matcher.test(key)) continue
          const childPath = path ? `${path}/${key}` : key
          const err = await this._runCustomValidators(childSchema, value, childPath, options, rootSchema, seenRefs)
          if (err) return err
        }
      }
    }

    if (schema.additionalProperties && typeof schema.additionalProperties === 'object' && data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      const declaredProperties = new Set(Object.keys(schema.properties ?? {}))
      const patternEntries = Object.entries((schema.patternProperties as Record<string, JSONSchema> | undefined) ?? {})
      const patternMatchers = patternEntries
        .map(([pattern]) => this._createPatternMatcher(pattern))
        .filter((matcher): matcher is RegExp => matcher !== null)

      for (const [key, value] of Object.entries(record)) {
        if (declaredProperties.has(key)) continue
        if (patternMatchers.some(matcher => matcher.test(key))) continue
        const childPath = path ? `${path}/${key}` : key
        const err = await this._runCustomValidators(schema.additionalProperties as JSONSchema, value, childPath, options, rootSchema, seenRefs)
        if (err) return err
      }
    }

    if (schema.propertyNames && data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key of Object.keys(data as Record<string, unknown>)) {
        const childPath = path ? `${path}/${key}` : key
        const err = await this._runCustomValidators(schema.propertyNames as JSONSchema, key, childPath, options, rootSchema, seenRefs)
        if (err) return err
      }
    }

    const dependenciesErr = await this._runCustomValidatorsForDependencies(schema.dependencies, data, path, options, rootSchema, seenRefs)
    if (dependenciesErr) return dependenciesErr

    const dependentSchemasErr = await this._runCustomValidatorsForDependencies(schema.dependentSchemas, data, path, options, rootSchema, seenRefs)
    if (dependentSchemasErr) return dependentSchemasErr

    if (schema.items && Array.isArray(data)) {
      const itemSchemas = Array.isArray(schema.items) ? schema.items : null
      for (let i = 0; i < data.length; i++) {
        const childSchema = itemSchemas ? itemSchemas[i] : schema.items
        if (!childSchema || Array.isArray(childSchema)) continue
        const childPath = `${path}/${i}`.replace(/^\//, '')
        const err = await this._runCustomValidators(childSchema, data[i], childPath, options, rootSchema, seenRefs)
        if (err) return err
      }
    }

    const prefixItems = (schema as Record<string, unknown>)['prefixItems']
    if (Array.isArray(prefixItems) && Array.isArray(data)) {
      for (let i = 0; i < data.length && i < prefixItems.length; i++) {
        const childSchema = prefixItems[i] as JSONSchema | undefined
        if (!childSchema) continue
        const childPath = `${path}/${i}`.replace(/^\//, '')
        const err = await this._runCustomValidators(childSchema, data[i], childPath, options, rootSchema, seenRefs)
        if (err) return err
      }
    }

    if (schema.contains && Array.isArray(data)) {
      const containsSchema = schema.contains as JSONSchema
      const strippedContains = this._stripCustomValidators(containsSchema)
      let firstContainsErr: ValidationErrorItem | null = null
      for (let i = 0; i < data.length; i++) {
        if (!this._quickValidate(strippedContains, data[i])) continue
        const childPath = `${path}/${i}`.replace(/^\//, '')
        const err = await this._runCustomValidators(containsSchema, data[i], childPath, options, rootSchema, seenRefs)
        if (!err) return null
        firstContainsErr ??= err
      }
      if (firstContainsErr) return firstContainsErr
    }

    const allOfSchemas = schema.allOf
    if (Array.isArray(allOfSchemas)) {
      for (const childSchema of allOfSchemas) {
        const err = await this._runCustomValidators(childSchema, data, path, options, rootSchema, seenRefs)
        if (err) return err
      }
    }

    const anyOfSchemas = schema.anyOf
    if (Array.isArray(anyOfSchemas)) {
      const err = await this._runCustomValidatorsForAnyPassingBranch(anyOfSchemas, data, path, options, rootSchema, seenRefs)
      if (err) return err
    }

    const oneOfSchemas = schema.oneOf
    if (Array.isArray(oneOfSchemas)) {
      const err = await this._runCustomValidatorsForMatchingBranches(oneOfSchemas, data, path, options, rootSchema, seenRefs)
      if (err) return err
    }

    if (schema.if) {
      const ifSchema = this._stripCustomValidators(schema.if)
      const branch = this._quickValidate(ifSchema, data) ? schema.then : schema.else
      if (branch) {
        const err = await this._runCustomValidators(branch, data, path, options, rootSchema, seenRefs)
        if (err) return err
      }
    }

    return null
  }

  private async _runLegacyValidateKeyword(
    validator: (value: unknown) => unknown,
    data: unknown,
    path: string,
    options: ValidateOptions
  ): Promise<ValidationErrorItem | null> {
    try {
      const result = await Promise.resolve(validator(data))
      if (typeof result === 'boolean') {
        return result
          ? null
          : this._createLegacyValidateKeywordError(
            this._getMessageText('CUSTOM_VALIDATION_FAILED', {}, options, 'customKeyword'),
            path
          )
      }
      if (result !== null && typeof result === 'object') {
        const record = result as Record<string, unknown>
        if (typeof record['valid'] === 'boolean') {
          return record['valid']
            ? null
            : this._createLegacyValidateKeywordError(
              record['message']
                ? String(record['message'])
                : this._getMessageText('CUSTOM_VALIDATION_FAILED', {}, options, 'customKeyword'),
              path
            )
        }
      }
      return null
    } catch (error) {
      return this._createLegacyValidateKeywordError(error instanceof Error ? error.message : String(error), path)
    }
  }

  private _createLegacyValidateKeywordError(message: string, path: string): ValidationErrorItem {
    return {
      message,
      path,
      keyword: 'validate',
      kind: 'custom',
      params: {},
      field: path,
      type: 'validate',
    }
  }

  private async _runCustomValidatorsForConditionalRuntime(
    schema: JSONSchemaInput,
    data: unknown,
    path: string,
    options: ValidateOptions,
    rootSchema: unknown,
    seenRefs: Set<string>
  ): Promise<ValidationErrorItem | null> {
    const runtimeState = (schema as { [CONDITIONAL_RUNTIME_STATE]?: ConditionalRuntimeState })[CONDITIONAL_RUNTIME_STATE]
    if (!runtimeState) return null

    for (const condition of runtimeState.conditions) {
      const evaluated = runtimeState.evaluateCondition(condition, data)
      if (!evaluated.result) continue

      const branch = this._normalizeCustomValidatorSchema((condition as Record<string, unknown>)['then'])
      return branch ? this._runCustomValidators(branch, data, path, options, rootSchema, seenRefs) : null
    }

    const elseSchema = this._normalizeCustomValidatorSchema(runtimeState.elseSchema)
    return elseSchema ? this._runCustomValidators(elseSchema, data, path, options, rootSchema, seenRefs) : null
  }

  private _normalizeCustomValidatorSchema(schema: unknown): JSONSchemaInput | null {
    if (schema === null || schema === undefined) return null
    if (typeof schema === 'string') return DslParser.parseString(schema, this._parseOptions)
    if (typeof schema === 'object' && typeof (schema as Record<string, unknown>)['toSchema'] === 'function') {
      return ((schema as Record<string, unknown>)['toSchema'] as () => JSONSchemaInput)()
    }
    return schema as JSONSchemaInput
  }

  private async _runCustomValidatorsForDependencies(
    dependencies: unknown,
    data: unknown,
    path: string,
    options: ValidateOptions,
    rootSchema: unknown,
    seenRefs: Set<string>
  ): Promise<ValidationErrorItem | null> {
    if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) return null
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null

    const record = data as Record<string, unknown>
    for (const [key, childSchema] of Object.entries(dependencies as Record<string, JSONSchema | string[]>)) {
      if (!Object.prototype.hasOwnProperty.call(record, key)) continue
      if (Array.isArray(childSchema)) continue
      const err = await this._runCustomValidators(childSchema, data, path, options, rootSchema, seenRefs)
      if (err) return err
    }
    return null
  }

  private async _runCustomValidatorsForAnyPassingBranch(
    schemas: JSONSchemaInput[],
    data: unknown,
    path: string,
    options: ValidateOptions,
    rootSchema: unknown,
    seenRefs: Set<string>
  ): Promise<ValidationErrorItem | null> {
    let firstErr: ValidationErrorItem | null = null

    for (const childSchema of schemas) {
      const stripped = this._stripCustomValidators(childSchema)
      if (!this._quickValidate(stripped, data)) continue
      const err = await this._runCustomValidators(childSchema, data, path, options, rootSchema, seenRefs)
      if (!err) return null
      firstErr ??= err
    }

    return firstErr
  }

  private async _runCustomValidatorsForMatchingBranches(
    schemas: JSONSchemaInput[],
    data: unknown,
    path: string,
    options: ValidateOptions,
    rootSchema: unknown,
    seenRefs: Set<string>
  ): Promise<ValidationErrorItem | null> {
    for (const childSchema of schemas) {
      const stripped = this._stripCustomValidators(childSchema)
      if (!this._quickValidate(stripped, data)) continue
      const err = await this._runCustomValidators(childSchema, data, path, options, rootSchema, seenRefs)
      if (err) return err
    }
    return null
  }

  /**
   * Batch validation using the same validation path and options for each item.
   */
  validateBatch<T = unknown>(schema: JSONSchemaInput, dataArray: T[], options: ValidateOptions = EMPTY_VALIDATE_OPTIONS): ValidationResult<T>[] {
    if (!Array.isArray(dataArray)) throw new Error('Data must be an array')
    this._prewarmBatchCompileCache(schema)
    return dataArray.map(data => this.validate(schema, data, options))
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
      this.clearCache()
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
    this.clearCache()
    return this
  }

  /**
   * Add a schema reference.
   */
  addSchema(uri: string, schema: JSONSchema): this {
    this._ajv.addSchema(schema, uri)
    this.clearCache()
    return this
  }

  /**
   * Remove a schema reference.
   */
  removeSchema(uri: string): this {
    this._ajv.removeSchema(uri)
    this.clearCache()
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
    this._patternMatcherCache.clear()
    this._conditionalValidator.clearPatternCache()
    this._metadataStore.clear()
    this._validationPlanCache.clear()
  }
  getCacheStats(): CacheStats { return this._cache.getStats() }

  // ─── Static Factory ────────────────────────────────────────────────────

  static create(options?: ValidatorOptions): Validator {
    return new Validator(options)
  }

  /**
   * Quick validate (V-Y07 fix: reuses singleton Ajv instead of creating new Ajv each time).
   */
  static quickValidate(schema: JSONSchemaInput, data: unknown): boolean {
    return Validator._quickValidateInternal(schema, data, new WeakSet<object>())
  }

  private static _quickValidateInternal(
    schema: JSONSchemaInput,
    data: unknown,
    seen: WeakSet<object>
  ): boolean {
    const ajv = Validator._getQuickValidateAjv()
    const cacheKey = Validator._rememberQuickValidateSchema(schema)
    try {
      const valid = ajv.validate(schema, data) as boolean
      if (cacheKey) Validator._touchQuickValidateSchema(cacheKey)
      return valid && Validator._quickValidateAjvSkippedProperties(schema, data, seen)
    } catch {
      if (cacheKey) Validator._releaseQuickValidateSchema(cacheKey)
      return false
    }
  }

  static clearQuickValidateCache(): void {
    if (Validator._quickValidateAjv) {
      Validator._releaseAllQuickValidateSchemas()
      Validator._quickValidateAjv.removeSchema()
      Validator._quickValidateAjv = null
    }
    Validator._quickValidateSchemaMap = new WeakMap<object, string>()
    Validator._quickValidateSchemaKeyCounter = 0
  }

  static getQuickValidateCacheStats(): { size: number; maxSize: number } {
    return {
      size: Validator._quickValidateSchemaLru.size,
      maxSize: Validator._quickValidateCacheMaxSize,
    }
  }

  private static _getQuickValidateAjv(): InstanceType<typeof Ajv> {
    if (!Validator._quickValidateAjv) {
      Validator._quickValidateAjv = new Ajv()
        ; (addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(Validator._quickValidateAjv)
      CustomKeywords.registerAll(Validator._quickValidateAjv)
    }
    return Validator._quickValidateAjv
  }

  private static _rememberQuickValidateSchema(schema: JSONSchemaInput): string | null {
    if (!schema || typeof schema !== 'object') return null

    let cacheKey = Validator._quickValidateSchemaMap.get(schema)
    if (!cacheKey) {
      cacheKey = `quick:${++Validator._quickValidateSchemaKeyCounter}`
      Validator._quickValidateSchemaMap.set(schema, cacheKey)
    }

    if (Validator._quickValidateSchemaRefs.has(cacheKey)) {
      Validator._touchQuickValidateSchema(cacheKey)
      return cacheKey
    }

    Validator._ensureQuickValidateCapacity()
    Validator._quickValidateSchemaRefs.set(cacheKey, schema)
    Validator._touchQuickValidateSchema(cacheKey)
    return cacheKey
  }

  private static _ensureQuickValidateCapacity(): void {
    const maxSize = Math.max(1, Validator._quickValidateCacheMaxSize)
    while (Validator._quickValidateSchemaLru.size >= maxSize) {
      const oldestKey = Validator._quickValidateSchemaLru.keys().next().value as string | undefined
      if (!oldestKey) return
      Validator._releaseQuickValidateSchema(oldestKey)
    }
  }

  private static _releaseQuickValidateSchema(cacheKey: string): void {
    const schemaRef = Validator._quickValidateSchemaRefs.get(cacheKey)
    if (schemaRef && typeof schemaRef === 'object' && Validator._quickValidateAjv) {
      try {
        Validator._quickValidateAjv.removeSchema(schemaRef)
      } catch {
        // AJV may already have pruned this schema; bookkeeping still needs cleanup.
      }
    }
    Validator._quickValidateSchemaRefs.delete(cacheKey)
    Validator._quickValidateSchemaLru.delete(cacheKey)
  }

  private static _releaseAllQuickValidateSchemas(): void {
    for (const cacheKey of Array.from(Validator._quickValidateSchemaRefs.keys())) {
      Validator._releaseQuickValidateSchema(cacheKey)
    }
    Validator._quickValidateSchemaRefs.clear()
    Validator._quickValidateSchemaLru.clear()
  }

  private static _touchQuickValidateSchema(cacheKey: string): void {
    Validator._quickValidateSchemaLru.delete(cacheKey)
    Validator._quickValidateSchemaLru.set(cacheKey, true)
  }

  private static _quickValidateAjvSkippedProperties(
    schema: JSONSchemaInput,
    data: unknown,
    seen = new WeakSet<object>()
  ): boolean {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return true

    const schemaObject = schema as object
    if (seen.has(schemaObject)) return true
    seen.add(schemaObject)

    const source = schema as Record<string, unknown>
    const dataRecord = data && typeof data === 'object' && !Array.isArray(data)
      ? data as Record<string, unknown>
      : null
    const properties = source['properties']
    const required = Array.isArray(source['required']) ? source['required'].map(String) : []

    for (const propertyName of AJV_SKIPPED_PROPERTY_NAMES) {
      const hasOwnData = !!dataRecord && Object.prototype.hasOwnProperty.call(dataRecord, propertyName)
      if (required.includes(propertyName) && !hasOwnData) return false
      if (properties && typeof properties === 'object' && !Array.isArray(properties)
        && Object.prototype.hasOwnProperty.call(properties, propertyName)
        && hasOwnData) {
        const childSchema = (properties as Record<string, JSONSchemaInput>)[propertyName]
        if (childSchema && typeof childSchema === 'object' && !Array.isArray(childSchema) && seen.has(childSchema as object)) continue
        if (!Validator._quickValidateInternal(childSchema, dataRecord[propertyName], seen)) return false
      }
    }

    if (properties && typeof properties === 'object' && !Array.isArray(properties) && dataRecord) {
      for (const [key, childSchema] of Object.entries(properties as Record<string, JSONSchemaInput>)) {
        if ((AJV_SKIPPED_PROPERTY_NAMES as readonly string[]).includes(key)) continue
        if (!Object.prototype.hasOwnProperty.call(dataRecord, key)) continue
        if (!Validator._quickValidateAjvSkippedProperties(childSchema, dataRecord[key], seen)) return false
      }
    }

    const allOf = source['allOf']
    if (Array.isArray(allOf)) {
      for (const child of allOf) {
        if (!Validator._quickValidateAjvSkippedProperties(child as JSONSchemaInput, data, seen)) return false
      }
    }

    const anyOf = source['anyOf']
    if (Array.isArray(anyOf) && !anyOf.some(child => Validator._quickValidateInternal(child as JSONSchemaInput, data, seen))) {
      return false
    }

    const oneOf = source['oneOf']
    if (Array.isArray(oneOf)) {
      let matches = 0
      for (const child of oneOf) {
        if (Validator._quickValidateInternal(child as JSONSchemaInput, data, seen)) matches++
      }
      if (matches !== 1) return false
    }

    const ifSchema = source['if']
    if (ifSchema && typeof ifSchema === 'object' && !Array.isArray(ifSchema)) {
      const branch = Validator._quickValidateInternal(ifSchema as JSONSchemaInput, data, seen)
        ? source['then']
        : source['else']
      if (branch && typeof branch === 'object' && !Array.isArray(branch)) {
        if (!Validator._quickValidateAjvSkippedProperties(branch as JSONSchemaInput, data, seen)) return false
      }
    }

    const notSchema = source['not']
    if (notSchema && typeof notSchema === 'object' && !Array.isArray(notSchema)) {
      if (Validator._quickValidateInternal(notSchema as JSONSchemaInput, data, seen)) return false
    }

    if (Array.isArray(data)) {
      const prefixItems = source['prefixItems']
      const prefixItemCount = Array.isArray(prefixItems) ? prefixItems.length : 0
      if (Array.isArray(prefixItems)) {
        for (let index = 0; index < data.length && index < prefixItems.length; index++) {
          if (!Validator._quickValidateAjvSkippedProperties(prefixItems[index] as JSONSchemaInput, data[index], seen)) return false
        }
      }

      const items = source['items']
      if (items && typeof items === 'object' && !Array.isArray(items)) {
        for (let index = prefixItemCount; index < data.length; index++) {
          if (!Validator._quickValidateAjvSkippedProperties(items as JSONSchemaInput, data[index], seen)) return false
        }
      }

      const contains = source['contains']
      if (contains && typeof contains === 'object' && !Array.isArray(contains)) {
        if (!data.some(item => Validator._quickValidateInternal(contains as JSONSchemaInput, item, seen))) return false
      }
    }

    return true
  }

  // ─── Internal Implementation ───────────────────────────────────────────

  private _validateInternal<T>(
    schema: JSONSchemaInput | AjvValidateFn,
    data: T,
    options: ValidateOptions = EMPTY_VALIDATE_OPTIONS
  ): ValidationResult<T> {
    // DslBuilder/ObjectDslBuilder/ConditionalBuilder duck type.
    // Builders are mutable, so their toSchema() result must be re-materialized on every call.
    if (typeof (schema as Record<string, unknown>)['toSchema'] === 'function') {
      const obj = schema as Record<string, unknown>
      schema = (obj['toSchema'] as () => JSONSchema)()
    }

    const objectSchema = schema && typeof schema === 'object'
      ? schema as JSONSchemaInput & object
      : null
    let schemaCacheKey: string | null = null
    let schemaMetadata: SchemaRuntimeMetadata | null = null

    if (objectSchema) {
      schemaCacheKey = this._getSchemaCacheKey(objectSchema)
      schemaMetadata = this._getSchemaRuntimeMetadata(objectSchema, schemaCacheKey)
    }

    const internalSchema = (objectSchema ?? {}) as InternalSchema

    if (objectSchema && schemaMetadata?.hasDeclaredAsyncCustomValidators) {
      const asyncValidatorPath = this._findDeclaredAsyncCustomValidatorPath(schema, data, '', schema)
      if (asyncValidatorPath !== null) {
        const err = this._createAsyncValidationNotSupportedError(asyncValidatorPath, options)
        return { valid: false, data, errors: [err], errorMessage: err.message }
      }
    }

    if (this._shouldSmartCoerce(options) && schemaMetadata?.coerceCandidates) {
      data = applySmartCoerce(data, schemaMetadata.coerceCandidates) as T
    }

    // ConditionalBuilder (top-level)
    if (internalSchema._isConditional) {
      return this._conditionalValidator.validateConditional(internalSchema, data as Record<string, unknown>, null, data, options)
    }

    // Any schema containing ConditionalBuilder nodes (objects, arrays, and composition branches).
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
      if (schemaMetadata?.hasConditionals) {
        return this._conditionalValidator.validateWithConditionals(internalSchema, data, options)
      }
    }

    // V-Y03 fix: _removeAdditional reuses internal Ajv instance
    if (internalSchema._removeAdditional) {
      if (!this._removeAdditionalAjv) {
        this._removeAdditionalAjv = new Ajv({ ...this._ajvOptions, removeAdditional: true })
          ; (addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(this._removeAdditionalAjv)
        CustomKeywords.registerAll(this._removeAdditionalAjv, {
          getMessageText: (key, params) =>
            this._getMessageText(key, params ?? {}, this._activeValidateOptions ?? {}, 'customKeyword'),
        })
      }

      const cleanSchema: JSONSchema = JSON.parse(JSON.stringify(schema)) as JSONSchema
      delete (cleanSchema as InternalSchema)._removeAdditional

      try {
        const cacheKey = this._getRemoveAdditionalCacheKey(cleanSchema)
        const validate = this._compileRemoveAdditionalSchema(cleanSchema, cacheKey)
        const valid = this._runWithActiveOptions(options, () => validate(data) as boolean)
        const skippedContext = schemaMetadata?.hasAjvSkippedProperties
          ? this._createErrorFormatContext(options)
          : null
        const skippedPropertyErrors = skippedContext
          ? this._validateAjvSkippedProperties(cleanSchema, data, options, skippedContext.messages, skippedContext.locale, skippedContext.shouldFormat)
          : EMPTY_ERRORS
        if (valid && skippedPropertyErrors.length === 0) return { valid: true, data, errors: EMPTY_ERRORS }
        const errorContext = skippedContext ?? this._createErrorFormatContext(options)
        const fmtErrors = this._formatErrors(validate.errors ?? [], errorContext.messages, errorContext.locale, errorContext.shouldFormat, options)
        const errors = [...fmtErrors, ...skippedPropertyErrors]
        return { valid: false, data, errors, errorMessage: errors[0]?.message }
      } catch (error) {
        return this._internalError(error, data)
      }
    }

    const validationPlan = schemaMetadata
      ? this._getOrCompileValidationPlan(objectSchema, schemaMetadata)
      : null
    const validationProjection = schemaMetadata
      ? this._getSchemaIRProjection(objectSchema, schemaMetadata)
      : null
    if (validationProjection?.projections.validation?.safe === true && validationPlan?.validate(data)) {
      return { valid: true, data, errors: EMPTY_ERRORS }
    }

    let validate: AjvValidateFn
    if (typeof schema === 'function') {
      validate = schema as AjvValidateFn
    } else {
      try {
        const cacheKey = schemaCacheKey ?? this._getSchemaCacheKey(schema)
        validate = this._compileWithManagedCache(schema, cacheKey)
      } catch (error) {
        return this._internalError(new SchemaCompileError(error, schema), data)
      }
    }

    try {
      const valid = this._runWithActiveOptions(options, () => validate(data) as boolean)
      const skippedContext =
        typeof schema !== 'function' && schemaMetadata?.hasAjvSkippedProperties
          ? this._createErrorFormatContext(options)
          : null
      const skippedPropertyErrors = skippedContext
        ? this._validateAjvSkippedProperties(schema as JSONSchemaInput, data, options, skippedContext.messages, skippedContext.locale, skippedContext.shouldFormat)
        : EMPTY_ERRORS
      if (valid && skippedPropertyErrors.length === 0) return { valid: true, data, errors: EMPTY_ERRORS }
      const errorContext = skippedContext ?? this._createErrorFormatContext(options)
      const fmtErrors2 = this._formatErrors(validate.errors ?? [], errorContext.messages, errorContext.locale, errorContext.shouldFormat, options)
      const errors = [...fmtErrors2, ...skippedPropertyErrors]
      return { valid: false, data, errors, errorMessage: errors[0]?.message }
    } catch (error) {
      return this._internalError(error, data)
    }
  }

  // ─── Helper methods ─────────────────────────────────────────────────────

  private _createErrorFormatContext(options: ValidateOptions): ErrorFormatContext {
    return {
      shouldFormat: options.format !== false,
      locale: options.locale ?? Locale.getLocale(),
      messages: this._normalizeErrorMessages(options.messages ?? {}),
    }
  }

  private _getSchemaRuntimeMetadata(schema: JSONSchemaInput & object, cacheKey: string): SchemaRuntimeMetadata {
    return this._metadataStore.get(schema, cacheKey, () => ({
      cacheKey,
      hasConditionals: !Array.isArray(schema) && this._conditionalValidator.hasAnyConditional(schema as ConditionalInternalSchema),
      hasDeclaredAsyncCustomValidators: this._hasDeclaredAsyncCustomValidators(schema, schema),
      hasAjvSkippedProperties: this._hasAjvSkippedProperties(schema),
      coerceCandidates: getSchemaCoerceCandidates(schema),
    }))
  }

  private _getOrCompileValidationPlan(
    schema: (JSONSchemaInput & object) | null,
    metadata: SchemaRuntimeMetadata,
    customValidatorMode: 'sync' | 'ignore' = 'sync'
  ): ValidationPlan | null {
    if (!schema) return null
    const usePlanCache = this._cache.options.enabled && this._cache.options.maxSize > 0
    const planCacheKey = customValidatorMode === 'sync'
      ? metadata.cacheKey
      : `${metadata.cacheKey}:ignore-custom`

    if (usePlanCache && customValidatorMode === 'sync' && metadata.validationPlan !== undefined) return metadata.validationPlan

    if (usePlanCache) {
      const cached = this._validationPlanCache.get(planCacheKey)
      if (cached) {
        this._rememberValidationPlanCacheEntry(planCacheKey, cached)
        if (customValidatorMode === 'sync') {
          metadata.validationPlan = cached.plan
          metadata.validationPlanReason = cached.reason
          metadata.irProjection = undefined
        }
        return cached.plan
      }
    }

    const result = compileValidationPlan(schema, {
      cacheKey: planCacheKey,
      ajvOptions: this._ajvOptions,
      customValidators: customValidatorMode,
    })
    if (result.status === 'compiled') {
      if (customValidatorMode === 'sync') {
        metadata.validationPlan = result.plan
        metadata.validationPlanReason = null
        metadata.irProjection = undefined
      }
      if (usePlanCache) {
        this._rememberValidationPlanCacheEntry(planCacheKey, { plan: result.plan, reason: null })
      }
      return result.plan
    }

    if (customValidatorMode === 'sync') {
      metadata.validationPlan = null
      metadata.validationPlanReason = result.reason
      metadata.irProjection = undefined
    }
    if (usePlanCache) {
      this._rememberValidationPlanCacheEntry(planCacheKey, { plan: null, reason: result.reason })
    }
    return null
  }

  private _getSchemaIRProjection(
    schema: (JSONSchemaInput & object) | null,
    metadata: SchemaRuntimeMetadata
  ): SchemaIRProjection | null {
    if (!schema) return null
    if (metadata.irProjection !== undefined) return metadata.irProjection
    if (
      !metadata.hasConditionals
      && metadata.validationPlan === undefined
      && metadata.validationPlanReason === undefined
    ) return null

    try {
      metadata.irProjection = createExecutionPlanProjection(createJsonSchemaIR(schema), metadata)
    } catch {
      metadata.irProjection = null
    }
    return metadata.irProjection
  }

  private async _tryValidateAsyncFastPath<T>(
    schema: JSONSchemaInput,
    data: T,
    options: ValidateOptions
  ): Promise<AsyncFastValidationResult<T>> {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return { status: 'fallback' }

    const objectSchema = schema as JSONSchemaInput & object
    const schemaCacheKey = this._getSchemaCacheKey(objectSchema)
    const schemaMetadata = this._getSchemaRuntimeMetadata(objectSchema, schemaCacheKey)
    if (schemaMetadata.hasConditionals || schemaMetadata.hasAjvSkippedProperties) return { status: 'fallback' }

    let validatedData = data
    if (this._shouldSmartCoerce(options) && schemaMetadata.coerceCandidates) {
      validatedData = applySmartCoerce(data, schemaMetadata.coerceCandidates) as T
    }

    const validationPlan = this._getOrCompileValidationPlan(objectSchema, schemaMetadata, 'ignore')
    if (!validationPlan?.validate(validatedData)) return { status: 'fallback' }

    const directCustomErr = await this._runTopLevelCustomValidatorsFast(schema, validatedData, options)
    if (directCustomErr !== undefined) {
      if (directCustomErr) {
        const { ValidationError } = await import('../errors/ValidationError.js')
        throw new ValidationError([directCustomErr], data)
      }
      return { status: 'valid', data: validatedData }
    }

    const customErr = await this._runCustomValidators(schema, validatedData, '', options, schema)
    if (customErr) {
      const { ValidationError } = await import('../errors/ValidationError.js')
      throw new ValidationError([customErr], data)
    }

    return { status: 'valid', data: validatedData }
  }

  private async _runTopLevelCustomValidatorsFast(
    schema: JSONSchemaInput,
    data: unknown,
    options: ValidateOptions
  ): Promise<ValidationErrorItem | null | undefined> {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return undefined
    const source = schema as Record<string, unknown>
    const validators = source['_customValidators']
    if (!Array.isArray(validators) || this._hasCustomValidatorTraversalChildren(source)) return undefined

    for (const fn of validators) {
      if (typeof fn !== 'function') return undefined

      try {
        const result = await Promise.resolve((fn as (v: unknown) => unknown)(data))
        if (result === false) {
          return {
            message: this._getMessageText('CUSTOM_VALIDATION_FAILED', {}, options, 'customValidator'),
            path: '',
            keyword: '_customValidators',
            params: {},
            field: '',
            type: '_customValidators',
          }
        }
        if (typeof result === 'string') {
          return {
            message: result,
            path: '',
            keyword: '_customValidators',
            params: {},
            field: '',
            type: '_customValidators',
          }
        }
        if (result !== null && typeof result === 'object' && (result as Record<string, unknown>)['error']) {
          const r = result as { error: unknown; message?: string }
          return {
            message: r.message ?? this._getMessageText('CUSTOM_VALIDATION_FAILED', {}, options, 'customValidator'),
            path: '',
            keyword: '_customValidators',
            params: {},
            field: '',
            type: '_customValidators',
          }
        }
      } catch (err) {
        return {
          message: err instanceof Error ? err.message : String(err),
          path: '',
          keyword: '_customValidators',
          params: {},
          field: '',
          type: '_customValidators',
        }
      }
    }

    return null
  }

  private _hasCustomValidatorTraversalChildren(source: Record<string, unknown>): boolean {
    for (const key of ['properties', 'patternProperties', 'dependencies', 'dependentSchemas', 'definitions', '$defs']) {
      const value = source[key]
      if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length > 0) {
        return true
      }
    }

    for (const key of ['items', 'additionalProperties', 'propertyNames', 'contains', 'not', 'if', 'then', 'else', 'unevaluatedItems', 'unevaluatedProperties']) {
      const value = source[key]
      if (value && typeof value === 'object') return true
    }

    for (const key of ['allOf', 'anyOf', 'oneOf', 'prefixItems']) {
      const value = source[key]
      if (Array.isArray(value) && value.length > 0) return true
    }

    return false
  }

  private _rememberValidationPlanCacheEntry(cacheKey: string, entry: ValidationPlanCacheEntry): void {
    if (this._validationPlanCache.has(cacheKey)) this._validationPlanCache.delete(cacheKey)
    this._validationPlanCache.set(cacheKey, entry)

    const maxSize = this._cache.options.maxSize
    while (this._validationPlanCache.size > maxSize) {
      const oldestKey = this._validationPlanCache.keys().next().value as string | undefined
      if (oldestKey === undefined) break
      this._validationPlanCache.delete(oldestKey)
    }
  }

  private _hasDeclaredAsyncCustomValidators(
    schema: unknown,
    rootSchema: unknown = schema,
    seen = new WeakSet<object>(),
    seenRefs = new Set<string>()
  ): boolean {
    if (!schema || typeof schema !== 'object') return false
    const schemaObject = schema as object
    if (seen.has(schemaObject)) return false
    seen.add(schemaObject)

    const source = schema as Record<string, unknown>
    if (typeof source['toSchema'] === 'function') {
      const resolvedSchema = (source['toSchema'] as () => unknown)()
      return this._hasDeclaredAsyncCustomValidators(resolvedSchema, resolvedSchema, seen, seenRefs)
    }

    const ref = source['$ref']
    if (typeof ref === 'string' && !seenRefs.has(ref)) {
      const resolved = this._resolveLocalRef(rootSchema, ref)
      if (resolved && resolved !== schema) {
        seenRefs.add(ref)
        try {
          if (this._hasDeclaredAsyncCustomValidators(resolved, rootSchema, seen, seenRefs)) return true
        } finally {
          seenRefs.delete(ref)
        }
      }
    }

    const validators = source['_customValidators']
    if (Array.isArray(validators) && validators.some(validator => this._isDeclaredAsyncFunction(validator))) {
      return true
    }

    const runtimeState = (source as { [CONDITIONAL_RUNTIME_STATE]?: ConditionalRuntimeState })[CONDITIONAL_RUNTIME_STATE]
    if (runtimeState) {
      for (const condition of runtimeState.conditions) {
        const branch = this._normalizeCustomValidatorSchemaSafely((condition as Record<string, unknown>)['then'])
        if (this._hasDeclaredAsyncCustomValidators(branch, rootSchema, seen, seenRefs)) return true
      }
      const elseSchema = this._normalizeCustomValidatorSchemaSafely(runtimeState.elseSchema)
      if (this._hasDeclaredAsyncCustomValidators(elseSchema, rootSchema, seen, seenRefs)) return true
    }

    for (const child of this._iterCustomValidatorSchemaChildren(source)) {
      if (this._hasDeclaredAsyncCustomValidators(child, rootSchema, seen, seenRefs)) return true
    }

    return false
  }

  private _normalizeCustomValidatorSchemaSafely(schema: unknown): JSONSchemaInput | null {
    try {
      return this._normalizeCustomValidatorSchema(schema)
    } catch {
      return null
    }
  }

  private _iterCustomValidatorSchemaChildren(source: Record<string, unknown>): unknown[] {
    const children: unknown[] = []
    const pushSchema = (value: unknown): void => {
      if (value && typeof value === 'object') children.push(value)
    }
    const pushMapValues = (value: unknown): void => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        children.push(...Object.values(value as Record<string, unknown>).filter(child => !Array.isArray(child)))
      }
    }

    pushMapValues(source['properties'])
    pushMapValues(source['patternProperties'])
    pushMapValues(source['dependencies'])
    pushMapValues(source['dependentSchemas'])
    pushMapValues(source['definitions'])
    pushMapValues(source['$defs'])

    for (const key of ['items', 'additionalProperties', 'propertyNames', 'contains', 'not', 'if', 'then', 'else', 'unevaluatedItems', 'unevaluatedProperties']) {
      const value = source[key]
      if (Array.isArray(value)) children.push(...value)
      else pushSchema(value)
    }

    for (const key of ['allOf', 'anyOf', 'oneOf', 'prefixItems']) {
      const value = source[key]
      if (Array.isArray(value)) children.push(...value)
    }

    return children
  }

  private _hasAjvSkippedProperties(schema: unknown, seen = new WeakSet<object>()): boolean {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false
    const schemaObject = schema as object
    if (seen.has(schemaObject)) return false
    seen.add(schemaObject)

    const source = schema as Record<string, unknown>
    const properties = source['properties']
    const required = Array.isArray(source['required']) ? source['required'].map(String) : []

    for (const propertyName of AJV_SKIPPED_PROPERTY_NAMES) {
      if (required.includes(propertyName)) return true
      if (
        properties &&
        typeof properties === 'object' &&
        !Array.isArray(properties) &&
        Object.prototype.hasOwnProperty.call(properties, propertyName)
      ) {
        return true
      }
    }

    for (const childSchema of this._iterCustomValidatorSchemaChildren(source)) {
      if (this._hasAjvSkippedProperties(childSchema, seen)) return true
    }

    return false
  }

  private _shouldSmartCoerce(options: ValidateOptions): boolean {
    return this._smartCoerceEnabled
      && options.coerce !== false
      && options.smartCoerce !== false
      && options['coerceTypes'] !== false
      && options['__schemaDslPreCoerced'] !== true
  }

  private _findDeclaredAsyncCustomValidatorPath(
    schema: unknown,
    data: unknown,
    path = '',
    rootSchema: unknown = schema,
    seen = new WeakSet<object>(),
    seenRefs = new Set<string>()
  ): string | null {
    if (!schema || typeof schema !== 'object') return null
    const schemaObject = schema as object
    if (seen.has(schemaObject)) return null
    seen.add(schemaObject)

    const source = schema as Record<string, unknown>
    if (typeof source['toSchema'] === 'function') {
      const resolvedSchema = (source['toSchema'] as () => unknown)()
      return this._findDeclaredAsyncCustomValidatorPath(resolvedSchema, data, path, resolvedSchema, seen, seenRefs)
    }

    const ref = source['$ref']
    if (typeof ref === 'string' && !seenRefs.has(ref)) {
      const resolved = this._resolveLocalRef(rootSchema, ref)
      if (resolved && resolved !== schema) {
        seenRefs.add(ref)
        const found = this._findDeclaredAsyncCustomValidatorPath(resolved, data, path, rootSchema, seen, seenRefs)
        seenRefs.delete(ref)
        if (found !== null) return found
      }
    }

    const validators = source['_customValidators']
    if (Array.isArray(validators) && validators.some(validator => this._isDeclaredAsyncFunction(validator))) {
      return path
    }

    const runtimeState = (source as { [CONDITIONAL_RUNTIME_STATE]?: ConditionalRuntimeState })[CONDITIONAL_RUNTIME_STATE]
    if (runtimeState) {
      for (const condition of runtimeState.conditions) {
        const evaluated = runtimeState.evaluateCondition(condition, data)
        if (!evaluated.result) continue
        const branch = this._normalizeCustomValidatorSchema((condition as Record<string, unknown>)['then'])
        const found = this._findDeclaredAsyncCustomValidatorPath(branch, data, path, rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
      const elseSchema = this._normalizeCustomValidatorSchema(runtimeState.elseSchema)
      const found = this._findDeclaredAsyncCustomValidatorPath(elseSchema, data, path, rootSchema, seen, seenRefs)
      if (found !== null) return found
    }

    if (source['properties'] && data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      const properties = source['properties'] as Record<string, unknown>
      for (const [key, child] of Object.entries(properties as Record<string, unknown>)) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) continue
        const found = this._findDeclaredAsyncCustomValidatorPath(child, record[key], this._joinPath(path, key), rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    if (source['patternProperties'] && data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      for (const [pattern, child] of Object.entries(source['patternProperties'] as Record<string, unknown>)) {
        const matcher = this._createPatternMatcher(pattern)
        if (!matcher) continue
        for (const [key, value] of Object.entries(record)) {
          if (!matcher.test(key)) continue
          const found = this._findDeclaredAsyncCustomValidatorPath(child, value, this._joinPath(path, key), rootSchema, seen, seenRefs)
          if (found !== null) return found
        }
      }
    }

    if (source['additionalProperties'] && typeof source['additionalProperties'] === 'object' && data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      const declaredProperties = new Set(Object.keys((source['properties'] as Record<string, unknown> | undefined) ?? {}))
      const patternEntries = Object.entries((source['patternProperties'] as Record<string, unknown> | undefined) ?? {})
      const patternMatchers = patternEntries
        .map(([pattern]) => this._createPatternMatcher(pattern))
        .filter((matcher): matcher is RegExp => matcher !== null)

      for (const [key, value] of Object.entries(record)) {
        if (declaredProperties.has(key)) continue
        if (patternMatchers.some(matcher => matcher.test(key))) continue
        const found = this._findDeclaredAsyncCustomValidatorPath(source['additionalProperties'], value, this._joinPath(path, key), rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    if (source['propertyNames'] && data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key of Object.keys(data as Record<string, unknown>)) {
        const found = this._findDeclaredAsyncCustomValidatorPath(source['propertyNames'], key, this._joinPath(path, key), rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    for (const mapKey of ['dependencies', 'dependentSchemas']) {
      const dependencies = source[mapKey]
      if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) continue
      if (!data || typeof data !== 'object' || Array.isArray(data)) continue
      const record = data as Record<string, unknown>
      for (const [key, child] of Object.entries(dependencies as Record<string, unknown>)) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) continue
        if (Array.isArray(child)) continue
        const found = this._findDeclaredAsyncCustomValidatorPath(child, data, path, rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    if (source['items'] && Array.isArray(data)) {
      const itemSchemas = Array.isArray(source['items']) ? source['items'] as unknown[] : null
      for (let index = 0; index < data.length; index++) {
        const child = itemSchemas ? itemSchemas[index] : source['items']
        if (!child || Array.isArray(child)) continue
        const found = this._findDeclaredAsyncCustomValidatorPath(child, data[index], this._joinPath(path, String(index)), rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    const prefixItems = source['prefixItems']
    if (Array.isArray(prefixItems) && Array.isArray(data)) {
      for (let index = 0; index < data.length && index < prefixItems.length; index++) {
        const child = prefixItems[index]
        if (!child) continue
        const found = this._findDeclaredAsyncCustomValidatorPath(child, data[index], this._joinPath(path, String(index)), rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    if (source['contains'] && Array.isArray(data)) {
      const strippedContains = this._stripCustomValidators(source['contains'] as JSONSchemaInput)
      for (let index = 0; index < data.length; index++) {
        if (!this._quickValidate(strippedContains, data[index])) continue
        const found = this._findDeclaredAsyncCustomValidatorPath(source['contains'], data[index], this._joinPath(path, String(index)), rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    const allOfSchemas = source['allOf']
    if (Array.isArray(allOfSchemas)) {
      for (const child of allOfSchemas) {
        const found = this._findDeclaredAsyncCustomValidatorPath(child, data, path, rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    for (const listKey of ['anyOf', 'oneOf']) {
      const list = source[listKey]
      if (!Array.isArray(list)) continue
      for (const child of list) {
        const stripped = this._stripCustomValidators(child as JSONSchemaInput)
        if (!this._quickValidate(stripped, data)) continue
        const found = this._findDeclaredAsyncCustomValidatorPath(child, data, path, rootSchema, seen, seenRefs)
        if (found !== null) return found
      }
    }

    const ifSchema = source['if']
    if (ifSchema) {
      const found = this._findDeclaredAsyncCustomValidatorPath(ifSchema, data, path, rootSchema, seen, seenRefs)
      if (found !== null) return found
      const branch = this._quickValidate(this._stripCustomValidators(ifSchema as JSONSchemaInput), data) ? source['then'] : source['else']
      const branchFound = this._findDeclaredAsyncCustomValidatorPath(branch, data, path, rootSchema, seen, seenRefs)
      if (branchFound !== null) return branchFound
    }

    for (const key of ['not', 'unevaluatedItems', 'unevaluatedProperties']) {
      const found = this._findDeclaredAsyncCustomValidatorPath(source[key], data, path, rootSchema, seen, seenRefs)
      if (found !== null) return found
    }

    return null
  }

  private _isDeclaredAsyncFunction(value: unknown): boolean {
    return typeof value === 'function' && value.constructor.name === 'AsyncFunction'
  }

  private _createAsyncValidationNotSupportedError(path: string, options: ValidateOptions): ValidationErrorItem {
    const message = this._getMessageText('ASYNC_VALIDATION_NOT_SUPPORTED', {}, options, 'customValidator')
    return {
      message,
      path,
      keyword: '_customValidators',
      kind: 'schema',
      code: 'ASYNC_VALIDATION_NOT_SUPPORTED',
      params: {},
      field: path,
      type: '_customValidators',
    }
  }

  private _joinPath(base: string, child: string): string {
    return base ? `${base}/${child}` : child
  }

  private _validateAjvSkippedProperties(
    schema: JSONSchemaInput,
    data: unknown,
    options: ValidateOptions,
    messages: ErrorMessages,
    locale: string,
    shouldFormat: boolean,
    path = '',
    seen = new WeakSet<object>()
  ): ValidationErrorItem[] {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return []

    const schemaObject = schema as object
    if (seen.has(schemaObject)) return []
    seen.add(schemaObject)

    const source = schema as Record<string, unknown>
    const errors: ValidationErrorItem[] = []
    const dataRecord = data && typeof data === 'object' && !Array.isArray(data)
      ? data as Record<string, unknown>
      : null
    const properties = source['properties']
    const required = Array.isArray(source['required']) ? source['required'].map(String) : []

    for (const propertyName of AJV_SKIPPED_PROPERTY_NAMES) {
      const hasOwnData = !!dataRecord && Object.prototype.hasOwnProperty.call(dataRecord, propertyName)
      if (required.includes(propertyName) && !hasOwnData) {
        errors.push(...this._formatErrors([{
          keyword: 'required',
          instancePath: path ? `/${path}` : '',
          params: { missingProperty: propertyName },
          message: `must have required property '${propertyName}'`,
          parentSchema: source,
        }], messages, locale, shouldFormat, options))
      }

      if (properties && typeof properties === 'object' && !Array.isArray(properties)
        && Object.prototype.hasOwnProperty.call(properties, propertyName)
        && hasOwnData) {
        const childSchema = (properties as Record<string, JSONSchemaInput>)[propertyName]
        const childResult = this._validateInternal(childSchema, dataRecord[propertyName], options)
        if (!childResult.valid) {
          const childPath = this._joinPath(path, propertyName)
          errors.push(...(childResult.errors ?? []).map(error => this._prefixSkippedPropertyError(error, childPath)))
        }
      }
    }

    if (properties && typeof properties === 'object' && !Array.isArray(properties) && dataRecord) {
      for (const [key, childSchema] of Object.entries(properties as Record<string, JSONSchemaInput>)) {
        if ((AJV_SKIPPED_PROPERTY_NAMES as readonly string[]).includes(key)) continue
        if (!Object.prototype.hasOwnProperty.call(dataRecord, key)) continue
        errors.push(...this._validateAjvSkippedProperties(
          childSchema,
          dataRecord[key],
          options,
          messages,
          locale,
          shouldFormat,
          this._joinPath(path, key),
          seen
        ))
      }
    }

    const allOf = source['allOf']
    if (Array.isArray(allOf)) {
      for (const child of allOf) {
        errors.push(...this._validateAjvSkippedProperties(child as JSONSchemaInput, data, options, messages, locale, shouldFormat, path, seen))
      }
    }

    const anyOf = source['anyOf']
    if (Array.isArray(anyOf) && !anyOf.some(child => Validator.quickValidate(child as JSONSchemaInput, data))) {
      errors.push(...this._formatErrors([{
        keyword: 'anyOf',
        instancePath: path ? `/${path}` : '',
        params: {},
        message: 'must match a schema in anyOf',
        parentSchema: source,
      }], messages, locale, shouldFormat, options))
    }

    const oneOf = source['oneOf']
    if (Array.isArray(oneOf)) {
      const matches = oneOf.filter(child => Validator.quickValidate(child as JSONSchemaInput, data)).length
      if (matches !== 1) {
        errors.push(...this._formatErrors([{
          keyword: 'oneOf',
          instancePath: path ? `/${path}` : '',
          params: { passingSchemas: null },
          message: 'must match exactly one schema in oneOf',
          parentSchema: source,
        }], messages, locale, shouldFormat, options))
      }
    }

    const ifSchema = source['if']
    if (ifSchema && typeof ifSchema === 'object' && !Array.isArray(ifSchema)) {
      const branch = Validator.quickValidate(ifSchema as JSONSchemaInput, data)
        ? source['then']
        : source['else']
      if (branch && typeof branch === 'object' && !Array.isArray(branch)) {
        errors.push(...this._validateAjvSkippedProperties(branch as JSONSchemaInput, data, options, messages, locale, shouldFormat, path, seen))
      }
    }

    const notSchema = source['not']
    if (notSchema && typeof notSchema === 'object' && !Array.isArray(notSchema) && Validator.quickValidate(notSchema as JSONSchemaInput, data)) {
      errors.push(...this._formatErrors([{
        keyword: 'not',
        instancePath: path ? `/${path}` : '',
        params: {},
        message: 'must NOT be valid',
        parentSchema: source,
      }], messages, locale, shouldFormat, options))
    }

    if (Array.isArray(data)) {
      const prefixItems = source['prefixItems']
      const prefixItemCount = Array.isArray(prefixItems) ? prefixItems.length : 0
      if (Array.isArray(prefixItems)) {
        for (let index = 0; index < data.length && index < prefixItems.length; index++) {
          errors.push(...this._validateAjvSkippedProperties(
            prefixItems[index] as JSONSchemaInput,
            data[index],
            options,
            messages,
            locale,
            shouldFormat,
            this._joinPath(path, String(index)),
            seen
          ))
        }
      }

      const items = source['items']
      if (items && typeof items === 'object' && !Array.isArray(items)) {
        for (let index = prefixItemCount; index < data.length; index++) {
          errors.push(...this._validateAjvSkippedProperties(
            items as JSONSchemaInput,
            data[index],
            options,
            messages,
            locale,
            shouldFormat,
            this._joinPath(path, String(index)),
            seen
          ))
        }
      }

      const contains = source['contains']
      if (contains && typeof contains === 'object' && !Array.isArray(contains) && !data.some(item => Validator.quickValidate(contains as JSONSchemaInput, item))) {
        errors.push(...this._formatErrors([{
          keyword: 'contains',
          instancePath: path ? `/${path}` : '',
          params: {},
          message: 'must contain at least one valid item',
          parentSchema: source,
        }], messages, locale, shouldFormat, options))
      }
    }

    return errors
  }

  private _prefixSkippedPropertyError(error: ValidationErrorItem, path: string): ValidationErrorItem {
    const record = error as unknown as Record<string, unknown>
    const rawPath =
      typeof record['path'] === 'string'
        ? record['path']
        : typeof record['instancePath'] === 'string'
          ? record['instancePath'].replace(/^\//, '')
          : ''
    const ownPath = !rawPath || rawPath === 'value' ? '' : rawPath
    const nextPath = ownPath ? this._joinPath(path, ownPath) : path
    return {
      ...error,
      path: nextPath,
      field: nextPath,
    }
  }

  private _resolveLocalRef(rootSchema: unknown, ref: string): unknown {
    if (!ref.startsWith('#')) return undefined
    if (ref === '#') return rootSchema
    if (!ref.startsWith('#/')) return undefined

    let current = rootSchema
    for (const rawSegment of ref.slice(2).split('/')) {
      if (!current || typeof current !== 'object') return undefined
      const segment = this._decodeJsonPointerSegment(rawSegment)
      current = (current as Record<string, unknown>)[segment]
    }
    return current
  }

  private _decodeJsonPointerSegment(segment: string): string {
    let decoded = segment
    try {
      decoded = decodeURIComponent(segment)
    } catch {
      decoded = segment
    }
    return decoded.replace(/~1/g, '/').replace(/~0/g, '~')
  }

  private _prewarmBatchCompileCache(schema: JSONSchemaInput): void {
    if (!this._cache.options.enabled || this._cache.options.maxSize <= 0) return
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return
    if (typeof (schema as Record<string, unknown>)['toSchema'] === 'function') return

    const internalSchema = schema as InternalSchema
    if (internalSchema._isConditional || internalSchema._removeAdditional) return

    try {
      const cacheKey = this._getSchemaCacheKey(schema)
      const metadata = this._getSchemaRuntimeMetadata(schema, cacheKey)
      if (metadata.hasConditionals) return
      this._compileWithManagedCache(schema, cacheKey)
    } catch {
      // Preserve validateBatch() behavior: each item reports compile errors through validate().
    }
  }

  private _createPatternMatcher(pattern: string): RegExp | null {
    if (!this._cache.options.enabled || this._cache.options.maxSize <= 0) {
      return this._compilePatternMatcher(pattern)
    }

    if (this._patternMatcherCache.has(pattern)) {
      const matcher = this._patternMatcherCache.get(pattern) ?? null
      this._touchPatternMatcher(pattern, matcher)
      return matcher
    }

    const matcher = this._compilePatternMatcher(pattern)
    this._rememberPatternMatcher(pattern, matcher)
    return matcher
  }

  private _compilePatternMatcher(pattern: string): RegExp | null {
    try {
      return new RegExp(pattern)
    } catch {
      return null
    }
  }

  private _rememberPatternMatcher(pattern: string, matcher: RegExp | null): void {
    const maxSize = Math.max(1, this._cache.options.maxSize)
    while (this._patternMatcherCache.size >= maxSize) {
      const oldestKey = this._patternMatcherCache.keys().next().value as string | undefined
      if (oldestKey === undefined) return
      this._patternMatcherCache.delete(oldestKey)
    }
    this._patternMatcherCache.set(pattern, matcher)
  }

  private _touchPatternMatcher(pattern: string, matcher: RegExp | null): void {
    this._patternMatcherCache.delete(pattern)
    this._patternMatcherCache.set(pattern, matcher)
  }

  private _getSchemaCacheKey(schema: JSONSchemaInput): string {
    const markedKey = typeof schema === 'object'
      ? (schema as SchemaCacheKeyCarrier)[SCHEMA_DSL_CACHE_KEY]
      : undefined
    if (typeof markedKey === 'string' && markedKey) return markedKey

    const structuralKey = createSchemaCacheKey(schema)
    if (structuralKey) return structuralKey

    if (!schema || typeof schema !== 'object') return `schema:${String(schema)}`

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

  private _compileWithManagedCache(schema: JSONSchemaInput, cacheKey: string): AjvValidateFn {
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
    schema: JSONSchemaInput,
    cacheKey: string,
    schemaRefs: Map<string, JSONSchemaInput>,
    lru: Map<string, true>,
    cache?: CacheManager,
    values?: Map<string, AjvValidateFn>
  ): AjvValidateFn {
    if (!this._cache.options.enabled || this._cache.options.maxSize <= 0) {
      const validate = ajv.compile(schema)
      if (schema && typeof schema === 'object') ajv.removeSchema(schema)
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
    schemaRefs: Map<string, JSONSchemaInput>,
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
    schemaRefs: Map<string, JSONSchemaInput>,
    lru: Map<string, true>,
    cache?: CacheManager,
    values?: Map<string, AjvValidateFn>
  ): void {
    const schemaRef = schemaRefs.get(cacheKey)
    if (schemaRef && typeof schemaRef === 'object') {
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
    schemaRefs: Map<string, JSONSchemaInput>,
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
    shouldFormat: boolean,
    options: ValidateOptions = {}
  ): ValidationErrorItem[] {
    const selectedErrors = options.allErrors === false ? rawErrors.slice(0, 1) : rawErrors
    if (!shouldFormat) return selectedErrors as ValidationErrorItem[]
    const localeMessages = this._getMessageTable(locale, options)
    // Only merge when there are custom messages (avoid unnecessary object spread)
    const mergedMessages: ErrorMessages =
      Object.keys(messages).length === 0
        ? localeMessages
        : { ...localeMessages, ...messages }
    // alreadyMerged=true: mergedMessages already contains locale+custom, skip re-expansion inside formatDetailed
    return this._errorFormatter.formatDetailed(selectedErrors as Parameters<ErrorFormatter['formatDetailed']>[0], locale, mergedMessages, true)
  }

  private _getMessageTable(locale: string, options: ValidateOptions): ErrorMessages {
    if (this._messageTableProvider) {
      return this._messageTableProvider(options, locale)
    }
    return this._getFlatLocaleMessages(locale)
  }

  private _normalizeErrorMessages(messages: unknown): ErrorMessages {
    if (!messages || typeof messages !== 'object' || Array.isArray(messages)) return {}
    return Object.fromEntries(
      Object.entries(messages as Record<string, unknown>).map(([key, value]) => [
        key,
        value == null
          ? undefined
          : typeof value === 'string'
            ? value
            : typeof value === 'object' && 'message' in value
              ? String((value as { message: unknown }).message)
              : String(value),
      ])
    ) as ErrorMessages
  }

  private _getMessageText(
    key: string,
    params: Record<string, unknown>,
    options: ValidateOptions,
    source: RuntimeIssueSource
  ): string {
    if (this._messageResolver) {
      return this._messageResolver(key, params, options, source)
    }
    const locale = options.locale ?? Locale.getLocale()
    const normalizedMessages = Object.fromEntries(
      Object.entries(this._normalizeErrorMessages(options.messages ?? {}))
        .filter((entry): entry is [string, string] => entry[1] !== undefined)
    )
    return Locale.getMessageText(key, normalizedMessages, locale)
  }

  private _runWithActiveOptions<T>(options: ValidateOptions, fn: () => T): T {
    const previous = this._activeValidateOptions
    this._activeValidateOptions = options
    try {
      return fn()
    } finally {
      this._activeValidateOptions = previous
    }
  }

  private _internalError<T>(error: unknown, data: T): ValidationResult<T> {
    const isSchemaError = error instanceof SchemaCompileError
    const message = isSchemaError
      ? error.message
      : `Validation error: ${error instanceof Error ? error.message : String(error)}`
    return {
      valid: false,
      data,
      errors: [{
        message,
        path: '',
        keyword: isSchemaError ? 'schema' : 'error',
        kind: isSchemaError ? 'schema' : 'internal',
        code: isSchemaError ? error.code : 'VALIDATION_INTERNAL_ERROR',
        params: {},
      }],
      errorMessage: message,
    }
  }
}
