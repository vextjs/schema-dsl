/**
 * DslBuilder — 链式 DSL 构建器
 *
 * v2 变化：
 *   - 构造器委托 DslParser.parseString()（修复 DA-01/DA-02/DA-03）
 *   - 自定义类型注册委托 TypeRegistry（修复 DB-01/DB-02 统一三处类型列表）
 *   - _customMessages 合并而非覆盖（修复 v1 overwrite bug）
 *   - 实现 IDslBuilder 接口（error/optional/required/enum 链式方法）
 */

import type { JSONSchema } from '../types/schema.js'
import type { IDslBuilder } from '../types/dsl.js'
import { DslParser } from '../parser/DslParser.js'
import { TypeRegistry } from '../parser/TypeRegistry.js'
import { PATTERNS } from '../config/patterns.js'

// ==================== 内部工具 ====================

type CustomValidatorFn = (value: unknown) => unknown

/** 密码强度预设 */
const PASSWORD_PATTERNS: Record<string, RegExp> = {
  weak:       /.{6,}/,
  medium:     /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
  strong:     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  veryStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{10,}$/,
}
const PASSWORD_MIN_LENGTHS: Record<string, number> = {
  weak: 6, medium: 8, strong: 8, veryStrong: 10,
}

// ==================== DslBuilder ====================

export class DslBuilder implements IDslBuilder {
  // IDslBuilder 必须字段
  readonly _isDslBuilder = true as const

  /** schema-dsl 自定义验证关键字集合（toJsonSchema 时清除）*/
  static readonly _internalKeys: ReadonlySet<string> = TypeRegistry.getInternalKeys()

  /** 自定义类型缓存（BC with v1 DslBuilder._customTypes）*/
  private static readonly _customTypes = new Map<string, JSONSchema | (() => JSONSchema)>()

  private _baseSchema: JSONSchema
  private _required: boolean
  private _optional: boolean
  private _customMessages: Record<string, string>
  private _label: string | null
  private _description: string | null
  private _customValidators: CustomValidatorFn[]
  private _whenConditions: unknown[]

  // ==================== 构造器 ====================

  constructor(dslString: string) {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('[schema-dsl] DSL string is required')
    }

    let s = dslString.trim()

    // array!N-M 特殊语法（v1 兼容）→ array:N-M + required=true
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

  // ==================== 内部解析 ====================

