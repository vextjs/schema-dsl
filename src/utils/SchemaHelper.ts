/**
 * SchemaHelper — Schema utility functions.
 *
 * Common helpers for JSON Schema structure manipulation:
 *   isValidSchema, generateSchemaId, cloneSchema, flattenSchema,
 *   getFieldPaths, extractRequiredFields, compareSchemas, simplifySchema,
 *   isValidPropertyName, getSchemaComplexity, summarizeSchema
 */

import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'
import { cloneSchemaValue } from './schemaClone.js'

const JSON_SCHEMA_KEYWORDS = new Set([
  '$schema',
  '$id',
  '$ref',
  '$defs',
  '$comment',
  '$anchor',
  'type',
  'properties',
  'patternProperties',
  'additionalProperties',
  'propertyNames',
  'required',
  'items',
  'prefixItems',
  'additionalItems',
  'contains',
  'minContains',
  'maxContains',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
  'enum',
  'const',
  'format',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
  'dependencies',
  'dependentRequired',
  'dependentSchemas',
  'definitions',
  'unevaluatedItems',
  'unevaluatedProperties',
  'title',
  'description',
  'default',
  'examples',
  'readOnly',
  'writeOnly',
  'deprecated',
  'contentEncoding',
  'contentMediaType',
])

const RUNTIME_FUNCTION_IDS = new WeakMap<object, number>()
let nextRuntimeFunctionId = 0

