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
import { isRawJsonSchemaLike as _isRawJsonSchemaLike } from './utils/schemaInput.js'
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
export { SchemaCompileError } from './errors/SchemaCompileError.js'

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
export type { JSONSchema, JSONSchemaInput, SchemaIOOptions } from './types/schema.js'
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

import {
  DslBuilder as _DslBuilder,
  DSL_BUILDER_FAST_VALIDATE as _DSL_BUILDER_FAST_VALIDATE,
  DSL_BUILDER_VALIDATION_SCHEMA as _DSL_BUILDER_VALIDATION_SCHEMA,
  DSL_BUILDER_VALIDATION_SIGNATURE as _DSL_BUILDER_VALIDATION_SIGNATURE,
} from './core/DslBuilder.js'
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
import { ValidationError as _ValidationError } from './errors/ValidationError.js'
import {
  applySmartCoerce as _applySmartCoerce,
  getSchemaCoerceCandidates as _getSchemaCoerceCandidates,
  type SchemaCoerceCandidates as _SchemaCoerceCandidates,
} from './core/SchemaRuntimeMetadataStore.js'
import {
  compileValidationPlan as _compileValidationPlan,
  type ValidationPlan as _ValidationPlan,
  type ValidationPlanUnsupportedReason as _ValidationPlanUnsupportedReason,
} from './core/ValidationPlan.js'
import type { LocaleMessage as _LocaleMessage } from './locales/types.js'
import type { JSONSchema as _JSONSchema, JSONSchemaInput as _JSONSchemaInput } from './types/schema.js'
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
import type { ValidationErrorItem as _ValidationErrorItem, ValidationResult as _ValidationResult } from './types/validate.js'
import type { SchemaDslDiagnostic as _SchemaDslDiagnostic, SchemaDslUnknownTypeMode as _SchemaDslUnknownTypeMode } from './parser/TypeRegistry.js'
import JSON5 from 'json5'
import { createRequire } from 'node:module'
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

type _DslBuilderPublic = _DslBuilder & _IDslBuilder
type _DslParseOptions = NonNullable<Parameters<typeof _DslParser.parseString>[1]>
type _CachedValidationPlan = {
  plan: _ValidationPlan | null
  reason: _ValidationPlanUnsupportedReason | null
}
type _RootFastValidationEntry = {
  cacheKey?: string
  plan: _ValidationPlan | null
  directMask?: number
  coerceCandidates?: _SchemaCoerceCandidates | null
  preCoerceCandidates?: _SchemaCoerceCandidates | null
  signature?: string
  shapeGuard?: _RootSchemaShapeGuard
}
type _RootSchemaShapeGuard = {
  objects: _RootSchemaObjectShapeGuard[]
  valueObjects: _RootSchemaObjectValueGuard[]
  arrays: _RootSchemaArrayGuard[]
}
type _RootSchemaObjectShapeGuard = {
  ref: Record<string, unknown>
  keys: string[]
  exact: boolean
}
type _RootSchemaObjectValueGuard = {
  ref: Record<string, unknown>
  keys: string[]
  values: unknown[]
  exact: boolean
}
type _RootSchemaArrayGuard = {
  ref: unknown[]
  length: number
  keys?: string[]
  values?: unknown[]
  exact: boolean
}
type _RootSchemaWatcherOptions = {
  wrapEntries?: boolean
}

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

// ==================== Top-level schema normalization (raw DSL object support) ====================

function _isDslObject(schema: unknown): schema is _DslDefinition {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false

  const obj = schema as Record<string, unknown>
  if (typeof obj['toSchema'] === 'function') return false
  if (obj['_isConditional']) return false

  return !_isRawJsonSchemaLike(obj)
}

// Perf O6: cache _normalizeSchemaInput results for raw JSON Schema object identity.
// Plain DSL definition objects ({ email: 'email!' }) are mutable — skip cache to prevent
// stale results when the caller mutates the object between validate() calls (N-04 fix).
// User-owned raw JSON Schema objects are not marked with a fixed schema key; root fast-cache
// entries install write-time invalidation for existing schema fields so hot reads stay fast.
const _normalizeSchemaCache = new WeakMap<object, _JSONSchema>()
type _CachedCoerceCandidates = {
  cacheKey: string
  candidates: _SchemaCoerceCandidates | null
}
let _coerceCandidatesCache = new WeakMap<object, _CachedCoerceCandidates>()
let _validationPlanCache = new Map<string, _CachedValidationPlan>()
let _rootFastValidationCache = new WeakMap<object, _RootFastValidationEntry>()
let _runtimeSchemaKeyCache = new WeakMap<object, string>()
let _runtimeSchemaKeyCounter = 0
const _rootSchemaDynamicContainerProxyCache = new WeakMap<object, Record<string | symbol, unknown>>()
const _rootSchemaDynamicContainerProxies = new WeakSet<object>()
const _VALIDATION_PLAN_CACHE_MAX_SIZE = 5000
const _EMPTY_VALIDATION_ERRORS = Object.freeze([]) as []
const _ROOT_SCHEMA_WATCH_KEYS = [
  '$comment',
  '$defs',
  '$id',
  '$ref',
  '$schema',
  '_customMessages',
  '_customValidators',
  '_description',
  '_evaluateCondition',
  '_isConditional',
  '_label',
  '_required',
  '_runtimeOnlyConditional',
  '_whenConditions',
  'additionalProperties',
  'allOf',
  'alphanum',
  'anyOf',
  'const',
  'contains',
  'dateFormat',
  'dateGreater',
  'dateLess',
  'default',
  'definitions',
  'dependencies',
  'dependentSchemas',
  'description',
  'else',
  'enum',
  'examples',
  'exactLength',
  'exclusiveMaximum',
  'exclusiveMinimum',
  'format',
  'idCard',
  'if',
  'includesRequired',
  'items',
  'jsonString',
  'lowercase',
  'maxItems',
  'maxLength',
  'maximum',
  'minItems',
  'minLength',
  'minimum',
  'multipleOf',
  'not',
  'oneOf',
  'passwordStrength',
  'pattern',
  'patternProperties',
  'port',
  'precision',
  'prefixItems',
  'properties',
  'propertyNames',
  'regex',
  'required',
  'requiredAll',
  'strictSchema',
  'then',
  'title',
  'trim',
  'type',
  'unevaluatedItems',
  'unevaluatedProperties',
  'unique',
  'uniqueItems',
  'uppercase',
  'validate',
] as const
const _ROOT_SCHEMA_ARRAY_MUTATORS = [
  'copyWithin',
  'fill',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift',
] as const
const _ROOT_SCHEMA_DYNAMIC_KEY_CONTAINER_KEYS = new Set([
  '$defs',
  'definitions',
  'dependencies',
  'dependentSchemas',
  'patternProperties',
  'properties',
])

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

