/**
 * schema-dsl v2 — main entry point
 *
 * Fix IX-01: VERSION is read dynamically from package.json instead of being hard-coded
 *
 * @module schema-dsl
 * @version package.json
 */

// ==================== Version (fix IX-01) ====================
import pkg from '../package.json' with { type: 'json' }
export const VERSION: string = (pkg as { version: string }).version

// ==================== Core classes ====================
export { Validator } from './core/Validator.js'
export { JSONSchemaCore } from './core/JSONSchemaCore.js'
export { DslBuilder } from './core/DslBuilder.js'
export { ConditionalBuilder } from './core/ConditionalBuilder.js'
export { ObjectDslBuilder } from './core/ObjectDslBuilder.js'
export { Locale } from './core/Locale.js'
export { CacheManager } from './core/CacheManager.js'
export { ErrorFormatter } from './core/ErrorFormatter.js'
export { MessageTemplate } from './core/MessageTemplate.js'
export { renderTemplate } from './core/TemplateEngine.js'
export { PluginManager } from './core/PluginManager.js'

// ==================== Parser layer ====================
export { TypeRegistry } from './parser/TypeRegistry.js'
export type {
  SchemaDslDiagnostic,
  SchemaDslUnknownTypeMode,
  TypeDefinition,
  TypeResolveOptions,
} from './parser/TypeRegistry.js'

// ==================== Error classes ====================
export { ValidationError } from './errors/ValidationError.js'
export { I18nError } from './errors/I18nError.js'

// ==================== String extensions ====================
export { uninstallStringExtensions } from './core/StringExtensions.js'

// ==================== Exporters ====================
export {
  BaseExporter,
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,
  MarkdownExporter,
} from './exporters/index.js'

// ==================== Utilities ====================
export { TypeConverter, SchemaHelper, SchemaUtils } from './utils/index.js'

// ==================== Validator extensions ====================
export { CustomKeywords } from './validators/CustomKeywords.js'

// ==================== Constants ====================
export { VALIDATION, CACHE, FORMATS, PATTERN_IPV4, PATTERN_IPV6 } from './config/constants.js'
export { ErrorCodes } from './core/ErrorCodes.js'
export { PATTERNS } from './config/patterns.js'

// ==================== Type exports ====================
export type { JSONSchema, SchemaIOOptions } from './types/schema.js'
export type { ErrorMessages, ErrorCodeMap, ErrorMessageConfig, LocaleMessages } from './types/error.js'

export type {
  IDslBuilder,
  DslDefinition,
  DslField,
  DslInput,
  DslFn,
  DslIfFn,
  DslConditionMarker,
  DslErrorNamespace,
  DslFactoryInput,
  DslNamespaceFactories,
  DslExtensionDefinition,
  DslExtensionFactory,
  DslExtensionNamespaceFactories,
  DslExtensionParamDefinition,
  DslExtensionParamKind,
  DslExtensionParamValue,
  DslExtensionParamsDefinition,
  DslExtensionParamsObject,
  DslExtensionSchemaFactory,
  DslExtensionSegmentMode,
  DslWithExtensions,
  NormalizedDslExtensionDefinition,
} from './types/dsl.js'

export type {
  ValidateOptions,
  ValidationResult,
  ValidationErrorItem,
} from './types/validate.js'

export type { DslConfigOptions, I18nConfig, CacheOptions, CacheManagerOptions, ValidatorOptions } from './types/config.js'
// v1 BC: CacheConfig was renamed to CacheOptions in v2
export type { CacheOptions as CacheConfig } from './types/config.js'
export type { Plugin, HookFn, HookName, HookContext, PluginManagerOptions } from './types/plugin.js'

export type { IConditionalBuilder } from './types/conditional.js'

export type {
  InferSchema,
  InferJsonSchema,
  InferDslDefinition,
  InferDslString,
} from './types/infer.js'

export type {
  ExporterOptions,
  MongoDBExporterOptions,
  MySQLExporterOptions,
  PostgreSQLExporterOptions,
  MarkdownExporterOptions,
} from './exporters/index.js'

// ==================== dsl function (main API) ====================