  /**
   * 解析 DSL body（不含 ! 或 ?）
   * 处理 DslParser 不支持的特殊类型：types:/phone:/idCard:等
   */
  private static _parseBody(dsl: string): JSONSchema {
    // 1. types:type1|type2 → oneOf
    if (dsl.startsWith('types:')) {
      const parts = dsl.slice(6).split('|').map(t => t.trim()).filter(Boolean)
      if (parts.length === 0) throw new Error('[schema-dsl] types: requires at least one type')
      if (parts.length === 1) return DslBuilder._parseBody(parts[0])
      return { oneOf: parts.map(t => DslBuilder._parseBody(t)) }
    }

    // 2. 提取 typeName 和 arg（仅用于特殊类型分支）
    const colonIdx = dsl.indexOf(':')
    const typeName = colonIdx === -1 ? dsl : dsl.slice(0, colonIdx)
    const arg = colonIdx === -1 ? '' : dsl.slice(colonIdx + 1)

    // 3. 特殊 pattern 类型（TypeRegistry 不包含这些动态参数类型）
    switch (typeName) {
      case 'phone': {
        const country = arg || 'cn'
        const cfg = PATTERNS.phone[country]
        if (!cfg) throw new Error(`[schema-dsl] Unsupported country: ${country}`)
        return {
          type: 'string',
          pattern: cfg.pattern.source,
          ...(cfg.min !== undefined ? { minLength: cfg.min } : {}),
          ...(cfg.max !== undefined ? { maxLength: cfg.max } : {}),
          _customMessages: { pattern: cfg.key },
        }
      }
      case 'idCard': {
        const country = (arg || 'cn').toLowerCase()
        const cfg = PATTERNS.idCard[country]
        if (!cfg) throw new Error(`[schema-dsl] Unsupported country for idCard: ${country}`)
        return {
          type: 'string',
          pattern: cfg.pattern.source,
          ...(cfg.min !== undefined ? { minLength: cfg.min } : {}),
          ...(cfg.max !== undefined ? { maxLength: cfg.max } : {}),
          _customMessages: { pattern: cfg.key },
        }
      }
      case 'creditCard': {
        const cardType = (arg || 'visa').toLowerCase()
        const cfg = PATTERNS.creditCard[cardType]
        if (!cfg) throw new Error(`[schema-dsl] Unsupported credit card type: ${cardType}`)
        return {
          type: 'string',
          pattern: cfg.pattern.source,
          _customMessages: { pattern: cfg.key },
        }
      }
      case 'licensePlate': {
        const country = (arg || 'cn').toLowerCase()
        const cfg = PATTERNS.licensePlate[country]
        if (!cfg) throw new Error(`[schema-dsl] Unsupported country for licensePlate: ${country}`)
        return {
          type: 'string',
          pattern: cfg.pattern.source,
          _customMessages: { pattern: cfg.key },
        }
      }
      case 'postalCode': {
        const country = (arg || 'cn').toLowerCase()
        const cfg = PATTERNS.postalCode[country]
        if (!cfg) throw new Error(`[schema-dsl] Unsupported country for postalCode: ${country}`)
        return {
          type: 'string',
          pattern: cfg.pattern.source,
          _customMessages: { pattern: cfg.key },
        }
      }
      case 'passport': {
        const country = (arg || 'cn').toLowerCase()
        const cfg = PATTERNS.passport[country]
        if (!cfg) throw new Error(`[schema-dsl] Unsupported country for passport: ${country}`)
        return {
          type: 'string',
          pattern: cfg.pattern.source,
          _customMessages: { pattern: cfg.key },
        }
      }
    }

    // 4. 委托标准 DslParser（不带 !，所以不会设 _required）
    return DslParser.parseString(dsl)
  }

  // ==================== 静态方法（BC with v1）====================

  /**
   * 注册自定义类型（委托 TypeRegistry）
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

  /** 检查类型是否已注册（内置或自定义）*/
  static hasType(type: string): boolean {
    return TypeRegistry.has(type)
  }

  /** 获取所有已注册的自定义类型名称 */
  static getCustomTypes(): string[] {
    return Array.from(DslBuilder._customTypes.keys())
  }

  /** 清除所有自定义类型（主要用于测试）*/
  static clearCustomTypes(): void {
    for (const name of DslBuilder._customTypes.keys()) {
      TypeRegistry.unregister(name)
    }
    DslBuilder._customTypes.clear()
  }

  /**
   * 验证 Schema 嵌套深度
   * @param schema - 待验证的 JSON Schema
   * @param maxDepth - 最大深度（默认 3）
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
          ? `嵌套深度${maxFound}超过限制${maxDepth}，路径: ${deepestPath}`
          : `嵌套深度${maxFound}符合要求`,
    }
  }

  // ==================== 内部工具 ====================

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

  // ==================== 通用链式方法 ====================

  /**
   * 设置格式
   */
  format(fmt: string): this {
    this._baseSchema.format = fmt
    return this
  }

  /**
   * 添加正则表达式验证
   */
  pattern(regex: RegExp | string, message?: string): this {
    this._baseSchema.pattern = regex instanceof RegExp ? regex.source : regex
    if (message) {
      this._customMessages['string.pattern'] = message
    }
    return this
  }

  /**
   * 自定义错误消息（IDslBuilder: error；BC alias: messages）
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
   * 设置字段标签（用于错误消息）
   */
  label(text: string): this {
    this._label = text
    return this
  }

  /**
   * 设置描述
   */
  description(text: string): this {
    this._description = text
    return this
  }

  /**
   * 设置默认值
   */
  default(value: unknown): this {
    this._baseSchema.default = value
    return this
  }

  /**
   * 设置枚举值（IDslBuilder）
   */
  enum(...values: unknown[]): this {
    this._baseSchema.enum = values
    return this
  }

  /**
   * 标记字段为可选
   */
  optional(): this {
    this._required = false
    this._optional = true
    return this
  }

