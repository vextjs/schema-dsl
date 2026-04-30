/**
 * schema-dsl v2 — 主入口文件
 *
 * 修复 IX-01：VERSION 从 package.json 动态读取，不再硬编码
 *
 * @module schema-dsl
 * @version 2.0.0
 */

// ==================== 版本（修复 IX-01）====================
import pkg from '../package.json' with { type: 'json' }
export const VERSION: string = (pkg as { version: string }).version

// ==================== 核心类 ====================
export { Validator } from './core/Validator.js'
export { JSONSchemaCore } from './core/JSONSchemaCore.js'
export { DslBuilder } from './core/DslBuilder.js'
export { ConditionalBuilder } from './core/ConditionalBuilder.js'
export { Locale } from './core/Locale.js'
export { CacheManager } from './core/CacheManager.js'
export { ErrorFormatter } from './core/ErrorFormatter.js'
export { MessageTemplate } from './core/MessageTemplate.js'
export { renderTemplate } from './core/TemplateEngine.js'
export { PluginManager } from './core/PluginManager.js'

// ==================== 解析层 ====================
export { DslParser } from './parser/DslParser.js'
export { TypeRegistry } from './parser/TypeRegistry.js'
export { ConstraintParser } from './parser/ConstraintParser.js'
export { SchemaCompiler } from './parser/SchemaCompiler.js'

// ==================== 适配器层 ====================
export { DslAdapter } from './adapters/DslAdapter.js'

// ==================== 错误类 ====================
export { ValidationError } from './errors/ValidationError.js'
export { I18nError } from './errors/I18nError.js'

// ==================== String 扩展 ====================
export { uninstallStringExtensions } from './core/StringExtensions.js'

// ==================== 导出器 ====================
export {
  BaseExporter,
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,
  MarkdownExporter,
} from './exporters/index.js'

// ==================== 工具类 ====================
export { TypeConverter, SchemaHelper, SchemaUtils } from './utils/index.js'

// ==================== 验证器扩展 ====================
export { CustomKeywords } from './validators/CustomKeywords.js'

// ==================== 常量 ====================
export { VALIDATION, CACHE, FORMATS, PATTERN_IPV4, PATTERN_IPV6 } from './config/constants.js'
export { ErrorCodes } from './core/ErrorCodes.js'
export { PATTERNS } from './config/patterns.js'

// ==================== 类型导出 ====================
export type { JSONSchema } from './types/schema.js'

export type {
  IDslBuilder,
  DslDefinition,
  DslField,
  DslInput,
  DslFn,
  DslIfFn,
  DslConditionMarker,
  DslErrorNamespace,
} from './types/dsl.js'

export type {
  ValidateOptions,
  ValidationResult,
  ValidationErrorItem,
} from './types/validate.js'

export type { DslConfigOptions } from './types/config.js'

export type { IConditionalBuilder } from './types/conditional.js'

export type {
  ExporterOptions,
  MongoDBExporterOptions,
  MySQLExporterOptions,
  PostgreSQLExporterOptions,
  MarkdownExporterOptions,
} from './exporters/index.js'

// ==================== dsl 函数（主 API）====================

import { DslBuilder as _DslBuilder } from './core/DslBuilder.js'
import { DslAdapter as _DslAdapter } from './adapters/DslAdapter.js'
import { ConditionalBuilder as _ConditionalBuilder } from './core/ConditionalBuilder.js'
import { Locale as _Locale } from './core/Locale.js'
import { installStringExtensions as _install } from './core/StringExtensions.js'
import { PATTERNS as _PATTERNS } from './config/patterns.js'
import * as _CONSTANTS from './config/constants.js'
import * as _exporters from './exporters/index.js'
import { Validator as _Validator } from './core/Validator.js'
import { I18nError as _I18nError } from './errors/I18nError.js'
import type { LocaleMessage as _LocaleMessage } from './locales/types.js'
import type { JSONSchema as _JSONSchema } from './types/schema.js'
import type { IDslBuilder as _IDslBuilder, DslDefinition as _DslDefinition, DslConditionMarker as _DslConditionMarker } from './types/dsl.js'
import type { DslConfigOptions as _DslConfigOptions } from './types/config.js'
import type { ValidationResult as _ValidationResult } from './types/validate.js'
import JSON5 from 'json5'
import { createRequire } from 'node:module'
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

