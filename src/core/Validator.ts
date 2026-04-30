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
import { Locale } from './Locale.js'
import { DslParser } from '../parser/DslParser.js'
import type { DslDefinition } from '../types/dsl.js'

// 非 AJV 的自定义选项键（V-Y01 修复：过滤后再传给 Ajv）
const NON_AJV_KEYS = new Set([
  'cache', 'smartCoerce', 'locale', 'messages', 'format',
  'strict',  // v2 重定义为 strictSchema，不透传给 Ajv
])

// AJV ValidateFunction type
type AjvValidateFn = ValidateFunction

// 带 _removeAdditional 或 _isConditional 内部标记的 schema
type InternalSchema = JSONSchema & {
  _removeAdditional?: boolean
  _isConditional?: boolean
  conditions?: Array<{ action?: string; message?: string; then?: unknown }>
  _evaluateCondition?: (cond: unknown, data: unknown) => { result: boolean; failedMessage?: string; requirementFailed?: boolean }
  else?: unknown
}

// 性能优化 O5b：valid 路径共享空数组，避免每次 { errors: [] } 分配
const EMPTY_ERRORS: ValidationErrorItem[] = []

/**
 * ValidatorOptions — Validator 构造参数（扩展自 AJV 基础选项）
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
  }
  [key: string]: unknown
}

/**
 * Validator — AJV 封装验证器（v2）
 *
 * 修复：
 *   V-Y01: 过滤非 AJV 选项后再 new Ajv()，防止未知选项警告
 *   V-02:  条件字段删除后，cleanSchema.required 也同步过滤（v1 漏掉了）
 *   V-Y03: _removeAdditional 模式复用缓存内部 Ajv 实例（v1 每次 new Validator）
 *   V-Y07: static quickValidate 复用单例 Ajv（v1 每次 new Ajv）
 */
export class Validator {
  private readonly _ajvOptions: Record<string, unknown>
  private readonly _ajv: InstanceType<typeof Ajv>
  private readonly _cache: CacheManager
  private readonly _errorFormatter: ErrorFormatter

  // WeakMap 缓存 schema 对象 → 唯一 cacheKey（避免 JSON.stringify）
  private readonly _schemaMap = new WeakMap<object, string>()
  private _schemaKeyCounter = 0

  // WeakMap 缓存 DslBuilder toSchema() 结果
  private readonly _dslSchemaCache = new WeakMap<object, JSONSchema>()

  // 性能优化：缓存 schema 是否含条件字段（避免每次验证都遍历 properties）
  private readonly _conditionalFlagCache = new WeakMap<object, boolean>()

  // V-Y03 修复：缓存 removeAdditional Ajv 实例（不再每次 new Validator）
  private _removeAdditionalAjv: InstanceType<typeof Ajv> | null = null

  // V-Y07 修复：静态单例 Ajv
  private static _quickValidateAjv: InstanceType<typeof Ajv> | null = null

  constructor(options: ValidatorOptions = {}) {
    // V-Y01 修复：过滤非 AJV 选项
    const ajvOptions: Record<string, unknown> = {
      allErrors: options.allErrors !== false,
      useDefaults: options.useDefaults !== false,
      coerceTypes: options.coerceTypes ?? false,
      removeAdditional: options.removeAdditional ?? false,
      verbose: true, // 启用详细模式，以便访问 parentSchema
    }

    // 透传其余合法 AJV 选项
    for (const [k, v] of Object.entries(options)) {
      if (!NON_AJV_KEYS.has(k) && !(k in ajvOptions)) {
        ajvOptions[k] = v
      }
    }

    this._ajvOptions = ajvOptions
    this._ajv = new Ajv(ajvOptions)
    ;(addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(this._ajv)
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
    })