  /**
   * 标记字段为必填
   */
  required(): this {
    this._required = true
    this._optional = false
    return this
  }

  /**
   * 添加自定义验证器
   */
  custom(validatorFn: CustomValidatorFn): this {
    if (typeof validatorFn !== 'function') {
      throw new Error('[schema-dsl] Custom validator must be a function')
    }
    this._customValidators.push(validatorFn)
    return this
  }

  // ==================== String 链式方法 ====================

  /** String 最小长度 */
  min(n: number): this {
    this._assertStringType('min')
    this._baseSchema.minLength = n
    return this
  }

  /** String 最大长度 */
  max(n: number): this {
    this._assertStringType('max')
    this._baseSchema.maxLength = n
    return this
  }

  /** String 精确长度（→ exactLength 自定义关键字）*/
  length(n: number): this {
    this._assertStringType('length')
    this._baseSchema.exactLength = n
    return this
  }

  /** String 只能包含字母和数字 */
  alphanum(): this {
    this._assertStringType('alphanum')
    this._baseSchema.alphanum = true
    return this
  }

  /** String 不能包含前后空格 */
  trim(): this {
    this._assertStringType('trim')
    this._baseSchema.trim = true
    return this
  }

  /** String 必须是小写 */
  lowercase(): this {
    this._assertStringType('lowercase')
    this._baseSchema.lowercase = true
    return this
  }

  /** String 必须是大写 */
  uppercase(): this {
    this._assertStringType('uppercase')
    this._baseSchema.uppercase = true
    return this
  }

  /** String 必须是有效 JSON 字符串 */
  json(): this {
    this._assertStringType('json')
    this._baseSchema.jsonString = true
    return this
  }

  /** String 日期格式验证 */
  dateFormat(fmt: string): this {
    this._assertStringType('dateFormat')
    this._baseSchema.dateFormat = fmt
    return this
  }

  /** String 必须晚于指定日期 */
  after(date: string): this {
    this._assertStringType('after')
    this._baseSchema.dateGreater = date
    return this
  }

  /** String 必须早于指定日期 */
  before(date: string): this {
    this._assertStringType('before')
    this._baseSchema.dateLess = date
    return this
  }

  /** v1.0.2 别名：dateGreater */
  dateGreater(date: string): this {
    this._baseSchema.dateGreater = date
    return this
  }

  /** v1.0.2 别名：dateLess */
  dateLess(date: string): this {
    this._baseSchema.dateLess = date
    return this
  }

  /** String slug 格式验证 */
  slug(): this {
    this._assertStringType('slug')
    this._baseSchema.pattern = '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    const existing = (this._baseSchema._customMessages as Record<string, string> | undefined) || {}
    this._baseSchema._customMessages = { ...existing, pattern: 'pattern.slug' }
    return this
  }