function _normalizeSchemaInput(schema: _JSONSchemaInput | _DslDefinition | _IDslBuilder | _IConditionalBuilder): _JSONSchemaInput {
  if (!schema || typeof schema !== 'object') return schema as _JSONSchemaInput

  const obj = schema as Record<string, unknown>
  if (typeof obj['toSchema'] === 'function') {
    // Mutable builders: never cache — schema changes as chain methods are called
    return _markSchemaCacheKey((obj['toSchema'] as () => _JSONSchema)())
  }
  const schemaObj = schema as object
  const cached = _normalizeSchemaCache.get(schemaObj)
  if (cached !== undefined) return cached

  if (_isDslObject(schema)) {
    // Plain DSL definition objects are mutable — skip cache
    return _markSchemaCacheKey(_DslAdapter.parseObject(schema, _defaultParseOptions()).toSchema())
  }
  // Raw JSON Schema objects are caller-owned. Cache only the normalized identity, not a fixed key.
  const result = schema as _JSONSchema
  _normalizeSchemaCache.set(schemaObj, result)
  return result
}

function _getCachedSchemaCoerceCandidates(schema: _JSONSchemaInput, cacheKeyOverride?: string | null): _SchemaCoerceCandidates | null {
  if (!schema || typeof schema !== 'object') return null

  const markedKey = (schema as Record<symbol, unknown>)[_SCHEMA_DSL_CACHE_KEY]
  const cacheKey = cacheKeyOverride
    || (typeof markedKey === 'string' && markedKey
      ? markedKey
      : _createSchemaCacheKey(schema))
  if (!cacheKey) return _getSchemaCoerceCandidates(schema)

  const cached = _coerceCandidatesCache.get(schema)
  if (cached?.cacheKey === cacheKey) return cached.candidates

  const candidates = _getSchemaCoerceCandidates(schema)
  _coerceCandidatesCache.set(schema, { cacheKey, candidates })
  return candidates
}

function _getSchemaCacheKey(schema: _JSONSchemaInput): string | null {
  if (!schema || typeof schema !== 'object') return null
  const markedKey = (schema as Record<symbol, unknown>)[_SCHEMA_DSL_CACHE_KEY]
  if (typeof markedKey === 'string' && markedKey) return markedKey
  const structuralKey = _createSchemaCacheKey(schema)
  if (structuralKey) return structuralKey
  let runtimeKey = _runtimeSchemaKeyCache.get(schema)
  if (!runtimeKey) {
    runtimeKey = `root_schema_${++_runtimeSchemaKeyCounter}`
    _runtimeSchemaKeyCache.set(schema, runtimeKey)
  }
  return runtimeKey
}

function _createRootSchemaShapeGuard(schema: _JSONSchema, exhaustiveValues = false): _RootSchemaShapeGuard {
  const guard: _RootSchemaShapeGuard = { objects: [], valueObjects: [], arrays: [] }
  _collectRootSchemaShapeGuard(schema, guard, new WeakSet<object>(), {
    trackValues: true,
    exhaustiveValues,
    exactObjects: true,
    exactArrays: true,
  }, null)
  return guard
}

function _createRootSchemaMutationGuard(schema: _JSONSchema): _RootSchemaShapeGuard {
  const guard: _RootSchemaShapeGuard = { objects: [], valueObjects: [], arrays: [] }
  _collectRootSchemaShapeGuard(schema, guard, new WeakSet<object>(), {
    trackValues: false,
    exhaustiveValues: false,
    exactObjects: false,
    exactArrays: false,
  }, null)
  return guard
}

function _isRootSchemaShapeGuardCurrent(schema: _JSONSchema, guard: _RootSchemaShapeGuard | undefined): boolean {
  if (!guard) return true
  if (guard.objects[0] && schema !== guard.objects[0].ref) return false

  for (const objectGuard of guard.objects) {
    if (objectGuard.exact && Object.keys(objectGuard.ref).length !== objectGuard.keys.length) return false
    for (const key of objectGuard.keys) {
      if (!Object.prototype.hasOwnProperty.call(objectGuard.ref, key)) return false
    }
  }

  for (const objectGuard of guard.valueObjects) {
    const keys = objectGuard.exact ? Object.keys(objectGuard.ref) : objectGuard.keys
    if (objectGuard.exact && keys.length !== objectGuard.keys.length) return false

    for (let index = 0; index < objectGuard.keys.length; index++) {
      const key = objectGuard.keys[index]
      if (objectGuard.exact && keys[index] !== key) return false
      if (objectGuard.ref[key] !== objectGuard.values[index]) return false
    }
  }

  for (const arrayGuard of guard.arrays) {
    if (arrayGuard.ref.length !== arrayGuard.length) return false
    if (arrayGuard.exact && Object.keys(arrayGuard.ref).length !== (arrayGuard.keys?.length ?? 0)) return false
    if (arrayGuard.keys) {
      for (const key of arrayGuard.keys) {
        if (!Object.prototype.hasOwnProperty.call(arrayGuard.ref, key)) return false
      }
    }
    if (!arrayGuard.values) continue

    for (let index = 0; index < arrayGuard.length; index++) {
      if (arrayGuard.ref[index] !== arrayGuard.values[index]) return false
    }
  }

  return true
}

