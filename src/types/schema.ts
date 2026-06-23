/**
 * JSON Schema Draft 7 type definitions.
 * Includes schema-dsl internal keys (prefixed with _; stripped by toJsonSchema()).
 */
import type { ErrorMessages } from './error.js'

export interface JSONSchema {
  // --- Standard JSON Schema Draft 7 fields ---
  type?: string | string[]
  properties?: Record<string, JSONSchemaInput>
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
  items?: JSONSchemaInput | JSONSchemaInput[]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  additionalProperties?: JSONSchemaInput
  allOf?: JSONSchemaInput[]
  anyOf?: JSONSchemaInput[]
  oneOf?: JSONSchemaInput[]
  not?: JSONSchemaInput
  if?: JSONSchemaInput
  then?: JSONSchemaInput
  else?: JSONSchemaInput
  title?: string
  description?: string
  default?: unknown
  examples?: unknown[]
  $ref?: string
  $schema?: string
  $id?: string
  definitions?: Record<string, JSONSchemaInput>
  $defs?: Record<string, JSONSchemaInput>

  // --- schema-dsl internal keys (used during parsing; stripped on output) ---
  _label?: string
  _customMessages?: Record<string, string>
  _description?: string
  _required?: boolean

  // Allows custom keyword extensions (AJV custom keywords)
  [key: string]: unknown
}

export type JSONSchemaInput = JSONSchema | boolean

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
