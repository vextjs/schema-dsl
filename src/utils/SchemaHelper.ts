/**
 * SchemaHelper — Schema utility functions.
 *
 * Common helpers for JSON Schema structure manipulation:
 *   isValidSchema, generateSchemaId, cloneSchema, flattenSchema,
 *   getFieldPaths, extractRequiredFields, compareSchemas, simplifySchema,
 *   isValidPropertyName, getSchemaComplexity, summarizeSchema
 */

import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'

function isObjectSchema(value: JSONSchemaInput): value is JSONSchema {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export class SchemaHelper {
  /**
   * Check whether the value is a valid JSON Schema (must contain at least one of: type / properties / items / $ref).
   */
  static isValidSchema(schema: unknown): schema is JSONSchema {
    if (!schema || typeof schema !== 'object') return false
    const s = schema as Record<string, unknown>
    return !!(s['type'] || s['properties'] || s['items'] || s['$ref']
      || s['anyOf'] || s['oneOf'] || s['allOf'] || s['enum'])
  }

  /**
   * Generate a content-hash-based unique ID for a schema.
   */
  static generateSchemaId(schema: JSONSchema): string {
    const str = JSON.stringify(schema)
    let hash = 0xcbf29ce484222325n
    const prime = 0x100000001b3n
    for (let i = 0; i < str.length; i++) {
      hash ^= BigInt(str.charCodeAt(i))
      hash = BigInt.asUintN(64, hash * prime)
    }
    return `schema_${hash.toString(36)}`
  }

  /**
   * Deep-clone a schema via JSON serialisation (Function/RegExp fields are not preserved).
   */
  static cloneSchema(schema: JSONSchema): JSONSchema {
    return JSON.parse(JSON.stringify(schema)) as JSONSchema
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
   * Shallow-compare two schemas for equality (via JSON serialisation).
   */
  static compareSchemas(schema1: JSONSchema, schema2: JSONSchema): boolean {
    return JSON.stringify(schema1) === JSON.stringify(schema2)
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