function _collectRootSchemaShapeGuard(
  value: unknown,
  guard: _RootSchemaShapeGuard,
  seen: WeakSet<object>,
  options: { trackValues: boolean; exhaustiveValues: boolean; exactObjects: boolean; exactArrays: boolean },
  parentKey: string | null,
): void {
  if (!value || typeof value !== 'object') return

  const objectValue = value as object
  if (seen.has(objectValue)) return
  seen.add(objectValue)

  if (Array.isArray(value)) {
    const keys = Object.keys(value)
    guard.arrays.push(options.exhaustiveValues
      ? { ref: value, length: value.length, keys, values: value.slice(), exact: options.exactArrays }
      : { ref: value, length: value.length, keys, exact: options.exactArrays })
    for (const item of value) {
      _collectRootSchemaShapeGuard(item, guard, seen, {
        trackValues: false,
        exhaustiveValues: options.exhaustiveValues,
        exactObjects: options.exactObjects,
        exactArrays: options.exactArrays,
      }, null)
    }
    return
  }

  const source = value as Record<string, unknown>
  const keys = Object.keys(source)
  const isDynamicContainer = parentKey !== null && _ROOT_SCHEMA_DYNAMIC_KEY_CONTAINER_KEYS.has(parentKey)
  const isWatchedDynamicContainer = isDynamicContainer
    && _rootSchemaDynamicContainerProxies.has(objectValue)
  const exactObject = options.exactObjects || (isDynamicContainer && !isWatchedDynamicContainer)
  if (!isWatchedDynamicContainer || options.exactObjects) {
    guard.objects.push({ ref: source, keys, exact: exactObject })
  }
  if ((options.trackValues || options.exhaustiveValues) && (!isWatchedDynamicContainer || options.exactObjects)) {
    guard.valueObjects.push({
      ref: source,
      keys,
      values: keys.map(key => source[key]),
      exact: exactObject,
    })
  }

  for (const key of keys) {
    _collectRootSchemaShapeGuard(source[key], guard, seen, {
      trackValues: false,
      exhaustiveValues: options.exhaustiveValues,
      exactObjects: options.exactObjects,
      exactArrays: options.exactArrays,
    }, key)
  }
}

function _invalidateRootSchemaCaches(): void {
  _coerceCandidatesCache = new WeakMap<object, _CachedCoerceCandidates>()
  _validationPlanCache = new Map<string, _CachedValidationPlan>()
  _rootFastValidationCache = new WeakMap<object, _RootFastValidationEntry>()
  _runtimeSchemaKeyCache = new WeakMap<object, string>()
  _runtimeSchemaKeyCounter = 0
  _defaultValidator?.clearCache()
  _noCoerceValidator?.clearCache()
}

function _installRootSchemaMutationWatchers(
  value: unknown,
  seen = new WeakSet<object>(),
  options: _RootSchemaWatcherOptions = {},
  parentKey: string | null = null,
): boolean {
  if (!value || typeof value !== 'object') return true

  const objectValue = value as object
  if (seen.has(objectValue)) return true
  seen.add(objectValue)

  const source = value as Record<string, unknown>
  const shouldWrapEntries = options.wrapEntries !== false
  const isDynamicKeyContainer = parentKey !== null && _ROOT_SCHEMA_DYNAMIC_KEY_CONTAINER_KEYS.has(parentKey)
  const keys = Array.isArray(value) || isDynamicKeyContainer
    ? Object.keys(source)
    : _rootSchemaWatcherKeys(source)
  let fullyWatched = true
  if (Array.isArray(value) && !_installRootSchemaArrayMutationWatchers(value)) {
    fullyWatched = false
  }

  for (const key of keys) {
    if (key === '__proto__') continue
    const descriptor = Object.getOwnPropertyDescriptor(source, key)
    if (!descriptor) {
      if (shouldWrapEntries && !Array.isArray(value) && !_installRootSchemaMissingKeywordWatcher(source, key)) {
        fullyWatched = false
      }
      continue
    }

    let child = source[key]
    child = _rootSchemaWatchedDynamicContainerValue(key, child)
    // Dynamic containers still wrap existing keys so raw caller-held refs invalidate caches on assignment.
    if (shouldWrapEntries && descriptor?.configurable && 'value' in descriptor && descriptor.writable !== false) {
      if (!_installRootSchemaExistingKeywordWatcher(source, key, descriptor, child)) {
        fullyWatched = false
      }
    } else if (shouldWrapEntries && (!descriptor?.configurable || !('value' in descriptor) || descriptor.writable === false)) {
      fullyWatched = false
    }
    if (!_installRootSchemaMutationWatchers(child, seen, { wrapEntries: true }, key)) {
      fullyWatched = false
    }
  }
  return fullyWatched
}

function _rootSchemaWatcherKeys(source: Record<string, unknown>): string[] {
  const keys = Object.keys(source)
  for (const key of _ROOT_SCHEMA_WATCH_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) keys.push(key)
  }
  return keys
}

function _installRootSchemaExistingKeywordWatcher(
  source: Record<string, unknown>,
  key: string,
  descriptor: PropertyDescriptor,
  initialValue: unknown = descriptor.value,
): boolean {
  let current = initialValue
  try {
    Object.defineProperty(source, key, {
      enumerable: descriptor.enumerable === true,
      configurable: true,
      get: () => current,
      set: (next: unknown) => {
        const watchedNext = _rootSchemaWatchedDynamicContainerValue(key, next)
        if (watchedNext !== current) {
          current = watchedNext
          _invalidateRootSchemaCaches()
          return
        }
        current = watchedNext
      },
    })
    return true
  } catch {
    // Non-configurable or exotic schema objects still validate; they just use the exact guard.
    return false
  }
}

function _rootSchemaWatchedDynamicContainerValue(key: string, value: unknown): unknown {
  if (!_ROOT_SCHEMA_DYNAMIC_KEY_CONTAINER_KEYS.has(key)) return value
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value

  const objectValue = value as object
  if (_rootSchemaDynamicContainerProxies.has(objectValue)) return value

  const cached = _rootSchemaDynamicContainerProxyCache.get(objectValue)
  if (cached) return cached

  const target = value as Record<string | symbol, unknown>
  const proxy = new Proxy(target, {
    set(currentTarget, property, next, receiver) {
      const previous = Reflect.get(currentTarget, property, receiver)
      const result = Reflect.set(currentTarget, property, next, receiver)
      if (result && previous !== next) _invalidateRootSchemaCaches()
      return result
    },
    deleteProperty(currentTarget, property) {
      const existed = Object.prototype.hasOwnProperty.call(currentTarget, property)
      const result = Reflect.deleteProperty(currentTarget, property)
      if (result && existed) _invalidateRootSchemaCaches()
      return result
    },
    defineProperty(currentTarget, property, descriptor) {
      const previous = Reflect.getOwnPropertyDescriptor(currentTarget, property)
      const result = Reflect.defineProperty(currentTarget, property, descriptor)
      if (result && previous !== descriptor) _invalidateRootSchemaCaches()
      return result
    },
  })
  _rootSchemaDynamicContainerProxyCache.set(objectValue, proxy)
  _rootSchemaDynamicContainerProxies.add(proxy)
  return proxy
}

