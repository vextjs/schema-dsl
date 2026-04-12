import type { ErrorCodeMap } from '../types/error.js'

/**
 * 错误码常量
 * 定义所有内置的错误码，供 ErrorFormatter 和 Locale 使用
 */
export const ErrorCodes: ErrorCodeMap = {
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_SCHEMA: 'INVALID_SCHEMA',
  // 配置错误
  INVALID_CONFIG: 'INVALID_CONFIG',
  INVALID_LOCALE: 'INVALID_LOCALE',
  // 插件错误
  PLUGIN_INSTALL_ERROR: 'PLUGIN_INSTALL_ERROR',
  PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND',
}

/**
 * 错误类型 → 简短 code 映射（用于 AJV keyword 映射到 schema-dsl 简写）
 */
export const KEYWORD_MAP: Record<string, string> = {
  minLength: 'min',
  maxLength: 'max',
  minimum: 'min',
  maximum: 'max',
  minItems: 'min',
  maxItems: 'max',
  exclusiveMinimum: 'min',
  exclusiveMaximum: 'max',
  pattern: 'pattern',
  format: 'format',
  required: 'required',
  enum: 'enum',
  type: 'type',
  uniqueItems: 'uniqueItems',
  additionalProperties: 'additionalProperties',
}
