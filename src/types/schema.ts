/**
 * JSON Schema Draft 7 类型定义
 * 含 schema-dsl 内部 key（以 _ 开头，toJsonSchema() 时清除）
 */
import type { ErrorMessages } from './error.js'

export interface JSONSchema {
  // --- 标准 JSON Schema Draft 7 字段 ---
  type?: string | string[]
  properties?: Record<string, JSONSchema>
  required?: string[]
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number | boolean
  exclusiveMaximum?: number | boolean
  multipleOf?: number
  pattern?: string
  format?: string
  enum?: unknown[]
  const?: unknown
  items?: JSONSchema | JSONSchema[]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  additionalProperties?: boolean | JSONSchema
  allOf?: JSONSchema[]
  anyOf?: JSONSchema[]
  oneOf?: JSONSchema[]
  not?: JSONSchema
  if?: JSONSchema
  then?: JSONSchema
  else?: JSONSchema
  title?: string
  description?: string
  default?: unknown
  examples?: unknown[]
  $ref?: string
  $schema?: string
  $id?: string
  definitions?: Record<string, JSONSchema>
  $defs?: Record<string, JSONSchema>

  // --- schema-dsl 内部 key（parse 过程使用，输出时清除）---
  _label?: string
  _customMessages?: Record<string, string>
  _description?: string
  _required?: boolean

  // 允许自定义关键字扩展（AJV 自定义 keyword）
  [key: string]: unknown
}

/**
 * SchemaIO 配置选项（向后兼容 v1）
 */
export interface SchemaIOOptions {
  allErrors?: boolean
  verbose?: boolean
  messages?: ErrorMessages
  locale?: string
  cache?: boolean
  cacheSize?: number
  [key: string]: unknown
}