import { DslBuilder as _DslBuilder } from './core/DslBuilder.js'
import { TypeRegistry as _TypeRegistry } from './parser/TypeRegistry.js'
import { DslParser as _DslParser } from './parser/DslParser.js'
import { DslAdapter as _DslAdapter } from './adapters/DslAdapter.js'
import { attachDslNamespaceFactories as _attachDslNamespaceFactories, resetDslNamespaceExtensions as _resetDslNamespaceExtensions } from './adapters/DslNamespace.js'
import { DEFAULT_DSL_EXTENSION_REGISTRY as _DEFAULT_DSL_EXTENSION_REGISTRY } from './parser/DslExtensionRegistry.js'
import { ConditionalBuilder as _ConditionalBuilder } from './core/ConditionalBuilder.js'
import { Locale as _Locale } from './core/Locale.js'
import { installStringExtensions as _install } from './core/StringExtensions.js'
import { PATTERNS as _PATTERNS } from './config/patterns.js'
import * as _CONSTANTS from './config/constants.js'
import * as _exporters from './exporters/index.js'
import { Validator as _Validator, SCHEMA_DSL_CACHE_KEY as _SCHEMA_DSL_CACHE_KEY, createSchemaCacheKey as _createSchemaCacheKey } from './core/Validator.js'
import { I18nError as _I18nError } from './errors/I18nError.js'
import type { LocaleMessage as _LocaleMessage } from './locales/types.js'
import type { JSONSchema as _JSONSchema } from './types/schema.js'
import type { SchemaIOOptions as _SchemaIOOptions } from './types/schema.js'
import type {
  DslConditionMarker as _DslConditionMarker,
  DslDefinition as _DslDefinition,
  DslExtensionDefinition as _DslExtensionDefinition,
  DslFn as _DslFn,
  DslWithExtensions as _DslWithExtensions,
  IDslBuilder as _IDslBuilder,
  NormalizedDslExtensionDefinition as _NormalizedDslExtensionDefinition,
} from './types/dsl.js'
import type { IConditionalBuilder as _IConditionalBuilder } from './types/conditional.js'
import type { DslConfigOptions as _DslConfigOptions } from './types/config.js'
import type { ValidationResult as _ValidationResult } from './types/validate.js'
import type { SchemaDslDiagnostic as _SchemaDslDiagnostic, SchemaDslUnknownTypeMode as _SchemaDslUnknownTypeMode } from './parser/TypeRegistry.js'
import JSON5 from 'json5'
import { createRequire } from 'node:module'
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

type _DslBuilderPublic = _DslBuilder & _IDslBuilder
type _DslParseOptions = NonNullable<Parameters<typeof _DslParser.parseString>[1]>

export const CONSTANTS = _CONSTANTS
export const exporters = _exporters

// Import all default locales for automatic initialization
import * as _locales from './locales/index.js'

  // Initialize default locales at module load time
  ; (() => {
    for (const [locale, messages] of Object.entries(_locales)) {
      _Locale.addLocale(locale, messages as Record<string, string>)
    }
  })()

// ==================== smartCoerceTypes ====================

// Perf O5b: pre-compute the set of coercible field candidates for a schema
// Avoids scanning all keys of `data` on every smartCoerceTypes call.
// Only iterates fields that may need coercion (numbers/arrays/objects).
type _CoerceCandidates = {
  numbers: string[]   // fields with type: 'number' | 'integer'
  booleans: string[]  // fields with type: 'boolean'
  arrays: Array<{ key: string; itemType: 'number' | 'integer' | 'boolean' }>
  objects: Array<{ key: string; schema: _JSONSchema }>   // nested objects with properties
} | null   // null = no coercible fields

const _coerceCandidatesCache = new WeakMap<object, _CoerceCandidates>()