export const CONSTANTS = _CONSTANTS
export const exporters = _exporters

// Import all default locales for automatic initialization
import * as _locales from './locales/index.js'

// Initialize default locales at module load time
;(() => {
  for (const [locale, messages] of Object.entries(_locales)) {
    _Locale.addLocale(locale, messages as Record<string, string>)
  }
})()

// ==================== smartCoerceTypes ====================

// 性能优化 O5a：缓存 schema 是否含可转换字段（number / number 数组 / 嵌套对象）
// 无可转换字段时，直接跳过整个 smartCoerceTypes 循环
const _coercibleCache = new WeakMap<object, boolean>()

function _hasCoercibleFields(schema: _JSONSchema): boolean {
  const schemaObj = schema as object
  const cached = _coercibleCache.get(schemaObj)
  if (cached !== undefined) return cached

  const props = schema.properties as Record<string, _JSONSchema> | undefined
  if (!props) {
    _coercibleCache.set(schemaObj, false)
    return false
  }

  const result = Object.values(props).some(f => {
    const ft = f.type
    return ft === 'number' || ft === 'integer' ||
      (ft === 'object' && !!f.properties) ||
      (ft === 'array' && (f.items as _JSONSchema | undefined)?.type === 'number')
  })

  _coercibleCache.set(schemaObj, result)
  return result
}

function smartCoerceTypes(data: unknown, schema: _JSONSchema): unknown {
  if (!data || typeof data !== 'object') return data

  const properties = schema.properties
  if (!properties) return data   // 快速路径：无 properties 定义直接返回

  if (Array.isArray(data)) {
    return data.map(item => smartCoerceTypes(item, schema))
  }

  // 惰性拷贝：只有真正发生转换时才创建新对象
  let result: Record<string, unknown> | null = null
  const src = data as Record<string, unknown>

  for (const key of Object.keys(src)) {
    const value = src[key]
    const fieldSchema = (properties as Record<string, _JSONSchema>)[key]
    if (!fieldSchema || fieldSchema.enum) continue

    const ftype = fieldSchema.type

    if (ftype === 'number' && typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed !== '') {
        const num = Number(trimmed)
        if (!isNaN(num)) {
          if (!result) result = { ...src }
          result[key] = num
        }
      }
    } else if (ftype === 'object' && typeof value === 'object' && value !== null) {
      const converted = smartCoerceTypes(value, fieldSchema)
      if (converted !== value) {
        if (!result) result = { ...src }
        result[key] = converted
      }
    } else if (ftype === 'array' && Array.isArray(value)) {
      const items = fieldSchema.items as _JSONSchema | undefined
      if (items?.type === 'number') {
        const converted = value.map(item => {
          if (typeof item === 'string') {
            const trimmed = item.trim()
            if (trimmed !== '') {
              const num = Number(trimmed)
              return !isNaN(num) ? num : item
            }
          }
          return item
        })
        if (!result) result = { ...src }
        result[key] = converted
      }
    }
  }

  return result ?? data   // 无转换时原样返回（零拷贝）
}

// ==================== 顶层 schema 归一化（raw DSL object 支持）====================

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

function _normalizeSchemaInput(schema: _JSONSchema | _DslDefinition | _IDslBuilder): _JSONSchema {
  const obj = schema as Record<string, unknown>
  if (schema && typeof schema === 'object' && typeof obj['toSchema'] === 'function') {
    return (obj['toSchema'] as () => _JSONSchema)()
  }
  if (_isDslObject(schema)) {
    return _DslAdapter.parseObject(schema)
  }
  return schema as _JSONSchema
}

// ==================== i18n 目录扫描 ====================

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

// ==================== 默认 Validator 单例 ====================

let _defaultValidator: InstanceType<typeof _Validator> | null = null

function _getDefaultValidator(): InstanceType<typeof _Validator> {
  if (!_defaultValidator) _defaultValidator = new _Validator()
  return _defaultValidator
}