function _installRootSchemaMissingKeywordWatcher(source: Record<string, unknown>, key: string): boolean {
  if (!Object.isExtensible(source)) return false
  try {
    Object.defineProperty(source, key, {
      enumerable: false,
      configurable: true,
      get: () => undefined,
      set: (next: unknown) => {
        try {
          Object.defineProperty(source, key, {
            value: next,
            enumerable: true,
            configurable: true,
            writable: true,
          })
        } finally {
          _invalidateRootSchemaCaches()
        }
      },
    })
    return true
  } catch {
    return false
  }
}

function _installRootSchemaArrayMutationWatchers(array: unknown[]): boolean {
  let fullyWatched = true
  for (const method of _ROOT_SCHEMA_ARRAY_MUTATORS) {
    const descriptor = Object.getOwnPropertyDescriptor(array, method)
    if (descriptor && (!descriptor.configurable || typeof descriptor.value !== 'function')) {
      fullyWatched = false
      continue
    }

    try {
      Object.defineProperty(array, method, {
        value: (...args: unknown[]) => {
          const result = (Array.prototype[method] as (...items: unknown[]) => unknown).apply(array, args)
          _invalidateRootSchemaCaches()
          return result
        },
        enumerable: false,
        configurable: true,
        writable: true,
      })
    } catch {
      fullyWatched = false
    }
  }
  return fullyWatched
}

function _rememberValidationPlan(cacheKey: string, entry: _CachedValidationPlan): void {
  if (_validationPlanCache.has(cacheKey)) _validationPlanCache.delete(cacheKey)
  _validationPlanCache.set(cacheKey, entry)
  while (_validationPlanCache.size > _VALIDATION_PLAN_CACHE_MAX_SIZE) {
    const oldestKey = _validationPlanCache.keys().next().value as string | undefined
    if (oldestKey === undefined) break
    _validationPlanCache.delete(oldestKey)
  }
}

function _getCachedValidationPlan(schema: _JSONSchemaInput, cacheKeyOverride?: string | null): _ValidationPlan | null {
  if (!schema || typeof schema !== 'object') return null
  if (_defaultValidator && !_defaultValidator.cache.options.enabled) return null

  const cacheKey = cacheKeyOverride || _getSchemaCacheKey(schema)
  if (!cacheKey) return null

  const cached = _validationPlanCache.get(cacheKey)
  if (cached) {
    _rememberValidationPlan(cacheKey, cached)
    return cached.plan
  }

  const result = _compileValidationPlan(schema, {
    cacheKey,
    ajvOptions: { coerceTypes: false, removeAdditional: false },
  })
  if (result.status === 'compiled') {
    _rememberValidationPlan(cacheKey, { plan: result.plan, reason: null })
    return result.plan
  }

  _rememberValidationPlan(cacheKey, { plan: null, reason: result.reason })
  return null
}

function _executeRootFastEntry<T>(
  entry: _RootFastValidationEntry,
  data: unknown,
  shouldCoerce: boolean
): _ValidationResult<T> | null {
  if (entry.directMask) {
    return _matchesRootPrimitiveTypeMask(data, entry.directMask)
      ? { valid: true, data: data as T, errors: _EMPTY_VALIDATION_ERRORS }
      : null
  }

  const validate = entry.plan?.validate
  if (!validate) return null
  if (shouldCoerce && entry.preCoerceCandidates && _hasLikelyCoercibleInput(data, entry.preCoerceCandidates)) {
    const coercedData = _applySmartCoerce(data, entry.preCoerceCandidates)
    if (coercedData !== data && validate(coercedData)) {
      return { valid: true, data: coercedData as T, errors: _EMPTY_VALIDATION_ERRORS }
    }
    return null
  }
  if (validate(data)) {
    return { valid: true, data: data as T, errors: _EMPTY_VALIDATION_ERRORS }
  }
  if (!shouldCoerce || !entry.coerceCandidates) return null

  const coercedData = _applySmartCoerce(data, entry.coerceCandidates)
  if (coercedData !== data && validate(coercedData)) {
    return { valid: true, data: coercedData as T, errors: _EMPTY_VALIDATION_ERRORS }
  }
  return null
}

function _hasLikelyCoercibleInput(data: unknown, candidates: _SchemaCoerceCandidates): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false

  const source = data as Record<string, unknown>
  for (const key of candidates.numbers) {
    if (_isCoercibleNumberString(source[key])) return true
  }
  for (const key of candidates.booleans) {
    if (_isCoercibleBooleanString(source[key])) return true
  }
  for (const { key, itemType } of candidates.arrays) {
    const value = source[key]
    if (!Array.isArray(value)) continue
    for (const item of value) {
      if (itemType === 'boolean'
        ? _isCoercibleBooleanString(item)
        : _isCoercibleNumberString(item)) {
        return true
      }
    }
  }
  for (const { key, candidates: nestedCandidates } of candidates.objects) {
    if (_hasLikelyCoercibleInput(source[key], nestedCandidates)) return true
  }

  return false
}

function _isCoercibleNumberString(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return trimmed !== '' && Number.isFinite(Number(trimmed))
}

function _isCoercibleBooleanString(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim().toLowerCase()
  return trimmed === 'true' || trimmed === 'false'
}

function _getSafePreCoerceCandidates(schema: _JSONSchemaInput): _SchemaCoerceCandidates | null {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null
  const props = (schema as _JSONSchema).properties as Record<string, _JSONSchema> | undefined
  if (!props) return null

  const numbers: string[] = []
  const booleans: string[] = []
  const arrays: _SchemaCoerceCandidates['arrays'] = []
  const objects: _SchemaCoerceCandidates['objects'] = []

  for (const [key, fieldSchema] of Object.entries(props)) {
    if (!fieldSchema || typeof fieldSchema !== 'object' || Array.isArray(fieldSchema)) continue

    const fieldType = _getSafePreCoercibleType(fieldSchema)
    if (fieldSchema.enum && !_isSafePreCoerceEnum(fieldSchema.enum, fieldType)) continue

    if (fieldType === 'number' || fieldType === 'integer') {
      numbers.push(key)
    } else if (fieldType === 'boolean') {
      booleans.push(key)
    } else if (_schemaTypeIncludes(fieldSchema, 'array')) {
      const itemSchema = fieldSchema.items
      const itemType = itemSchema && typeof itemSchema === 'object' && !Array.isArray(itemSchema)
        ? _getSafePreCoercibleType(itemSchema as _JSONSchema)
        : null
      if (itemType) arrays.push({ key, itemType })
    } else if (_schemaTypeIncludes(fieldSchema, 'object') && fieldSchema.properties) {
      const nestedCandidates = _getSafePreCoerceCandidates(fieldSchema)
      if (nestedCandidates) objects.push({ key, candidates: nestedCandidates })
    }
  }

  return numbers.length || booleans.length || arrays.length || objects.length
    ? { numbers, booleans, arrays, objects }
    : null
}