function _getCoerceCandidates(schema: _JSONSchema): _CoerceCandidates {
  const schemaObj = schema as object
  const cached = _coerceCandidatesCache.get(schemaObj)
  if (cached !== undefined) return cached

  const props = schema.properties as Record<string, _JSONSchema> | undefined
  if (!props) {
    _coerceCandidatesCache.set(schemaObj, null)
    return null
  }

  const numbers: string[] = []
  const booleans: string[] = []
  const arrays: Array<{ key: string; itemType: 'number' | 'integer' | 'boolean' }> = []
  const objects: Array<{ key: string; schema: _JSONSchema }> = []

  for (const [key, f] of Object.entries(props)) {
    const ft = f.type
    if (f.enum && !((ft === 'number' || ft === 'integer') && f.enum.every(v => typeof v === 'number')) && !(ft === 'boolean' && f.enum.every(v => typeof v === 'boolean'))) {
      continue
    }
    if (ft === 'number' || ft === 'integer') {
      numbers.push(key)
    } else if (ft === 'boolean') {
      booleans.push(key)
    } else if (ft === 'array' && (f.items as _JSONSchema | undefined)?.type === 'number') {
      arrays.push({ key, itemType: 'number' })
    } else if (ft === 'array' && (f.items as _JSONSchema | undefined)?.type === 'integer') {
      arrays.push({ key, itemType: 'integer' })
    } else if (ft === 'array' && (f.items as _JSONSchema | undefined)?.type === 'boolean') {
      arrays.push({ key, itemType: 'boolean' })
    } else if (ft === 'object' && f.properties) {
      objects.push({ key, schema: f })
    }
  }

  const result: _CoerceCandidates = (numbers.length || booleans.length || arrays.length || objects.length)
    ? { numbers, booleans, arrays, objects }
    : null
  _coerceCandidatesCache.set(schemaObj, result)
  return result
}

function _coerceNumber(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (trimmed === '') return value
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : value
}

function _coerceBoolean(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim().toLowerCase()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  return value
}

function smartCoerceTypes(data: unknown, schema: _JSONSchema): unknown {
  if (!data || typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map(item => smartCoerceTypes(item, schema))
  }

  // O5b: use pre-computed candidate list instead of Object.keys(data) scan
  // Only processes fields known to potentially need coercion
  const candidates = _getCoerceCandidates(schema)
  if (!candidates) return data   // fast path: no coercible fields

  let result: Record<string, unknown> | null = null
  const src = data as Record<string, unknown>

  for (const key of candidates.numbers) {
    const value = src[key]
    const converted = _coerceNumber(value)
    if (converted !== value) {
      if (!result) result = { ...src }
      result[key] = converted
    }
  }

  for (const key of candidates.booleans) {
    const value = src[key]
    const converted = _coerceBoolean(value)
    if (converted !== value) {
      if (!result) result = { ...src }
      result[key] = converted
    }
  }

  for (const { key, itemType } of candidates.arrays) {
    const value = src[key]
    if (Array.isArray(value)) {
      const converted = value.map(item => {
        if (itemType === 'boolean') return _coerceBoolean(item)
        return _coerceNumber(item)
      })
      if (!result) result = { ...src }
      result[key] = converted
    }
  }

  for (const { key, schema: nestedSchema } of candidates.objects) {
    const value = src[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const converted = smartCoerceTypes(value, nestedSchema)
      if (converted !== value) {
        if (!result) result = { ...src }
        result[key] = converted
      }
    }
  }

  return result ?? data   // return original when no conversion needed (zero-copy)
}

// ==================== Top-level schema normalization (raw DSL object support) ====================

const _JSON_SCHEMA_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'])

function _isRawJsonSchemaLike(obj: Record<string, unknown>): boolean {
  if (typeof obj['type'] === 'string' && _JSON_SCHEMA_TYPES.has(obj['type'] as string)) return true
  if ('anyOf' in obj || 'oneOf' in obj || 'allOf' in obj || '$ref' in obj || '$defs' in obj || 'definitions' in obj) return true

  const props = obj['properties']
  if (props && typeof props === 'object' && !Array.isArray(props)) {
    const values = Object.values(props as Record<string, unknown>)
    if (values.length === 0) return true
    if (values.every(value => value && typeof value === 'object' && !Array.isArray(value) && _isRawJsonSchemaLike(value as Record<string, unknown>))) {
      return true
    }
  }

  const items = obj['items']
  if (items && typeof items === 'object' && !Array.isArray(items)) {
    return _isRawJsonSchemaLike(items as Record<string, unknown>)
  }

  return false
}

function _isDslObject(schema: unknown): schema is _DslDefinition {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false

  const obj = schema as Record<string, unknown>
  if (typeof obj['toSchema'] === 'function') return false
  if (obj['_isConditional']) return false

  return !_isRawJsonSchemaLike(obj)
}

// Perf O6: cache _normalizeSchemaInput results for immutable raw JSON Schema objects only.
// Plain DSL definition objects ({ email: 'email!' }) are mutable — skip cache to prevent
// stale results when the caller mutates the object between validate() calls (N-04 fix).
const _normalizeSchemaCache = new WeakMap<object, _JSONSchema>()

