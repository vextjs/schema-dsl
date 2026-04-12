/**
 * 验证选项
 */
export interface ValidateOptions {
  /** 是否格式化错误（默认 true）*/
  format?: boolean
  /** 是否返回所有错误（默认 false，只返回第一个）*/
  allErrors?: boolean
  /** 动态指定语言（如 'zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR'）*/
  locale?: string
  /** 自定义错误消息 */
  messages?: import('./error.js').ErrorMessages
  /** 是否启用智能类型强制（自动转换字符串→数字等）*/
  smartCoerce?: boolean
  /** 是否删除额外属性 */
  removeAdditional?: boolean | 'all' | 'failing'
  /** 是否启用缓存 */
  cache?: boolean | import('./config.js').CacheOptions
  /** 是否启用严格模式 */
  strict?: boolean
  [key: string]: unknown
}

/**
 * 验证结果
 */
export interface ValidationResult<T = unknown> {
  /** 是否验证通过 */
  valid: boolean
  /** 验证后的数据（仅 valid=true 时存在）*/
  data?: T
  /** 错误列表（仅 valid=false 时存在）*/
  errors?: ValidationErrorItem[]
  /** 首条错误消息（便捷访问）*/
  errorMessage?: string
}

/**
 * 验证错误条目（ValidationResult.errors 中的元素）
 */
export interface ValidationErrorItem {
  /** 错误消息 */
  message: string
  /** 错误字段路径（点号分隔，如 'user.email'）*/
  path: string
  /** 验证关键字（min, max, email, pattern 等）*/
  keyword: string
  /** 验证参数 */
  params?: Record<string, unknown>
  /** path 的别名（向后兼容）*/
  field?: string
  /** keyword 的别名（向后兼容 v1 err.type）*/
  type?: string | undefined
  /** 期望类型（向后兼容 v1 err.expected，仅 type 错误时存在）*/
  expected?: string | undefined
}

/**
 * AJV 原始错误对象类型（内部使用）
 */
export interface AjvError {
  keyword: string
  instancePath: string
  schemaPath: string
  params: Record<string, unknown>
  message?: string
  data?: unknown
}