function _getSafePreCoercibleType(schema: _JSONSchema): 'number' | 'integer' | 'boolean' | null {
  const direct = _directSafePreCoercibleType(schema)
  if (direct) return direct

  for (const key of ['anyOf', 'oneOf'] as const) {
    const branches = schema[key]
    if (!Array.isArray(branches)) continue

    let target: 'number' | 'integer' | 'boolean' | null = null
    let safeNullableUnion = true

    for (const branch of branches) {
      if (!branch || typeof branch !== 'object' || Array.isArray(branch)) {
        safeNullableUnion = false
        break
      }

      const branchType = _directSafePreCoercibleType(branch as _JSONSchema)
      if (branchType) {
        if (target && target !== branchType) {
          safeNullableUnion = false
          break
        }
        target = branchType
      } else if (!_schemaTypeIncludes(branch as _JSONSchema, 'null')) {
        safeNullableUnion = false
        break
      }
    }

    if (safeNullableUnion && target) return target
  }

  return null
}

function _directSafePreCoercibleType(schema: _JSONSchema): 'number' | 'integer' | 'boolean' | null {
  const type = schema.type
  if (Array.isArray(type) && type.includes('string')) return null
  if (_schemaTypeIncludes(schema, 'number')) return 'number'
  if (_schemaTypeIncludes(schema, 'integer')) return 'integer'
  if (_schemaTypeIncludes(schema, 'boolean')) return 'boolean'
  return null
}

function _schemaTypeIncludes(schema: _JSONSchema, type: string): boolean {
  return schema.type === type || (Array.isArray(schema.type) && schema.type.includes(type))
}

function _isSafePreCoerceEnum(values: unknown[], type: 'number' | 'integer' | 'boolean' | null): boolean {
  if (type === 'number' || type === 'integer') {
    return values.every(value => typeof value === 'number' || value === null)
  }
  if (type === 'boolean') {
    return values.every(value => typeof value === 'boolean' || value === null)
  }
  return true
}

type _RootPrimitiveType = 'string' | 'number' | 'integer' | 'boolean' | 'null'
const _ROOT_PRIMITIVE_STRING_FLAG = 1
const _ROOT_PRIMITIVE_NUMBER_FLAG = 1 << 1
const _ROOT_PRIMITIVE_INTEGER_FLAG = 1 << 2
const _ROOT_PRIMITIVE_BOOLEAN_FLAG = 1 << 3
const _ROOT_PRIMITIVE_NULL_FLAG = 1 << 4

const _ROOT_PRIMITIVE_UNION_ANNOTATION_KEYS = new Set([
  '$id',
  '$schema',
  '$comment',
  'title',
  'description',
  'examples',
])

function _tryCreateRootPrimitiveUnionDirectMask(schema: _JSONSchema): number {
  const types = _collectRootPrimitiveUnionTypes(schema)
  return types ? _createRootPrimitiveTypeMask(types) : 0
}

function _collectRootPrimitiveUnionTypes(schema: _JSONSchema): _RootPrimitiveType[] | null {
  const source = schema as Record<string, unknown>
  const keys = Object.keys(source)

  if (Array.isArray(source['type'])) {
    if (!_onlyAllowedRootPrimitiveUnionKeys(keys, new Set(['type']))) return null
    return _normalizeRootPrimitiveTypes(source['type'])
  }

  const unionKey = Array.isArray(source['anyOf'])
    ? 'anyOf'
    : Array.isArray(source['oneOf'])
      ? 'oneOf'
      : null
  if (!unionKey) return null
  if (!_onlyAllowedRootPrimitiveUnionKeys(keys, new Set([unionKey]))) return null

  const types: _RootPrimitiveType[] = []
  const seen = new Set<_RootPrimitiveType>()
  for (const branch of source[unionKey] as unknown[]) {
    if (!branch || typeof branch !== 'object' || Array.isArray(branch)) return null
    const branchSource = branch as Record<string, unknown>
    if (!_onlyAllowedRootPrimitiveUnionKeys(Object.keys(branchSource), new Set(['type']))) return null
    const type = branchSource['type']
    if (!_isRootPrimitiveType(type) || seen.has(type)) return null
    seen.add(type)
    types.push(type)
  }

  if (unionKey === 'oneOf' && seen.has('number') && seen.has('integer')) return null
  return types.length > 1 ? types : null
}

function _onlyAllowedRootPrimitiveUnionKeys(keys: string[], structuralKeys: Set<string>): boolean {
  for (const key of keys) {
    if (!structuralKeys.has(key) && !_ROOT_PRIMITIVE_UNION_ANNOTATION_KEYS.has(key)) return false
  }
  return true
}

function _normalizeRootPrimitiveTypes(value: unknown[]): _RootPrimitiveType[] | null {
  const types: _RootPrimitiveType[] = []
  const seen = new Set<_RootPrimitiveType>()
  for (const item of value) {
    if (!_isRootPrimitiveType(item) || seen.has(item)) return null
    seen.add(item)
    types.push(item)
  }
  return types.length > 1 ? types : null
}

function _isRootPrimitiveType(value: unknown): value is _RootPrimitiveType {
  return value === 'string'
    || value === 'number'
    || value === 'integer'
    || value === 'boolean'
    || value === 'null'
}

function _createRootPrimitiveTypeMask(types: _RootPrimitiveType[]): number {
  let mask = 0
  for (const type of types) {
    switch (type) {
      case 'string':
        mask |= _ROOT_PRIMITIVE_STRING_FLAG
        break
      case 'number':
        mask |= _ROOT_PRIMITIVE_NUMBER_FLAG
        break
      case 'integer':
        mask |= _ROOT_PRIMITIVE_INTEGER_FLAG
        break
      case 'boolean':
        mask |= _ROOT_PRIMITIVE_BOOLEAN_FLAG
        break
      case 'null':
        mask |= _ROOT_PRIMITIVE_NULL_FLAG
        break
    }
  }
  return mask
}

