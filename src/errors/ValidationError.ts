// V8/Node.js 扩展（ES2022 lib 中无此类型，显式声明）
type ErrorWithCaptureStackTrace = typeof Error & {
  captureStackTrace?: (target: object, ctor: unknown) => void
}
const ErrorCtor = Error as ErrorWithCaptureStackTrace

import type { ValidationErrorItem } from '../types/validate.js'

/**
 * ValidationError — validateAsync() 失败时抛出的错误类
 * 修复 v1 bug：空 errors 数组时消息格式异常
 */
export class ValidationError extends Error {
  readonly name = 'ValidationError' as const
  readonly errors: ValidationErrorItem[]
  readonly data: unknown
  readonly statusCode: number

  constructor(errors: ValidationErrorItem[], data?: unknown, statusCode = 400) {
    // 修复：空 errors 时提供友好消息（v1 bug）
    const messages =
      errors.length === 0
        ? 'Validation failed'
        : errors
            .map(e => {
              if (e.path) {
                const field = e.path.replace(/^\//, '')
                return field ? `${field}: ${e.message}` : e.message
              }
              return e.message
            })
            .join('; ')

    // v1 兼容：全无 path 属性时用 " - " 分隔，否则用 ": "
    // v1 兼容补充：单条 conditional 错误直接使用消息字符串（不加前缀）
    const hasNoPath = errors.every(e => e.path === undefined || e.path === null || e.path === '')
    const isSingleConditional = errors.length === 1 && errors[0].keyword === 'conditional' && hasNoPath
    if (isSingleConditional) {
      super(messages)
    } else {
      super(hasNoPath ? `Validation failed - ${messages}` : `Validation failed: ${messages}`)
    }

    this.errors = errors
    this.data = data
    this.statusCode = statusCode

    if (ErrorCtor.captureStackTrace) {
      ErrorCtor.captureStackTrace(this, ValidationError)
    }
  }

  toJSON(): {
    error: string
    message: string
    statusCode: number
    details: Array<{
      field: string | null
      message: string
      keyword: string
      params?: Record<string, unknown>
    }>
  } {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.errors.map(e => ({
        field: e.path ? e.path.replace(/^\//, '') : null,
        message: e.message,
        keyword: e.keyword,
        ...(e.params !== undefined ? { params: e.params } : {}),
      })),
    }
  }

  getFieldError(field: string): ValidationErrorItem | null {
    const normalized = field.replace(/^\//, '')
    return (
      this.errors.find(e => {
        if (!e.path) return false
        return e.path.replace(/^\//, '') === normalized
      }) ?? null
    )
  }

  getFieldErrors(): Record<string, string> {
    const result: Record<string, string> = {}
    for (const e of this.errors) {
      if (e.path) {
        const field = e.path.replace(/^\//, '')
        if (field) result[field] = e.message
      }
    }
    return result
  }

  hasFieldError(field: string): boolean {
    return this.getFieldError(field) !== null
  }

  getErrorCount(): number {
    return this.errors.length
  }
}