function _markSchemaCacheKey(schema: _JSONSchema): _JSONSchema {
  const cacheKey = _createSchemaCacheKey(schema)
  if (!cacheKey || !schema || typeof schema !== 'object') return schema

  try {
    Object.defineProperty(schema, _SCHEMA_DSL_CACHE_KEY, {
      value: cacheKey,
      enumerable: false,
      configurable: true,
    })
  } catch {
    // Non-extensible schemas still validate; Validator falls back to runtime key generation.
  }

  return schema
}

function _normalizeSchemaInput(schema: _JSONSchema | _DslDefinition | _IDslBuilder | _IConditionalBuilder): _JSONSchema {
  if (!schema || typeof schema !== 'object') return schema as _JSONSchema

  const obj = schema as Record<string, unknown>
  if (typeof obj['toSchema'] === 'function') {
    // Mutable builders: never cache — schema changes as chain methods are called
    return _markSchemaCacheKey((obj['toSchema'] as () => _JSONSchema)())
  }
  if (_isDslObject(schema)) {
    // Plain DSL definition objects are mutable — skip cache
    return _markSchemaCacheKey(_DslAdapter.parseObject(schema, _defaultParseOptions()).toSchema())
  }
  // Raw JSON Schema objects: safe to cache (treated as immutable by convention)
  const schemaObj = schema as object
  const cached = _normalizeSchemaCache.get(schemaObj)
  if (cached !== undefined) return cached
  const result = schema as _JSONSchema
  _normalizeSchemaCache.set(schemaObj, result)
  return result
}

// ==================== i18n locale directory scan ====================

const _LOCALE_NAME_RE = /^[a-z]{2,3}(-[A-Z]{2,4})?$/
const _LOCALE_REQUIRE_EXTENSIONS = new Set(['.js', '.cjs', '.json'])
const _LOCALE_TEXT_EXTENSIONS = new Set(['.jsonc', '.json5'])

function _normalizeLocaleModule(moduleValue: unknown): Record<string, _LocaleMessage> | null {
  if (!moduleValue || typeof moduleValue !== 'object' || Array.isArray(moduleValue)) return null

  const raw = moduleValue as Record<string, unknown>
  const keys = Object.keys(raw)
  const defaultValue = raw['default']
  const nonMetaKeys = keys.filter(key => key !== '__esModule' && key !== 'default')

  if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue) && nonMetaKeys.length === 0) {
    return defaultValue as Record<string, _LocaleMessage>
  }

  return raw as Record<string, _LocaleMessage>
}

function _loadLocaleFile(fullPath: string, ext: string, _require: NodeRequire): Record<string, _LocaleMessage> | null {
  if (_LOCALE_TEXT_EXTENSIONS.has(ext)) {
    const rawText = readFileSync(fullPath, 'utf8')
    return _normalizeLocaleModule(JSON5.parse(rawText) as Record<string, _LocaleMessage>)
  }

  if (_LOCALE_REQUIRE_EXTENSIONS.has(ext)) {
    return _normalizeLocaleModule(_require(fullPath) as Record<string, _LocaleMessage>)
  }

  return null
}

function _loadLocalesFromDir(dirPath: string, strict = false): void {
  let _require: NodeRequire
  try {
    // ESM: import.meta.url is defined
    _require = createRequire(import.meta.url)
  } catch {
    // CJS fallback: import.meta.url is undefined
    _require = typeof require !== 'undefined' ? require : createRequire(__filename)
  }

  // Track registered keys per locale for conflict detection
  const registeredKeys = new Map<string, Map<string, string>>() // locale → key → filePath

  function scanDir(dir: string): void {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      let stat
      try {
        stat = statSync(fullPath)
      } catch {
        continue
      }
      if (stat.isDirectory()) {
        scanDir(fullPath)
      } else {
        const ext = extname(entry).toLowerCase()
        if (!_LOCALE_REQUIRE_EXTENSIONS.has(ext) && !_LOCALE_TEXT_EXTENSIONS.has(ext)) continue

        const locale = basename(entry, ext)
        // Only load files that look like locale identifiers (e.g., zh-CN, en-US, zh, en)
        if (_LOCALE_NAME_RE.test(locale)) {
          try {
            const messages = _loadLocaleFile(fullPath, ext, _require)
            if (messages && typeof messages === 'object') {
              // Conflict detection
              if (!registeredKeys.has(locale)) registeredKeys.set(locale, new Map())
              const localeKeys = registeredKeys.get(locale)!
              for (const key of Object.keys(messages)) {
                if (localeKeys.has(key)) {
                  const prevFile = localeKeys.get(key)!
                  if (strict) {
                    throw new Error(
                      `i18n locale "${locale}" key conflict: "${key}" is defined in both "${prevFile}" and "${fullPath}"`
                    )
                  } else {
                    console.warn(
                      `[schema-dsl] i18n key conflict: "${locale}:${key}" is defined in "${prevFile}" and "${fullPath}" (using latter)`
                    )
                  }
                }
                localeKeys.set(key, fullPath)
              }
              _Locale.addLocale(locale, messages as Record<string, _LocaleMessage>)
            }
          } catch (err) {
            // Re-throw in strict mode; silently skip in default mode
            if (strict && err instanceof Error && err.message.includes('i18n locale')) throw err
          }
        }
      }
    }
  }

  scanDir(dirPath)
}