  /** String 域名验证 */
  domain(): this {
    this._assertStringType('domain')
    const cfg = PATTERNS.common.domain
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** String IP 地址验证（IPv4 或 IPv6）*/
  ip(): this {
    this._assertStringType('ip')
    const cfg = PATTERNS.common.ip
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** String Base64 编码验证 */
  base64(): this {
    this._assertStringType('base64')
    const cfg = PATTERNS.common.base64
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** String JWT 令牌验证 */
  jwt(): this {
    this._assertStringType('jwt')
    const cfg = PATTERNS.common.jwt
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  // ==================== 身份/模式链式方法 ====================

  /** 手机号验证（自动纠正 number → string）*/
  phone(country = 'cn'): this {
    // 自动纠正类型
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

  /** phone() 别名（BC）*/
  phoneNumber(country = 'cn'): this {
    return this.phone(country)
  }

  /** 身份证验证 */
  idCard(country = 'cn'): this {
    const lower = country.toLowerCase()
    const cfg = PATTERNS.idCard[lower]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for idCard: ${country}`)
    if (cfg.min !== undefined && !this._baseSchema.minLength) this._baseSchema.minLength = cfg.min
    if (cfg.max !== undefined && !this._baseSchema.maxLength) this._baseSchema.maxLength = cfg.max
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** URL Slug 验证 */
  slugChain(): this {
    return this.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).messages({ pattern: 'pattern.slug' })
  }

  /** 信用卡验证 */
  creditCard(type = 'visa'): this {
    const cfg = PATTERNS.creditCard[type.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported credit card type: ${type}`)
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** 车牌号验证 */
  licensePlate(country = 'cn'): this {
    const cfg = PATTERNS.licensePlate[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for licensePlate: ${country}`)
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** 邮政编码验证 */
  postalCode(country = 'cn'): this {
    const cfg = PATTERNS.postalCode[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for postalCode: ${country}`)
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /** 护照号码验证 */
  passport(country = 'cn'): this {
    const cfg = PATTERNS.passport[country.toLowerCase()]
    if (!cfg) throw new Error(`[schema-dsl] Unsupported country for passport: ${country}`)
    return this.pattern(cfg.pattern).messages({ pattern: cfg.key })
  }

  /**
   * 用户名验证
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
          short:  { min: 3, max: 16 },
          medium: { min: 3, max: 32 },
          long:   { min: 3, max: 64 },
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
   * 密码强度验证
   * @param strength - 'weak' | 'medium' | 'strong' | 'veryStrong'
   */
  password(strength = 'medium'): this {
    const pat = PASSWORD_PATTERNS[strength]
    if (!pat) throw new Error(`[schema-dsl] Invalid password strength: ${strength}`)
    if (!this._baseSchema.minLength) this._baseSchema.minLength = PASSWORD_MIN_LENGTHS[strength]
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = 64
    return this.pattern(pat).messages({ pattern: `pattern.password.${strength}` })
  }

  // ==================== Number 链式方法 ====================

  /** Number 小数位数限制 */
  precision(n: number): this {
    this._assertNumberType('precision')
    this._baseSchema.precision = n
    return this
  }

  /** Number 倍数验证（标准 JSON Schema multipleOf）*/
  multiple(n: number): this {
    this._assertNumberType('multiple')
    this._baseSchema.multipleOf = n
    return this
  }

  /** Number 端口号验证（1-65535）*/
  port(): this {
    this._assertNumberType('port')
    this._baseSchema.port = true
    return this
  }

  // ==================== Object 链式方法 ====================

  /** Object 要求所有属性都必须存在 */
  requireAll(): this {
    this._assertObjectType('requireAll')
    this._baseSchema.requiredAll = true
    return this
  }

  /** Object 严格模式，不允许额外属性 */
  strict(): this {
    this._assertObjectType('strict')
    this._baseSchema.strictSchema = true
    return this
  }

  // ==================== Array 链式方法 ====================

  /** Array 不允许稀疏数组 */
  noSparse(): this {
    this._assertArrayType('noSparse')
    this._baseSchema.noSparse = true
    return this
  }

  /** Array 必须包含指定元素 */
  includesRequired(items: unknown[]): this {
    this._assertArrayType('includesRequired')
    if (!Array.isArray(items)) {
      throw new Error('[schema-dsl] includesRequired() requires an array parameter')
    }
    this._baseSchema.includesRequired = items
    return this
  }

  // ==================== 输出方法 ====================

  /**
   * 转换为包含 schema-dsl 内部字段的 Schema（供 Validator 使用）
   */
  toSchema(): JSONSchema {
    const schema: JSONSchema = { ...this._baseSchema }

    if (this._description) {
      schema.description = this._description
    }

    // 合并 _customMessages：基础类型消息 + 用户自定义消息（用户优先）
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

    // 始终输出 _required（BC with v1：即使为 false 也输出）
    schema._required = this._required

    return schema
  }

  /**
   * 输出纯净的 JSON Schema（清除所有 schema-dsl 内部字段和自定义 keyword）
   * 可直接嵌入 OpenAPI / JSON Schema 标准文档
   */
  toJsonSchema(): JSONSchema {
    return TypeRegistry.toJsonSchema(this.toSchema())
  }

  toString(): string {
    return JSON.stringify(this.toJsonSchema())
  }

  /**
   * 验证数据（BC with v1）
   * @param data - 待验证数据
   */
  async validate(data: unknown): Promise<unknown> {
    const { Validator } = await import('./Validator.js')
    const validator = new Validator()
    const schema = this.toSchema()
    return validator.validate(schema, data)
  }
}
