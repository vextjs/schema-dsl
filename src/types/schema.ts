/**
 * JSON Schema Draft 7 type definitions.
 * Includes schema-dsl internal keys (prefixed with _; stripped by toJsonSchema()).
 */
import type { ErrorMessages } from './error.js'

export interface JSONSchema {
  // --- Standard JSON Schema Draft 7 fields ---
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

  // --- schema-dsl internal keys (used during parsing; stripped on output) ---
  _label?: string
  _customMessages?: Record<string, string>
  _description?: string
  _required?: boolean

  // Allows custom keyword extensions (AJV custom keywords)
  [key: string]: unknown
}

/**
 * SchemaIO configuration options (backwards-compatible with v1).
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