// ==================== dsl.config ====================

function _dslConfig(options: Partial<_DslConfigOptions> = {}): void {
  const strict = (options as Record<string, unknown>)['strict'] === true
  _TypeRegistry.setStrict(strict)

  if (options.patterns) {
    const p = options.patterns as Record<string, unknown>
    if (p['phone']) Object.assign(_PATTERNS.phone, p['phone'])
    if (p['idCard']) Object.assign(_PATTERNS.idCard, p['idCard'])
    if (p['creditCard']) Object.assign(_PATTERNS.creditCard, p['creditCard'])
  }

  // Legacy phone/idCard/creditCard at top level (v1 compat)
  const raw = options as Record<string, unknown>
  if (raw['phone'] && typeof raw['phone'] === 'object') Object.assign(_PATTERNS.phone, raw['phone'])
  if (raw['idCard'] && typeof raw['idCard'] === 'object') Object.assign(_PATTERNS.idCard, raw['idCard'])
  if (raw['creditCard'] && typeof raw['creditCard'] === 'object') Object.assign(_PATTERNS.creditCard, raw['creditCard'])

  // Cache configuration — update default validator's cache options
  const cacheConfig = (options as Record<string, unknown>)['cache'] as Record<string, unknown> | undefined
  if (cacheConfig && typeof cacheConfig === 'object') {
    const validator = _getDefaultValidator()
    // Merge with existing options to preserve unspecified defaults
    validator.cache.options = {
      ...validator.cache.options,
      ...cacheConfig,
    } as Partial<{ maxSize: number; ttl: number; enabled: boolean; statsEnabled: boolean }>
  }

  if (options.i18n) {
    if (typeof options.i18n === 'string') {
      // Directory path: scan recursively for locale files
      _loadLocalesFromDir(options.i18n, strict)
    } else if (typeof options.i18n === 'object' && 'localesPath' in options.i18n) {
      // { localesPath: string } form
      _loadLocalesFromDir((options.i18n as { localesPath: string }).localesPath, strict)
    } else if (typeof options.i18n === 'object' && 'locales' in options.i18n) {
      // v1 / docs compat: { locales: { locale: messages } }
      const locales = (options.i18n as { locales: Record<string, Record<string, string>> }).locales
      for (const [locale, messages] of Object.entries(locales ?? {})) {
        _Locale.addLocale(locale, messages)
      }
    } else if (typeof options.i18n === 'object' && !Array.isArray(options.i18n)) {
      // Inline { locale: messages } mapping
      for (const [locale, messages] of Object.entries(options.i18n)) {
        _Locale.addLocale(locale, messages as Record<string, string>)
      }
    }
  }
}

// ==================== Default Validator singleton ====================

let _defaultValidator: InstanceType<typeof _Validator> | null = null
let _noCoerceValidator: InstanceType<typeof _Validator> | null = null

function _getDefaultValidator(): InstanceType<typeof _Validator> {
  if (!_defaultValidator) _defaultValidator = new _Validator()
  return _defaultValidator
}

function _getNoCoerceValidator(): InstanceType<typeof _Validator> {
  if (!_noCoerceValidator) _noCoerceValidator = new _Validator({ coerceTypes: false })
  return _noCoerceValidator
}

export { _getDefaultValidator as getDefaultValidator }

/**
 * Reset the default Validator singleton (useful for cleaning up state in test environments)
 */
export function resetDefaultValidator(): void {
  _defaultValidator = null
  _noCoerceValidator = null
}