export { _getDefaultValidator as getDefaultValidator }

/**
 * 重置默认 Validator 单例（用于测试环境清理状态）
 */
export function resetDefaultValidator(): void {
  _defaultValidator = null
}

// ==================== 便捷验证函数 ====================

/**
 * 便捷验证函数（使用默认 Validator 单例）
 * 当 options.coerce !== false 时，自动进行字符串→数字类型转换
 */
export function validate<T = unknown>(
  schema: _JSONSchema | _DslDefinition | _IDslBuilder,
  data: T,
  options: Record<string, unknown> = {},
): _ValidationResult<T> {
  const normalizedSchema = _normalizeSchemaInput(schema)
  const shouldCoerce = options['coerce'] !== false
  // O5a：schema 无可转换字段时跳过整个 coerce 循环（零开销）
  const coercedData = shouldCoerce && _hasCoercibleFields(normalizedSchema)
    ? smartCoerceTypes(data, normalizedSchema)
    : data
  return _getDefaultValidator().validate(normalizedSchema, coercedData as T, options)
}

/**
 * 便捷异步验证函数
 */
export async function validateAsync<T = unknown>(
  schema: _JSONSchema | _DslDefinition | _IDslBuilder,
  data: T,
  options: Record<string, unknown> = {},
): Promise<T> {
  const normalizedSchema = _normalizeSchemaInput(schema)
  const shouldCoerce = options['coerce'] !== false
  // O5a：schema 无可转换字段时跳过整个 coerce 循环（零开销）
  const coercedData = shouldCoerce && _hasCoercibleFields(normalizedSchema)
    ? smartCoerceTypes(data, normalizedSchema)
    : data
  return _getDefaultValidator().validateAsync(normalizedSchema, coercedData as T, options)
}

// ==================== dsl 主函数 ====================

// Core dsl function: string → IDslBuilder (chain), object definition → JSONSchema
function _dslFn(def: string): _IDslBuilder
function _dslFn(def: _DslDefinition): _JSONSchema
function _dslFn(def: unknown): _IDslBuilder | _JSONSchema {
  if (typeof def === 'string') return new _DslBuilder(def)
  if (def === null || def === undefined || typeof def !== 'object' || Array.isArray(def)) {
    throw new Error('[schema-dsl] Invalid DSL definition: expected string or object')
  }
  return _DslAdapter.parseObject(def as _DslDefinition)
}

// Namespace shape (mirrors DslFn interface in types/dsl.ts)
const _dslWithNS = _dslFn as {
  (def: string): _IDslBuilder
  (def: _DslDefinition): _JSONSchema
  config: (options?: Partial<_DslConfigOptions>) => void
  if: {
    (condition: string, thenSchema: unknown, elseSchema?: unknown): _DslConditionMarker
    (condition: (data: unknown) => boolean): ReturnType<typeof _ConditionalBuilder.start>
  }
  _if: {
    (condition: string, thenSchema: unknown, elseSchema?: unknown): _DslConditionMarker
    (condition: (data: unknown) => boolean): ReturnType<typeof _ConditionalBuilder.start>
  }
  match: (value: unknown, cases: Record<string, unknown>) => _DslConditionMarker
  error: {
    create: typeof _I18nError.create
    throw: typeof _I18nError.throw
    assert: typeof _I18nError.assert
    [key: string]: unknown
  }
}

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

/**
 * dsl — 主 API 入口
 *
 * @example
 * // 字符串 DSL → DslBuilder（链式）
 * const builder = dsl('email!').label('邮箱')
 *
 * @example
 * // 对象 DSL → JSON Schema
 * const schema = dsl({ email: 'email!', name: 'string:2-32!' })
 */
export const dsl = _dslWithNS

export default dsl

export const config = _dslConfig

export function installStringExtensions(dslFunction: Parameters<typeof _install>[0] = _dslWithNS as unknown as Parameters<typeof _install>[0]): void {
  _install(dslFunction)
}

// v1 compatibility: requiring/importing the package installs String.prototype extensions.
installStringExtensions()