function _matchesRootPrimitiveTypeMask(data: unknown, mask: number): boolean {
  switch (typeof data) {
    case 'string':
      return (mask & _ROOT_PRIMITIVE_STRING_FLAG) !== 0
    case 'number':
      return Number.isFinite(data)
        && ((mask & _ROOT_PRIMITIVE_NUMBER_FLAG) !== 0
          || ((mask & _ROOT_PRIMITIVE_INTEGER_FLAG) !== 0 && Number.isInteger(data)))
    case 'boolean':
      return (mask & _ROOT_PRIMITIVE_BOOLEAN_FLAG) !== 0
    default:
      return data === null && (mask & _ROOT_PRIMITIVE_NULL_FLAG) !== 0
  }
}

function _tryRootFastValidate<T>(
  schema: _JSONSchemaInput | _DslDefinition | _IDslBuilder | _IConditionalBuilder,
  data: unknown,
  shouldCoerce: boolean
): _ValidationResult<T> | null {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null
  if (_defaultValidator && !_defaultValidator.cache.options.enabled) return null

  const schemaObject = schema as object
  const source = schema as Record<string, unknown>
  if (source['_isConditional']) return null

  if (schema instanceof _DslBuilder) {
    return schema[_DSL_BUILDER_FAST_VALIDATE](data) as _ValidationResult<T> | null
  }

  const builderFastValidate = (schema as Record<PropertyKey, unknown>)[_DSL_BUILDER_FAST_VALIDATE]
  if (typeof builderFastValidate === 'function') {
    return (builderFastValidate as (data: unknown) => _ValidationResult<T> | null).call(schema, data)
  }

  const builderValidationSchema = (schema as Record<PropertyKey, unknown>)[_DSL_BUILDER_VALIDATION_SCHEMA]
  if (typeof builderValidationSchema === 'function') {
    const validationSchema = (builderValidationSchema as () => _JSONSchema).call(schema)
    const signatureValue = (validationSchema as Record<PropertyKey, unknown>)[_DSL_BUILDER_VALIDATION_SIGNATURE]
    const signature = typeof signatureValue === 'string' ? signatureValue : undefined
    const cached = signature ? _rootFastValidationCache.get(schemaObject) : undefined
    if (cached && cached.signature === signature) {
      return _executeRootFastEntry<T>(cached, data, shouldCoerce)
    }

    const normalizedSchema = (validationSchema as Record<symbol, unknown>)[_SCHEMA_DSL_CACHE_KEY]
      ? validationSchema
      : _markSchemaCacheKey(validationSchema)
    const plan = _getCachedValidationPlan(normalizedSchema)
    const coerceCandidates = _schemaMayHaveSmartCoerceCandidates(normalizedSchema)
      ? _getCachedSchemaCoerceCandidates(normalizedSchema)
      : null
    const preCoerceCandidates = coerceCandidates
      ? _getSafePreCoerceCandidates(normalizedSchema)
      : null
    const entry: _RootFastValidationEntry = signature
      ? { plan, coerceCandidates, preCoerceCandidates, signature }
      : { plan, coerceCandidates, preCoerceCandidates }
    if (signature) _rootFastValidationCache.set(schemaObject, entry)
    return _executeRootFastEntry<T>(entry, data, shouldCoerce)
  }

  if (typeof source['toSchema'] === 'function') return null

  const cached = _rootFastValidationCache.get(schemaObject)
  let cacheKey: string | null | undefined
  if (cached) {
    const markedKey = (schema as Record<symbol, unknown>)[_SCHEMA_DSL_CACHE_KEY]
    if (typeof markedKey === 'string' && markedKey) {
      return _executeRootFastEntry<T>(cached, data, shouldCoerce)
    }

    if (_isRootSchemaShapeGuardCurrent(schema as _JSONSchema, cached.shapeGuard)) {
      return _executeRootFastEntry<T>(cached, data, shouldCoerce)
    }

    _invalidateRootSchemaCaches()
  }

  if (_isDslObject(schema)) return null

  const normalizedSchema = schema as _JSONSchema
  const markedKey = (normalizedSchema as Record<symbol, unknown>)[_SCHEMA_DSL_CACHE_KEY]
  cacheKey = cacheKey ?? _getSchemaCacheKey(normalizedSchema)
  if (!cacheKey) return null

  const directMask = _tryCreateRootPrimitiveUnionDirectMask(normalizedSchema)
  const plan = directMask ? null : _getCachedValidationPlan(normalizedSchema, cacheKey)
  const coerceCandidates = !directMask && _schemaMayHaveSmartCoerceCandidates(normalizedSchema)
    ? _getCachedSchemaCoerceCandidates(normalizedSchema, cacheKey)
    : null
  const preCoerceCandidates = coerceCandidates
    ? _getSafePreCoerceCandidates(normalizedSchema)
    : null
  const hasMarkedKey = typeof markedKey === 'string' && markedKey
  const mutationWatchersInstalled = hasMarkedKey
    ? true
    : _installRootSchemaMutationWatchers(normalizedSchema, new WeakSet<object>(), { wrapEntries: true })
  const entry: _RootFastValidationEntry = typeof markedKey === 'string' && markedKey
    ? { cacheKey, plan, directMask, coerceCandidates, preCoerceCandidates }
    : {
      cacheKey,
      plan,
      directMask,
      coerceCandidates,
      preCoerceCandidates,
      shapeGuard: mutationWatchersInstalled
        ? _createRootSchemaMutationGuard(normalizedSchema)
        : _createRootSchemaShapeGuard(normalizedSchema, true),
    }
  _rootFastValidationCache.set(schemaObject, entry)

  return _executeRootFastEntry<T>(entry, data, shouldCoerce)
}

// ==================== i18n locale directory scan ====================

const _LOCALE_NAME_RE = /^[a-z]{2,3}(-[A-Z]{2,4})?$/
const _LOCALE_CODE_EXTENSIONS = new Set(['.js', '.cjs'])
const _LOCALE_REQUIRE_EXTENSIONS = new Set(['.json'])
const _LOCALE_TEXT_EXTENSIONS = new Set(['.jsonc', '.json5'])
const _LOCALE_EXTENSIONS = new Set([
  ..._LOCALE_CODE_EXTENSIONS,
  ..._LOCALE_REQUIRE_EXTENSIONS,
  ..._LOCALE_TEXT_EXTENSIONS,
])

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