// Initial PATTERNS snapshot — used by resetRuntimeState() to restore user-overridden values
const _INITIAL_PATTERNS = {
  phone: { ..._PATTERNS.phone },
  idCard: { ..._PATTERNS.idCard },
  creditCard: { ..._PATTERNS.creditCard },
}

function _defaultParseOptions(options: _DslParseOptions = {}): _DslParseOptions {
  return {
    ...options,
    extensionRegistry: _DEFAULT_DSL_EXTENSION_REGISTRY,
  }
}

/**
 * Reset global runtime state that may leak across tests, workers, or tenants.
 */
export function resetRuntimeState(): void {
  resetDefaultValidator()
  _DslBuilder.clearCustomTypes()
  _resetDslNamespaceExtensions(_dslWithNS)
  _DEFAULT_DSL_EXTENSION_REGISTRY.clear()
  _Locale.reset()
  _TypeRegistry.setStrict(false)
  _restorePatternGroup(_PATTERNS.phone, _INITIAL_PATTERNS.phone)
  _restorePatternGroup(_PATTERNS.idCard, _INITIAL_PATTERNS.idCard)
  _restorePatternGroup(_PATTERNS.creditCard, _INITIAL_PATTERNS.creditCard)
}

function _restorePatternGroup<T>(target: Record<string, T>, snapshot: Record<string, T>): void {
  for (const key of Object.keys(target)) delete target[key]
  Object.assign(target, snapshot)
}

// ==================== Convenience validation functions ====================

/**
 * Convenience validate function (uses the default Validator singleton).
 * Automatically coerces string → number when options.coerce !== false.
 */
export function validate<T = unknown>(
  schema: _JSONSchema | _DslDefinition | _IDslBuilder | _IConditionalBuilder,
  data: unknown,
  options: Record<string, unknown> = {},
): _ValidationResult<T> {
  const normalizedSchema = _normalizeSchemaInput(schema)
  const shouldCoerce = options['coerce'] !== false
  // O5b: use candidate-field cache instead of _hasCoercibleFields + Object.keys scan
  const coercedData = shouldCoerce && _getCoerceCandidates(normalizedSchema)
    ? smartCoerceTypes(data, normalizedSchema)
    : data
  const validator = shouldCoerce ? _getDefaultValidator() : _getNoCoerceValidator()
  return validator.validate(normalizedSchema, coercedData as T, options)
}

/**
 * Convenience async validate function
 */
export async function validateAsync<T = unknown>(
  schema: _JSONSchema | _DslDefinition | _IDslBuilder | _IConditionalBuilder,
  data: unknown,
  options: Record<string, unknown> = {},
): Promise<T> {
  const normalizedSchema = _normalizeSchemaInput(schema)
  const shouldCoerce = options['coerce'] !== false
  // O5b: use candidate-field cache instead of _hasCoercibleFields + Object.keys scan
  const coercedData = shouldCoerce && _getCoerceCandidates(normalizedSchema)
    ? smartCoerceTypes(data, normalizedSchema)
    : data
  const validator = shouldCoerce ? _getDefaultValidator() : _getNoCoerceValidator()
  return validator.validateAsync(normalizedSchema, coercedData as T, options)
}

// ==================== dsl main function ====================

// Core dsl function: string → DslBuilder & IDslBuilder (chain), object definition → JSONSchema
// v1 BC: keep the optional 2nd SchemaIOOptions parameter even though v2 no longer
// needs it during object compilation. Existing consumers such as vext still call
// dsl(definition, options), so the overload remains source-compatible.
function _dslFn(def: string, options?: _SchemaIOOptions): _DslBuilderPublic
function _dslFn(def: _DslDefinition, options?: _SchemaIOOptions): _JSONSchema
function _dslFn(def: unknown, _options?: _SchemaIOOptions): _DslBuilderPublic | _JSONSchema {
  if (typeof def === 'string') return new _DslBuilder(def, { parseOptions: _defaultParseOptions() }) as _DslBuilderPublic
  if (def === null || def === undefined || typeof def !== 'object' || Array.isArray(def)) {
    throw new Error('[schema-dsl] Invalid DSL definition: expected string or object')
  }
  return _markSchemaCacheKey(_DslAdapter.parseObject(def as _DslDefinition, _defaultParseOptions()).toSchema() as _JSONSchema)
}

// Namespace shape (mirrors DslFn interface in types/dsl.ts)
const _dslWithNS = _dslFn as unknown as _DslFn

_dslWithNS.config = _dslConfig

