import type { JSONSchema } from '../types/schema.js'

/**
 * 类型定义（TypeRegistry 中每个条目的结构）
 */
export interface TypeDefinition {
  /** 此类型的基础 JSON Schema 片段 */
  baseSchema: Partial<JSONSchema>
  /** 关联的自定义消息（如 phone 类型的错误提示 key）*/
  customMessages?: Record<string, string>
  /** 是否为内部类型（toJsonSchema 时 schema 层不清除，但 key 自身已是标准 JSON Schema 字段）*/
  isPattern?: boolean
}

/** 已知内部 key 集合（toJsonSchema 时需从输出中清除）*/
const INTERNAL_KEYS: ReadonlySet<string> = new Set([
  '_label',
  '_customMessages',
  '_description',
  '_required',
  // 自定义 AJV keyword（不是标准 JSON Schema 字段，输出时清除）
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
  // ⚠️ multipleOf 是标准 JSON Schema 字段，不在此列（修复 DB-01）
])

/**
 * 内置类型注册表
 * 33 个类型，覆盖 v1 DslAdapter.typeMap + DslBuilder 的类型列表（修复三处不一致 DB-02、DA-01）
 */
const BUILTIN_TYPES: Map<string, TypeDefinition> = new Map([
  // --- 基本类型 ---
  ['string',  { baseSchema: { type: 'string' } }],
  ['number',  { baseSchema: { type: 'number' } }],
  ['integer', { baseSchema: { type: 'integer' } }],
  ['boolean', { baseSchema: { type: 'boolean' } }],
  ['object',  { baseSchema: { type: 'object' } }],
  ['array',   { baseSchema: { type: 'array' } }],
  ['null',    { baseSchema: { type: 'null' } }],
  ['any',     { baseSchema: {} }],

  // --- 格式类型 ---
  ['email',    { baseSchema: { type: 'string', format: 'email' } }],
  ['url',      { baseSchema: { type: 'string', format: 'uri' } }],
  ['uri',      { baseSchema: { type: 'string', format: 'uri' } }],
  ['uuid',     { baseSchema: { type: 'string', format: 'uuid' } }],
  ['ipv4',     { baseSchema: { type: 'string', format: 'ipv4' } }],
  ['ipv6',     { baseSchema: { type: 'string', format: 'ipv6' } }],
  ['ip',       { baseSchema: { anyOf: [{ type: 'string', format: 'ipv4' }, { type: 'string', format: 'ipv6' }] } }],
  ['hostname', { baseSchema: { type: 'string', format: 'hostname' } }],
  ['date',     { baseSchema: { type: 'string', format: 'date' } }],
  ['datetime', { baseSchema: { type: 'string', format: 'date-time' } }],
  ['time',     { baseSchema: { type: 'string', format: 'time' } }],

  // --- 特殊字符串类型 ---
  ['binary',   { baseSchema: { type: 'string', contentEncoding: 'base64' } }],
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

  // --- slug（修复 DB-02：v1 DslAdapter 缺少 slug 类型定义）---
  ['slug', {
    baseSchema: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
    customMessages: { pattern: 'pattern.slug' },
  }],

  // --- 中文相关 ---
  ['chineseName', {
    baseSchema: { type: 'string', pattern: '^[\\u4e00-\\u9fa5]{2,10}$' },
    customMessages: { pattern: 'chineseName' },
  }],
  ['chinese', {
    baseSchema: { type: 'string', pattern: '^[\\u4e00-\\u9fa5]+$' },
  }],

  // --- 域相关（由 CustomKeywords 处理，此处仅注册 baseSchema）---
  ['emailDomain', { baseSchema: { type: 'string', format: 'email' } }],

  // --- v1 扩展类型（DslBuilder v1.0.2）---
  ['alphanum', { baseSchema: { type: 'string', alphanum: true } }],
  ['lower',    { baseSchema: { type: 'string', lowercase: true } }],
  ['upper',    { baseSchema: { type: 'string', uppercase: true } }],
  ['json',     { baseSchema: { type: 'string', jsonString: true } }],
  ['port',     { baseSchema: { type: 'integer', port: true } }],
])

/**
 * 自定义类型注册表（用户通过 registerType 注册）
 */
const CUSTOM_TYPES: Map<string, TypeDefinition> = new Map()
const DYNAMIC_TYPES: Map<string, () => JSONSchema> = new Map()

/**
 * TypeRegistry — 统一类型注册与解析
 *
 * 替代 v1 中三处不一致的类型列表（修复 DB-01/DB-02/DA-01）
 */
export const TypeRegistry = {
  /**
   * 解析类型名称，返回对应 TypeDefinition
   * 内置类型优先；自定义类型可覆盖内置（除基本类型外）
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

    // 未知类型：warn + fallback to string
    console.warn(`[schema-dsl] Unknown type "${typeName}", falling back to string`)
    return { baseSchema: { type: 'string' } }
  },

  /**
   * 注册自定义类型（供 DslBuilder.registerType 委托）
   */
  register(name: string, def: TypeDefinition | Partial<JSONSchema>): void {
    if (!name || typeof name !== 'string') {
      throw new Error('[schema-dsl] TypeRegistry.register: name must be a non-empty string')
    }
    // 允许直接传入 Partial<JSONSchema>，自动包装
    const normalized: TypeDefinition =
      'baseSchema' in def ? (def as TypeDefinition) : { baseSchema: def as Partial<JSONSchema> }
    CUSTOM_TYPES.set(name, normalized)
  },

  /**
   * 注册动态类型（工厂函数，每次 resolve 时重新调用）
   */
  registerDynamic(name: string, factory: () => JSONSchema): void {
    if (!name || typeof name !== 'string') {
      throw new Error('[schema-dsl] TypeRegistry.registerDynamic: name must be a non-empty string')
    }
    DYNAMIC_TYPES.set(name, factory)
  },

  /**
   * 注销自定义类型
   */
  unregister(name: string): void {
    CUSTOM_TYPES.delete(name)
    DYNAMIC_TYPES.delete(name)
  },

  /**
   * 检查类型是否已注册（内置或自定义）
   */
  has(typeName: string): boolean {
    return BUILTIN_TYPES.has(typeName) || CUSTOM_TYPES.has(typeName) || DYNAMIC_TYPES.has(typeName)
  },

  /**
   * 获取 internal key 集合（toJsonSchema 时用于清除非标准字段）
   */
  getInternalKeys(): ReadonlySet<string> {
    return INTERNAL_KEYS
  },

  /**
   * 清除 schema 中的内部 key，返回纯净的 JSON Schema
   */
  toJsonSchema(schema: JSONSchema): JSONSchema {
    const result: JSONSchema = {}
    for (const [k, v] of Object.entries(schema)) {
      if (!INTERNAL_KEYS.has(k)) {
        result[k] = v
      }
    }
    return result
  },
} as const