    this._errorFormatter = new ErrorFormatter()
  }

  get ajvOptions(): Record<string, unknown> {
    return this._ajvOptions
  }

  // ─── 公开 API ──────────────────────────────────────────────────────────

  /**
   * 编译 schema → AJV 验证函数（with cache）
   */
  compile(schema: JSONSchema, cacheKey?: string | null): AjvValidateFn {
    const key = cacheKey ?? null

    if (key) {
      const cached = this._cache.get(key) as AjvValidateFn | null
      if (cached !== null) return cached
    }

    try {
      const validate = this._ajv.compile(schema)
      if (key) this._cache.set(key, validate as unknown as object)
      return validate
    } catch (error) {
      throw new Error(`Schema compilation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 同步验证
   */
  validate<T = unknown>(schema: JSONSchema | AjvValidateFn, data: T, options: ValidateOptions = {}): ValidationResult<T> {
    return this._validateInternal(schema, data, options)
  }

  /**
   * 异步验证（失败时抛出 ValidationError）
   * V-Y02 修复：v1 validateAsync 缺少 smartCoerceTypes，v2 统一走 _validateInternal
   */
  async validateAsync<T = unknown>(schema: JSONSchema | AjvValidateFn, data: T, options: ValidateOptions = {}): Promise<T> {
    const result = this._validateInternal(schema, data, options)
    if (!result.valid) {
      const { ValidationError } = await import('../errors/ValidationError.js')
      throw new ValidationError(result.errors ?? [], data)
    }
    return result.data as T
  }

  /**
   * 批量验证（编译一次，多次复用）
   */
  validateBatch<T = unknown>(schema: JSONSchema, dataArray: T[]): ValidationResult<T>[] {
    if (!Array.isArray(dataArray)) throw new Error('Data must be an array')
    const cacheKey = this._generateCacheKey(schema)
    const validate = this.compile(schema, cacheKey)
    return dataArray.map(data => this.validate(validate, data))
  }

  /**
   * 添加自定义关键字
   */
  addKeyword(keyword: string, definition: KeywordDefinition): this {
    try {
      this._ajv.addKeyword(keyword, definition)
      return this
    } catch (error) {
      throw new Error(`Failed to add keyword '${keyword}': ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 添加自定义格式
   */
  addFormat(name: string, validator: Format): this {
    this._ajv.addFormat(name, validator)
    return this
  }

  /**
   * 添加 schema 引用
   */
  addSchema(uri: string, schema: JSONSchema): this {
    this._ajv.addSchema(schema, uri)
    return this
  }

  /**
   * 删除 schema 引用
   */
  removeSchema(uri: string): this {
    this._ajv.removeSchema(uri)
    return this
  }

  getAjv(): InstanceType<typeof Ajv> { return this._ajv }
  get cache(): CacheManager { return this._cache }
  clearCache(): void { this._cache.clear() }
  getCacheStats(): CacheStats { return this._cache.getStats() }

  // ─── 静态工厂 ──────────────────────────────────────────────────────────

  static create(options?: ValidatorOptions): Validator {
    return new Validator(options)
  }

  /**
   * 快速验证（V-Y07 修复：复用单例 Ajv，不再每次 new Ajv()）
   */
  static quickValidate(schema: JSONSchema, data: unknown): boolean {
    if (!Validator._quickValidateAjv) {
      Validator._quickValidateAjv = new Ajv()
      ;(addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(Validator._quickValidateAjv)
      CustomKeywords.registerAll(Validator._quickValidateAjv)
    }
    try {
      return Validator._quickValidateAjv.validate(schema, data) as boolean
    } catch {
      return false
    }
  }

  // ─── 内部实现 ──────────────────────────────────────────────────────────

  private _validateInternal<T>(
    schema: JSONSchema | AjvValidateFn,
    data: T,
    options: ValidateOptions = {}
  ): ValidationResult<T> {
    const shouldFormat = options.format !== false
    const locale = options.locale ?? Locale.getLocale()
    const messages = (options.messages ?? {}) as ErrorMessages

    // DslBuilder 实例缓存转换（duck-type：有 toSchema 方法）
    // 注意：typeof schema === 'function' 已在调用前过滤，此处只处理对象
    if (typeof (schema as Record<string, unknown>)['toSchema'] === 'function') {
      const obj = schema as Record<string, unknown>
      if (!this._dslSchemaCache.has(obj as object)) {
        this._dslSchemaCache.set(obj as object, (obj['toSchema'] as () => JSONSchema)())
      }
      schema = this._dslSchemaCache.get(obj as object) as JSONSchema
    }

    const internalSchema = schema as InternalSchema

    // ConditionalBuilder（顶层）
    if (internalSchema._isConditional) {
      return this._validateConditional(internalSchema, data as Record<string, unknown>, null, data, options)
    }

    // 包含 ConditionalBuilder 属性的对象 schema（包含任意深度的嵌套对象）
    if (internalSchema.properties) {
      // 性能优化：缓存条件检测结果，避免每次验证都遍历 properties
      let hasConditionals = this._conditionalFlagCache.get(internalSchema as object)
      if (hasConditionals === undefined) {
        hasConditionals = this._hasAnyConditional(internalSchema)
        this._conditionalFlagCache.set(internalSchema as object, hasConditionals)
      }
      if (hasConditionals) {
        return this._validateWithConditionals(internalSchema, data, options)
      }
    }

    // V-Y03 修复：_removeAdditional 复用内部 Ajv 实例
    if (internalSchema._removeAdditional) {
      if (!this._removeAdditionalAjv) {
        this._removeAdditionalAjv = new Ajv({ ...this._ajvOptions, removeAdditional: true })
        ;(addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(this._removeAdditionalAjv)
        CustomKeywords.registerAll(this._removeAdditionalAjv)
      }

      const cleanSchema: JSONSchema = JSON.parse(JSON.stringify(schema)) as JSONSchema
      delete (cleanSchema as InternalSchema)._removeAdditional

      try {
        const validate = this._removeAdditionalAjv.compile(cleanSchema)
        const valid = validate(data) as boolean
        if (valid) return { valid: true, data, errors: EMPTY_ERRORS }
        return { valid: false, data, errors: this._formatErrors(validate.errors ?? [], messages, locale, shouldFormat) }
      } catch (error) {
        return this._internalError(error, data)
      }
    }

    try {
      let validate: AjvValidateFn
      if (typeof schema === 'function') {
        validate = schema as AjvValidateFn
      } else {
        // 性能优化：合并 _generateCacheKey + compile() 为单次 WeakMap 查询
        const schemaObj = schema as object
        let cacheKey = this._schemaMap.get(schemaObj)
        if (!cacheKey) {
          cacheKey = `s${++this._schemaKeyCounter}`
          this._schemaMap.set(schemaObj, cacheKey)
        }
        const cached = this._cache.get(cacheKey) as AjvValidateFn | null
        if (cached !== null) {
          validate = cached
        } else {
          try {
            validate = this._ajv.compile(schema as JSONSchema)
            this._cache.set(cacheKey, validate as unknown as object)
          } catch (error) {
            throw new Error(`Schema compilation failed: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }

      const valid = validate(data) as boolean
      if (valid) return { valid: true, data, errors: EMPTY_ERRORS }
      return { valid: false, data, errors: this._formatErrors(validate.errors ?? [], messages, locale, shouldFormat) }
    } catch (error) {
      return this._internalError(error, data)
    }
  }

  /**
   * 递归检查 schema 或其任意嵌套属性中是否存在 _isConditional 标记
   */
  private _hasAnyConditional(schema: InternalSchema): boolean {
    if (!schema.properties) return false
    return Object.values(schema.properties).some((fs) => {
      const fieldSchema = fs as InternalSchema
      if (fieldSchema._isConditional) return true
      // 递归检查嵌套对象
      if (fieldSchema.properties) return this._hasAnyConditional(fieldSchema)
      return false
    })
  }

  private _validateWithConditionals<T>(
    schema: InternalSchema,
    data: T,
    options: ValidateOptions,
    rootData?: Record<string, unknown>
  ): ValidationResult<T> {
    const errors: ValidationErrorItem[] = []

    // rootData: 顶层完整数据，用于条件回调的上下文（嵌套时保持根引用）
    const effectiveRoot = rootData ?? (data as Record<string, unknown>)

    // 深拷贝 schema 避免修改原始
    const cleanSchema = JSON.parse(JSON.stringify(schema)) as InternalSchema
    const conditionalFields: Record<string, InternalSchema> = {}
    const nestedObjectFields: Record<string, InternalSchema> = {}

    for (const [fieldName, fieldSchema] of Object.entries(schema.properties ?? {})) {
      const fs = fieldSchema as InternalSchema
      if (fs._isConditional) {
        conditionalFields[fieldName] = fs

        // 从 cleanSchema 中移除条件字段
        delete cleanSchema.properties?.[fieldName]

        // V-02 修复：同步从 required[] 移除该字段（v1 漏掉了这步）
        if (cleanSchema.required) {
          cleanSchema.required = cleanSchema.required.filter(r => r !== fieldName)
        }
      } else if (fs.properties && this._hasAnyConditional(fs)) {
        // 嵌套对象中包含条件字段 → 提取出来用自定义逻辑处理
        nestedObjectFields[fieldName] = fs
        delete cleanSchema.properties?.[fieldName]
      }
    }

    // 先验证非条件字段（含嵌套对象按 AJV 正常处理的部分）
    const baseResult = this._validateInternal(cleanSchema, data, options)
    if (!baseResult.valid) {
      errors.push(...(baseResult.errors ?? []))
    }

    // 验证条件字段（使用 effectiveRoot 作为条件回调的数据上下文）
    for (const [fieldName, conditionalSchema] of Object.entries(conditionalFields)) {
      const dataRecord = data as Record<string, unknown>
      const fieldResult = this._validateConditional(conditionalSchema, effectiveRoot, fieldName, dataRecord[fieldName], options)

      if (!fieldResult.valid) {
        for (const err of (fieldResult.errors ?? [])) {
          // Replace generic paths like "value" or empty with the actual field name
          const errPath = (!err.path || err.path === 'value') ? fieldName : err.path
          errors.push({ ...err, path: errPath, field: errPath })
        }
      }
    }

    // 递归处理包含条件属性的嵌套对象
    for (const [fieldName, nestedSchema] of Object.entries(nestedObjectFields)) {
      const dataRecord = data as Record<string, unknown>
      const nestedData = dataRecord[fieldName]

      // 如果嵌套对象数据不存在，用 AJV 处理 required 等错误
      if (nestedData === undefined || nestedData === null) {
        const partialSchema = JSON.parse(JSON.stringify(schema)) as InternalSchema
        // 只保留这个字段
        partialSchema.properties = { [fieldName]: nestedSchema }
        partialSchema.required = (schema.required ?? []).filter(r => r === fieldName)
        const partialResult = this._validateInternal(partialSchema, data, options)
        if (!partialResult.valid) {
          errors.push(...(partialResult.errors ?? []))
        }
        continue
      }

      // 递归时传入 effectiveRoot，保证条件回调始终拿到根数据
      const nestedResult = this._validateWithConditionals(nestedSchema, nestedData, options, effectiveRoot)
      if (!nestedResult.valid) {
        for (const err of (nestedResult.errors ?? [])) {
          const prefix = fieldName
          const errPath = err.path ? `${prefix}/${err.path}` : prefix
          errors.push({ ...err, path: errPath, field: errPath })
        }
      }
    }

    if (errors.length === 0) return { valid: true, data, errors: EMPTY_ERRORS }
    return { valid: false, data, errors }
  }

  private _validateConditional<T>(
    conditionalSchema: InternalSchema,
    data: Record<string, unknown>,
    fieldName: string | null,
    fieldValue: T,
    options: ValidateOptions
  ): ValidationResult<T> {
    const locale = options.locale ?? Locale.getLocale()

    try {
      for (const cond of (conditionalSchema.conditions ?? [])) {
        const evaluation = conditionalSchema._evaluateCondition?.(cond, data) ?? { result: false }
        const matched = evaluation.result

        if (cond.action === 'throw') {
          if (matched) {
            const errorMsg = evaluation.failedMessage ?? cond.message ?? 'Conditional validation failed'
            const message = Locale.getMessageText(errorMsg, (options.messages ?? {}) as Record<string, string>, locale)
            return {
              valid: false,
              data: fieldValue,
              errors: [{ message, path: '', keyword: 'conditional', params: { condition: (cond as Record<string, unknown>)['type'] } }],
            }
          }
          continue
        }

        if (matched) {
          const thenSchema = (cond as Record<string, unknown>)['then']
          if (thenSchema !== undefined && thenSchema !== null) {
            return this._executeThenBranch(thenSchema, data, fieldValue, fieldName, options)
          }
          return { valid: true, data: fieldValue, errors: EMPTY_ERRORS }
        }

        // OR 要求模式：所有条件均未满足，视为验证失败
        if (evaluation.requirementFailed) {
          const errorMsg = cond.message ?? 'Condition not met'
          const message = Locale.getMessageText(errorMsg, (options.messages ?? {}) as Record<string, string>, locale)
          return {
            valid: false,
            data: fieldValue,
            errors: [{ message, path: '', keyword: 'conditional', params: {} }],
          }
        }
      }

      // else 分支
      const elseSchema = conditionalSchema.else
      if (elseSchema !== undefined) {
        if (elseSchema === null) return { valid: true, data: fieldValue, errors: EMPTY_ERRORS }
        return this._executeThenBranch(elseSchema, data, fieldValue, fieldName, options)
      }

      return { valid: true, data: fieldValue, errors: EMPTY_ERRORS }
    } catch (error) {
      return this._internalError(error, fieldValue)
    }
  }

  private _executeThenBranch<T>(
    thenSchema: unknown,
    data: Record<string, unknown>,
    fieldValue: T,
    fieldName: string | null,
    options: ValidateOptions
  ): ValidationResult<T> {
    let resolved = thenSchema

    // 如果是 DSL 字符串，先解析为 JSONSchema
    if (typeof resolved === 'string') {
      resolved = DslParser.parseString(resolved)
    }

    // 如果是 ConditionalBuilder 实例
    if (resolved !== null && typeof resolved === 'object') {
      const obj = resolved as Record<string, unknown>
      if (typeof obj['toSchema'] === 'function') {
        resolved = (obj['toSchema'] as () => JSONSchema)()
      }
    }

    const resInternal = resolved as InternalSchema
    if (resInternal?._isConditional) {
      return this._validateConditional(resInternal, data, fieldName, fieldValue, options)
    }

    // 如果是普通对象（DSL 定义），先转为 JSONSchema
    if (resolved !== null && typeof resolved === 'object' && !Array.isArray(resolved)) {
      const obj = resolved as Record<string, unknown>
      if (obj['type'] === undefined && obj['oneOf'] === undefined && obj['anyOf'] === undefined && obj['allOf'] === undefined) {
        // Looks like a DslDefinition (e.g. { host: 'string!', port: 'number!' })
        resolved = DslParser.parseObject(resolved as DslDefinition)
      }
    }

    return this._validateFieldValue(resolved as JSONSchema, fieldValue, options)
  }

  private _validateFieldValue<T>(schema: JSONSchema, fieldValue: T, options: ValidateOptions): ValidationResult<T> {
    const internalSchema = schema as InternalSchema
    const isRequired = internalSchema._required === true

    if (!isRequired && (fieldValue === undefined || fieldValue === '')) {
      return { valid: true, data: fieldValue, errors: EMPTY_ERRORS }
    }

    // Required field with undefined value → return required error with label/custom messages
    if (isRequired && fieldValue === undefined) {
      const locale = options.locale ?? Locale.getLocale()
      const label = (internalSchema._label as string) ?? ''
      const customMsgs = (internalSchema._customMessages as Record<string, string>) ?? {}
      const allMsgs = { ...(options.messages ?? {}), ...customMsgs } as Record<string, string>
      // Check for custom 'required' message
      let message: string
      if (allMsgs['required']) {
        message = Locale.getMessageText(allMsgs['required'], allMsgs, locale)
      } else {
        message = Locale.getMessageText('required', allMsgs, locale)
        if (label) message = `${label} ${message}`
      }
      return {
        valid: false,
        data: fieldValue,
        errors: [{ message, path: '', keyword: 'required', params: {} }],
      }
    }

    return this._validateInternal(schema, fieldValue, options)
  }

  // ─── 辅助方法 ──────────────────────────────────────────────────────────

  private _generateCacheKey(schema: object): string {
    if (!this._schemaMap.has(schema)) {
      this._schemaMap.set(schema, `schema_${++this._schemaKeyCounter}`)
    }
    return this._schemaMap.get(schema)!
  }

  // 性能优化：缓存扁平化后的 locale messages（key = locale, value = flat ErrorMessages）
  // 避免每次验证失败时重复 Locale.getMessages + Object.entries.map
  private readonly _flatLocaleCache = new Map<string, ErrorMessages>()

  private _getFlatLocaleMessages(locale: string): ErrorMessages {
    let flat = this._flatLocaleCache.get(locale)
    if (!flat) {
      const raw = Locale.getMessages(locale)
      flat = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [
          k,
          typeof v === 'string' ? v : (v as { message: string }).message,
        ])
      ) as ErrorMessages
      this._flatLocaleCache.set(locale, flat)
    }
    return flat
  }

  private _formatErrors(
    rawErrors: unknown[],
    messages: ErrorMessages,
    locale: string,
    shouldFormat: boolean
  ): ValidationErrorItem[] {
    if (!shouldFormat) return rawErrors as ValidationErrorItem[]
    const localeMessages = this._getFlatLocaleMessages(locale)
    // 仅当有自定义 messages 时才合并（避免无必要的对象展开）
    const mergedMessages: ErrorMessages =
      Object.keys(messages).length === 0
        ? localeMessages
        : { ...localeMessages, ...messages }
    return this._errorFormatter.formatDetailed(rawErrors as Parameters<ErrorFormatter['formatDetailed']>[0], locale, mergedMessages)
  }

  private _internalError<T>(error: unknown, data: T): ValidationResult<T> {
    return {
      valid: false,
      data,
      errors: [{
        message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
        path: '',
        keyword: 'error',
        params: {},
      }],
    }
  }
}