function _dslIf(condition: string, thenSchema: unknown, elseSchema?: unknown): _DslConditionMarker
function _dslIf(condition: (data: unknown) => boolean): ReturnType<typeof _ConditionalBuilder.start>
function _dslIf(condition: string | ((data: unknown) => boolean), thenSchema?: unknown, elseSchema?: unknown): _DslConditionMarker | ReturnType<typeof _ConditionalBuilder.start> {
  // When only a string is passed (no thenSchema), it's invalid — condition must be a function
  // When a string + thenSchema are passed, the string is a field name reference (v1 compat)
  if (typeof condition !== 'function' && thenSchema === undefined) {
    throw new Error('Condition must be a function')
  }
  if (typeof condition === 'string') {
    return _DslAdapter.if(condition, thenSchema, elseSchema) as _DslConditionMarker
  }
  return _ConditionalBuilder.start(condition)
}

_dslWithNS.if = _dslIf
_dslWithNS._if = _dslIf

_dslWithNS.match = (field: unknown, cases: Record<string, unknown>): _DslConditionMarker => {
  return _DslAdapter.match(String(field), cases) as _DslConditionMarker
}

_dslWithNS.error = {
  create: _I18nError.create.bind(_I18nError),
  throw: _I18nError.throw.bind(_I18nError),
  assert: _I18nError.assert.bind(_I18nError),
}

_attachDslNamespaceFactories(_dslWithNS, {
  createBuilder: definition => new _DslBuilder(definition, { parseOptions: _defaultParseOptions() }) as _DslBuilderPublic,
  createBuilderFromSchema: schema => _DslBuilder.fromSchema(schema, { parseOptions: _defaultParseOptions() }) as _DslBuilderPublic,
  parseObject: definition => _markSchemaCacheKey(_DslAdapter.parseObject(definition, _defaultParseOptions()).toSchema() as _JSONSchema),
  registerType: (name, schema) => _DslBuilder.registerType(name, schema),
  typeExists: name => _TypeRegistry.has(name),
  extensionRegistry: _DEFAULT_DSL_EXTENSION_REGISTRY,
})

export function defineExtension(definition: _DslExtensionDefinition): _NormalizedDslExtensionDefinition {
  return _dslWithNS.defineExtension(definition)
}

export function registerExtension(definition: _DslExtensionDefinition): void {
  _dslWithNS.registerExtension(definition)
}

export function registerExtensions<const Definitions extends readonly unknown[]>(
  definitions: readonly [...Definitions]
): _DslWithExtensions<Definitions> {
  return _dslWithNS.registerExtensions(definitions)
}

/**
 * dsl — main API entry point
 *
 * @example
 * // String DSL → DslBuilder & IDslBuilder (chainable)
 * const builder = dsl('email!').label('Email address')
 *
 * @example
 * // Object DSL → JSON Schema
 * const schema = dsl({ email: 'email!', name: 'string:2-32!' })
 */
export const dsl = _dslWithNS

export const s = _dslWithNS

export default dsl

export const config = _dslConfig

export function installStringExtensions(dslFunction: Parameters<typeof _install>[0] = _dslWithNS as unknown as Parameters<typeof _install>[0]): void {
  _install(dslFunction)
}

export interface CompileWithDiagnosticsOptions {
  unknownType?: _SchemaDslUnknownTypeMode
}

export interface CompileWithDiagnosticsResult {
  schema: _JSONSchema
  diagnostics: _SchemaDslDiagnostic[]
}

/**
 * Compile a DSL string or object and return structured diagnostics without
 * mutating global strict-mode state.
 */
export function compileWithDiagnostics(
  definition: string | _DslDefinition,
  options: CompileWithDiagnosticsOptions = {}
): CompileWithDiagnosticsResult {
  const diagnostics: _SchemaDslDiagnostic[] = []
  const parseOptions = {
    unknownType: options.unknownType ?? 'warn',
    diagnostics,
    emitWarning: false,
    throwOnError: false,
    extensionRegistry: _DEFAULT_DSL_EXTENSION_REGISTRY,
  } satisfies Parameters<typeof _DslParser.parseString>[1]

  const schema = typeof definition === 'string'
    ? _TypeRegistry.toJsonSchema(_DslParser.parseString(definition, parseOptions))
    : _markSchemaCacheKey(_DslParser.parseObject(definition, parseOptions))

  return { schema, diagnostics }
}