function _loadLocaleFile(
  fullPath: string,
  ext: string,
  _require: NodeRequire,
  allowCodeLocaleFiles: boolean
): Record<string, _LocaleMessage> | null {
  if (_LOCALE_TEXT_EXTENSIONS.has(ext)) {
    const rawText = readFileSync(fullPath, 'utf8')
    return _normalizeLocaleModule(JSON5.parse(rawText) as Record<string, _LocaleMessage>)
  }

  if (_LOCALE_CODE_EXTENSIONS.has(ext)) {
    if (!allowCodeLocaleFiles) return null
    return _normalizeLocaleModule(_require(fullPath) as Record<string, _LocaleMessage>)
  }

  if (_LOCALE_REQUIRE_EXTENSIONS.has(ext)) {
    return _normalizeLocaleModule(_require(fullPath) as Record<string, _LocaleMessage>)
  }

  return null
}

function _loadLocalesFromDir(dirPath: string, strict = false, codeLocaleFiles: 'allow' | 'deny' = 'allow'): void {
  const allowCodeLocaleFiles = codeLocaleFiles !== 'deny'
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
        if (!_LOCALE_EXTENSIONS.has(ext)) continue

        const locale = basename(entry, ext)
        // Only load files that look like locale identifiers (e.g., zh-CN, en-US, zh, en)
        if (_LOCALE_NAME_RE.test(locale)) {
          try {
            const messages = _loadLocaleFile(fullPath, ext, _require, allowCodeLocaleFiles)
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
  const codeLocaleFiles = options.codeLocaleFiles === 'deny' ? 'deny' : 'allow'
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
      _loadLocalesFromDir(options.i18n, strict, codeLocaleFiles)
    } else if (typeof options.i18n === 'object' && 'localesPath' in options.i18n) {
      // { localesPath: string } form
      const i18nOptions = options.i18n as { localesPath: string; codeLocaleFiles?: 'allow' | 'deny' }
      _loadLocalesFromDir(i18nOptions.localesPath, strict, i18nOptions.codeLocaleFiles ?? codeLocaleFiles)
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
  _validationPlanCache = new Map<string, _CachedValidationPlan>()
  _rootFastValidationCache = new WeakMap<object, _RootFastValidationEntry>()
  _runtimeSchemaKeyCache = new WeakMap<object, string>()
  _runtimeSchemaKeyCounter = 0
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
  _coerceCandidatesCache = new WeakMap<object, _CachedCoerceCandidates>()
  _validationPlanCache = new Map<string, _CachedValidationPlan>()
  _rootFastValidationCache = new WeakMap<object, _RootFastValidationEntry>()
  _runtimeSchemaKeyCache = new WeakMap<object, string>()
  _runtimeSchemaKeyCounter = 0
  _Validator.clearQuickValidateCache()
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

const _PRE_COERCED_VALIDATE_OPTION = '__schemaDslPreCoerced'
const _EMPTY_VALIDATE_OPTIONS = Object.freeze({}) as Record<string, unknown>
const _EMPTY_PRE_COERCED_VALIDATE_OPTIONS = Object.freeze({
  [_PRE_COERCED_VALIDATE_OPTION]: true,
}) as Record<string, unknown>

function _shouldSmartCoerce(options: Record<string, unknown>): boolean {
  return options['coerce'] !== false && options['smartCoerce'] !== false && options['coerceTypes'] !== false
}

function _schemaMayHaveSmartCoerceCandidates(schema: _JSONSchemaInput): schema is _JSONSchema {
  return !!schema && typeof schema === 'object' && !Array.isArray(schema)
    && typeof (schema as Record<string, unknown>)['properties'] === 'object'
}

function _hasTopLevelCustomValidators(schema: unknown): boolean {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false
  const validators = (schema as Record<string, unknown>)['_customValidators']
  return Array.isArray(validators) && validators.length > 0
}

function _isSimpleAsyncCustomScalarSchema(schema: unknown): schema is _JSONSchema & { _customValidators: Array<(value: unknown) => unknown> } {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false
  const source = schema as Record<string, unknown>
  const type = source['type']
  if (type !== 'string' && type !== 'number' && type !== 'integer' && type !== 'boolean' && type !== 'null') return false
  if (!Array.isArray(source['_customValidators']) || source['_customValidators'].length === 0 || !source['_customValidators'].every(fn => typeof fn === 'function')) return false

  for (const key of Object.keys(source)) {
    if (key !== 'type' && key !== '_customValidators'
      && key !== '$id' && key !== '$schema' && key !== '$comment'
      && key !== 'title' && key !== 'description' && key !== 'examples'
      && key !== '_label' && key !== '_description' && key !== '_required' && key !== '_customMessages') {
      return false
    }
  }
  return true
}

function _matchesSimpleScalarType(type: unknown, data: unknown): boolean {
  switch (type) {
    case 'string':
      return typeof data === 'string'
    case 'number':
      return typeof data === 'number' && Number.isFinite(data)
    case 'integer':
      return typeof data === 'number' && Number.isInteger(data)
    case 'boolean':
      return typeof data === 'boolean'
    case 'null':
      return data === null
    default:
      return false
  }
}

async function _trySimpleAsyncCustomValidate<T>(
  schema: unknown,
  data: unknown,
  options: Record<string, unknown>
): Promise<{ handled: true; data: T } | { handled: false }> {
  if (options !== _EMPTY_VALIDATE_OPTIONS && Object.keys(options).length > 0) return { handled: false }
  if (!_isSimpleAsyncCustomScalarSchema(schema)) return { handled: false }
  if (!_matchesSimpleScalarType((schema as Record<string, unknown>)['type'], data)) return { handled: false }

  for (const validator of schema._customValidators) {
    let result: unknown
    try {
      result = await Promise.resolve(validator(data))
    } catch (error) {
      throw _createTopLevelCustomValidationError(error instanceof Error ? error.message : String(error), data)
    }

    if (result === false) {
      throw _createTopLevelCustomValidationError(_getTopLevelCustomValidationDefaultMessage(), data)
    }
    if (typeof result === 'string') {
      throw _createTopLevelCustomValidationError(result, data)
    }
    if (result !== null && typeof result === 'object' && (result as Record<string, unknown>)['error']) {
      throw _createTopLevelCustomValidationError(
        String((result as Record<string, unknown>)['message'] ?? _getTopLevelCustomValidationDefaultMessage()),
        data
      )
    }
  }

  return { handled: true, data: data as T }
}

function _trySimpleSyncCustomValidate<T>(
  schema: unknown,
  data: unknown,
  options: Record<string, unknown>
): _ValidationResult<T> | null {
  if (options !== _EMPTY_VALIDATE_OPTIONS && Object.keys(options).length > 0) return null
  if (!_isSimpleAsyncCustomScalarSchema(schema)) return null
  if (!_matchesSimpleScalarType((schema as Record<string, unknown>)['type'], data)) return null

  for (const validator of schema._customValidators) {
    let result: unknown
    try {
      result = validator(data)
    } catch (error) {
      return _createTopLevelCustomValidationResult(error instanceof Error ? error.message : String(error), data as T)
    }

    if (result && typeof result === 'object' && typeof (result as { then?: unknown }).then === 'function') {
      return _createTopLevelCustomValidationResult(_getTopLevelAsyncValidationNotSupportedMessage(), data as T)
    }
    if (result === false) {
      return _createTopLevelCustomValidationResult(_getTopLevelCustomValidationDefaultMessage(), data as T)
    }
    if (typeof result === 'string') {
      return _createTopLevelCustomValidationResult(result, data as T)
    }
    if (result !== null && typeof result === 'object' && (result as Record<string, unknown>)['error']) {
      return _createTopLevelCustomValidationResult(
        String((result as Record<string, unknown>)['message'] ?? _getTopLevelCustomValidationDefaultMessage()),
        data as T
      )
    }
  }

  return { valid: true, data: data as T, errors: _EMPTY_VALIDATION_ERRORS }
}

function _getTopLevelCustomValidationDefaultMessage(): string {
  return _Locale.getMessageText('CUSTOM_VALIDATION_FAILED')
}

function _getTopLevelAsyncValidationNotSupportedMessage(): string {
  return _Locale.getMessageText('ASYNC_VALIDATION_NOT_SUPPORTED')
}

function _createTopLevelCustomValidationError(message: string, data: unknown): _ValidationError {
  return new _ValidationError([_createTopLevelCustomValidationItem(message)], data)
}

function _createTopLevelCustomValidationResult<T>(message: string, data: T): _ValidationResult<T> {
  const item = _createTopLevelCustomValidationItem(message)
  return { valid: false, data, errors: [item], errorMessage: item.message }
}

function _createTopLevelCustomValidationItem(message: string): _ValidationErrorItem {
  return {
    message,
    path: '',
    keyword: '_customValidators',
    params: {},
    field: '',
    type: '_customValidators',
  }
}

/**
 * Convenience validate function (uses the default Validator singleton).
 * Automatically coerces string → number unless coerce/smartCoerce/coerceTypes is false.
 */
export function validate<T = unknown>(
  schema: _JSONSchemaInput | _DslDefinition | _IDslBuilder | _IConditionalBuilder,
  data: unknown,
  options: Record<string, unknown> = _EMPTY_VALIDATE_OPTIONS,
): _ValidationResult<T> {
  const shouldCoerce = _shouldSmartCoerce(options)
  const isFastBuilder = schema instanceof _DslBuilder
    && (!_defaultValidator || _defaultValidator.cache.options.enabled)
  if (isFastBuilder) {
    const builderFastResult = (schema as _DslBuilder)[_DSL_BUILDER_FAST_VALIDATE](data)
    if (builderFastResult) return builderFastResult as _ValidationResult<T>
  }

  const hasTopLevelCustomValidators = _hasTopLevelCustomValidators(schema)
  const directFastResult = isFastBuilder || hasTopLevelCustomValidators
    ? null
    : _tryRootFastValidate<T>(schema, data, shouldCoerce)
  if (directFastResult) return directFastResult

  const simpleCustomResult = _trySimpleSyncCustomValidate<T>(schema, data, options)
  if (simpleCustomResult) return simpleCustomResult

  const customSchemaFastResult = hasTopLevelCustomValidators && !isFastBuilder
    ? _tryRootFastValidate<T>(schema, data, shouldCoerce)
    : null
  if (customSchemaFastResult) return customSchemaFastResult

  const normalizedSchema = _normalizeSchemaInput(schema)
  const coerceCandidates = shouldCoerce && _schemaMayHaveSmartCoerceCandidates(normalizedSchema)
    ? _getCachedSchemaCoerceCandidates(normalizedSchema)
    : null
  const coercedData = coerceCandidates
    ? _applySmartCoerce(data, coerceCandidates)
    : data
  const validationPlan = _getCachedValidationPlan(normalizedSchema)
  if (validationPlan?.validate(coercedData)) {
    return { valid: true, data: coercedData as T, errors: _EMPTY_VALIDATION_ERRORS }
  }
  const validator = shouldCoerce ? _getDefaultValidator() : _getNoCoerceValidator()
  const validateOptions = shouldCoerce
    ? options === _EMPTY_VALIDATE_OPTIONS || Object.keys(options).length === 0
      ? _EMPTY_PRE_COERCED_VALIDATE_OPTIONS
      : { ...options, [_PRE_COERCED_VALIDATE_OPTION]: true }
    : options
  return validator.validate(normalizedSchema, coercedData as T, validateOptions)
}

/**
 * Convenience async validate function
 */
export async function validateAsync<T = unknown>(
  schema: _JSONSchemaInput | _DslDefinition | _IDslBuilder | _IConditionalBuilder,
  data: unknown,
  options: Record<string, unknown> = _EMPTY_VALIDATE_OPTIONS,
): Promise<T> {
  const simpleAsyncResult = await _trySimpleAsyncCustomValidate<T>(schema, data, options)
  if (simpleAsyncResult.handled) return simpleAsyncResult.data

  const normalizedSchema = _normalizeSchemaInput(schema)
  const shouldCoerce = _shouldSmartCoerce(options)
  const coerceCandidates = shouldCoerce && _schemaMayHaveSmartCoerceCandidates(normalizedSchema)
    ? _getCachedSchemaCoerceCandidates(normalizedSchema)
    : null
  const coercedData = coerceCandidates
    ? _applySmartCoerce(data, coerceCandidates)
    : data
  const validator = shouldCoerce ? _getDefaultValidator() : _getNoCoerceValidator()
  const validateOptions = shouldCoerce
    ? options === _EMPTY_VALIDATE_OPTIONS || Object.keys(options).length === 0
      ? _EMPTY_PRE_COERCED_VALIDATE_OPTIONS
      : { ...options, [_PRE_COERCED_VALIDATE_OPTION]: true }
    : options
  return validator.validateAsync(normalizedSchema, coercedData as T, validateOptions)
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