function isObjectSchema(value: JSONSchemaInput): value is JSONSchema {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function getRuntimeFunctionId(value: object): number {
  const existing = RUNTIME_FUNCTION_IDS.get(value)
  if (existing !== undefined) return existing
  const id = nextRuntimeFunctionId++
  RUNTIME_FUNCTION_IDS.set(value, id)
  return id
}

function stableSchemaStringify(value: unknown, seen = new Map<object, number>()): string {
  if (value === null) return 'null'

  switch (typeof value) {
    case 'string':
    case 'boolean':
      return JSON.stringify(value)
    case 'number':
      return Number.isFinite(value) ? JSON.stringify(value) : JSON.stringify(String(value))
    case 'bigint':
      return JSON.stringify(`${value.toString()}n`)
    case 'undefined':
      return '"__undefined__"'
    case 'symbol':
      return JSON.stringify(value.toString())
    case 'function':
      return JSON.stringify(`[FunctionRef:${getRuntimeFunctionId(value)}:${value.name || 'anonymous'}:${Function.prototype.toString.call(value)}]`)
    case 'object':
      break
  }

  if (value instanceof RegExp) {
    return JSON.stringify({ $regex: value.source, $flags: value.flags })
  }

  if (value instanceof Date) {
    return JSON.stringify({ $date: value.toISOString() })
  }

  const obj = value as Record<PropertyKey, unknown>
  const existing = seen.get(obj)
  if (existing !== undefined) return JSON.stringify(`[Circular:${existing}]`)

  seen.set(obj, seen.size)
  if (Array.isArray(value)) {
    const items = value.map(item => stableSchemaStringify(item, seen))
    seen.delete(obj)
    return `[${items.join(',')}]`
  }

  const entries = Reflect.ownKeys(obj)
    .sort((left, right) => String(left).localeCompare(String(right)))
    .map(key => `${JSON.stringify(String(key))}:${stableSchemaStringify(obj[key], seen)}`)
  seen.delete(obj)

  return `{${entries.join(',')}}`
}

export class SchemaHelper {
  /**
   * Check whether the value is a JSON Schema-like value.
   */
  static isValidSchema(schema: unknown): schema is JSONSchemaInput {
    if (typeof schema === 'boolean') return true
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false
    const s = schema as Record<string, unknown>
    return Object.keys(s).some(key => JSON_SCHEMA_KEYWORDS.has(key))
  }

  /**
   * Generate a content-hash-based unique ID for a schema.
   * Function validators are runtime values and are hashed by process-local reference identity.
   */
  static generateSchemaId(schema: JSONSchema): string {
    const str = stableSchemaStringify(schema)
    let hash = 0xcbf29ce484222325n
    const prime = 0x100000001b3n
    for (let i = 0; i < str.length; i++) {
      hash ^= BigInt(str.charCodeAt(i))
      hash = BigInt.asUintN(64, hash * prime)
    }
    return `schema_${hash.toString(36)}`
  }

  /**
   * Deep-clone a schema without JSON serialisation, preserving Function/RegExp fields.
   */
  static cloneSchema(schema: JSONSchema): JSONSchema {
    return cloneSchemaValue(schema)
  }

  /**
   * Flatten a nested schema into dot-separated path form.
   * @param prefix - Property path prefix.
   */
  static flattenSchema(schema: JSONSchema, prefix = ''): Record<string, JSONSchemaInput> {
    const result: Record<string, JSONSchemaInput> = {}

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (isObjectSchema(value) && value.type === 'object' && value.properties) {
          Object.assign(result, this.flattenSchema(value, fullKey))
        } else {
          result[fullKey] = value
        }
      }
    }

    return result
  }

  /**
   * Get all field paths in a schema (including nested object and array paths).
   */
  static getFieldPaths(schema: JSONSchema): string[] {
    const paths: string[] = []

    function traverse(obj: JSONSchemaInput, currentPath = ''): void {
      if (!isObjectSchema(obj)) return
      if (obj.properties) {
        for (const [key, value] of Object.entries(obj.properties)) {
          const path = currentPath ? `${currentPath}.${key}` : key
          paths.push(path)
          if (isObjectSchema(value) && value.type === 'object') {
            traverse(value, path)
          } else if (isObjectSchema(value) && value.type === 'array' && value.items) {
            const items = Array.isArray(value.items) ? value.items : [value.items]
            items.forEach(item => traverse(item, `${path}[]`))
          }
        }
      }
    }

    traverse(schema)
    return paths
  }

  /**
   * Extract all required fields from a schema (including nested paths).
   */
  static extractRequiredFields(schema: JSONSchema): string[] {
    const required: string[] = []

    function traverse(obj: JSONSchemaInput, prefix = ''): void {
      if (!isObjectSchema(obj)) return
      if (obj.required && Array.isArray(obj.required)) {
        for (const field of obj.required) {
          required.push(prefix ? `${prefix}.${field}` : field)
        }
      }
      if (obj.properties) {
        for (const [key, value] of Object.entries(obj.properties)) {
          if (isObjectSchema(value) && value.type === 'object') {
            traverse(value, prefix ? `${prefix}.${key}` : key)
          }
        }
      }
    }

    traverse(schema)
    return required
  }

  /**
   * Compare two schemas for structural equality with stable key ordering.
   */
  static compareSchemas(schema1: JSONSchema, schema2: JSONSchema): boolean {
    return stableSchemaStringify(schema1) === stableSchemaStringify(schema2)
  }

  /**
   * Simplify a schema by removing $schema, empty properties, and empty required arrays.
   */
  static simplifySchema(schema: JSONSchema): JSONSchema {
    const simplified = this.cloneSchema(schema) as Record<string, unknown>

    delete simplified['$schema']

    const props = simplified['properties'] as Record<string, unknown> | undefined
    if (props && Object.keys(props).length === 0) {
      delete simplified['properties']
    }

    const req = simplified['required'] as unknown[] | undefined
    if (req && req.length === 0) {
      delete simplified['required']
    }

    return simplified as JSONSchema
  }

  /**
   * Validate that a property name is legal (letters/digits/underscores/hyphens; must start with a letter or underscore).
   */
  static isValidPropertyName(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name)
  }

  /**
   * Get the maximum nesting depth (complexity) of a schema.
   */
  static getSchemaComplexity(schema: JSONSchema): number {
    let maxDepth = 0

    function traverse(obj: JSONSchemaInput, depth: number): void {
      if (!isObjectSchema(obj)) return
      maxDepth = Math.max(maxDepth, depth)
      if (obj.properties) {
        for (const value of Object.values(obj.properties)) {
          if (isObjectSchema(value) && value.type === 'object') {
            traverse(value, depth + 1)
          } else if (isObjectSchema(value) && value.type === 'array' && value.items) {
            const items = Array.isArray(value.items) ? value.items : [value.items]
            items.forEach(item => traverse(item, depth + 1))
          }
        }
      }
    }

    traverse(schema, 0)
    return maxDepth
  }

  /**
   * Generate a summary of schema metadata.
   */
  static summarizeSchema(schema: JSONSchema): {
    type: string
    fieldCount: number
    requiredCount: number
    complexity: number
    hasNested: boolean
    fields: string[]
  } {
    const fields = this.getFieldPaths(schema)
    const requiredFields = this.extractRequiredFields(schema)
    const complexity = this.getSchemaComplexity(schema)

    return {
      type: (schema.type as string) ?? 'unknown',
      fieldCount: fields.length,
      requiredCount: requiredFields.length,
      complexity,
      hasNested: complexity > 0,
      fields,
    }
  }
}
