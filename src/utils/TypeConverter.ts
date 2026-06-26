/**
 * TypeConverter — Schema type conversion utilities (static methods).
 *
 * Maps JSON Schema types to target-format types:
 *   - JSON Schema type
 *   - MongoDB BSON type
 *   - MySQL column type
 *   - PostgreSQL column type
 *
 * Also includes format helpers: normalizePropertyName, formatToRegex, mergeSchemas, extractConstraints.
 */

import type { JSONSchema } from '../types/schema.js'
import { createSchemaRecord, setSchemaRecordValue } from './schemaRecord.js'

// ==================== Type aliases ====================

export type JSType = string | string[]

const MYSQL_INTEGER_RANGES = [
  { type: 'TINYINT', min: -128, max: 127 },
  { type: 'SMALLINT', min: -32768, max: 32767 },
  { type: 'INT', min: -2147483648, max: 2147483647 },
] as const

// ==================== TypeConverter ====================

export class TypeConverter {
  static primaryJSONType(jsonSchemaType: JSType): string | null {
    if (!Array.isArray(jsonSchemaType)) return jsonSchemaType
    return jsonSchemaType.find(type => String(type).toLowerCase() !== 'null') ?? jsonSchemaType[0] ?? null
  }

  // ========== JSON Schema types ==========

  static toJSONSchemaType(nativeType: string): string {
    const mapping: Record<string, string> = {
      string: 'string',
      number: 'number',
      integer: 'integer',
      boolean: 'boolean',
      object: 'object',
      array: 'array',
      null: 'null',
      any: 'string',
      email: 'string',
      url: 'string',
      uuid: 'string',
      date: 'string',
      datetime: 'string',
    }
    return mapping[nativeType.toLowerCase()] ?? 'string'
  }

  // ========== MongoDB types ==========

  static toMongoDBType(jsonSchemaType: JSType): string {
    const t = TypeConverter.primaryJSONType(jsonSchemaType)
    const mapping: Record<string, string> = {
      string: 'string',
      number: 'double',
      integer: 'int',
      boolean: 'bool',
      object: 'object',
      array: 'array',
      null: 'null',
    }
    return mapping[String(t).toLowerCase()] ?? 'string'
  }

  // ========== MySQL types ==========

  static toMySQLType(jsonSchemaType: JSType, schema?: JSONSchema): string {
    const t = TypeConverter.primaryJSONType(jsonSchemaType)

    // String enum detection: SQL ENUM is string-valued; numeric/boolean enums keep their native column type.
    if (String(t).toLowerCase() === 'string' && schema?.enum && Array.isArray(schema.enum)) {
      const values = (schema.enum as unknown[]).map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ')
      return `ENUM(${values})`
    }

    switch (String(t).toLowerCase()) {
      case 'string': {
        // Check for date format
        if (schema?.format === 'date' || schema?.format === 'date-time') {
          return 'DATETIME'
        }
        const maxLen = schema?.maxLength ?? 255
        if (maxLen <= 255) return `VARCHAR(${maxLen})`
        if (maxLen <= 65535) return 'TEXT'
        return 'LONGTEXT'
      }
      case 'number':
        return 'DOUBLE'
      case 'integer': {
        const max = schema?.maximum
        const min = schema?.minimum

        for (const range of MYSQL_INTEGER_RANGES) {
          if (min !== undefined && max !== undefined && min >= range.min && max <= range.max) {
            return range.type
          }
        }

        return 'BIGINT'
      }
      case 'boolean':
        return 'BOOLEAN'
      case 'object':
        return 'JSON'
      case 'array':
        return 'JSON'
      case 'null':
        return 'TEXT'
      default:
        return 'VARCHAR(255)'
    }
  }

  // ========== PostgreSQL types ==========

  static toPostgreSQLType(jsonSchemaType: JSType, schema?: JSONSchema): string {
    const t = TypeConverter.primaryJSONType(jsonSchemaType)

    switch (String(t).toLowerCase()) {
      case 'string': {
        // Handle date format
        if (schema?.format === 'date') return 'DATE'
        if (schema?.format === 'date-time') return 'TIMESTAMP'
        const maxLen = schema?.maxLength
        if (maxLen !== undefined && maxLen <= 255) return `VARCHAR(${maxLen})`
        if (maxLen !== undefined) return 'TEXT'
        return 'VARCHAR(255)'
      }
      case 'number':
        return 'DOUBLE PRECISION'
      case 'integer':
        return 'BIGINT'
      case 'boolean':
        return 'BOOLEAN'
      case 'object':
        return 'JSONB'
      case 'array':
        return 'JSONB'
      case 'null':
        return 'TEXT'
      default:
        return 'TEXT'
    }
  }

  // ========== Property name normalisation ==========

  static normalizePropertyName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^(\d)/, '_$1')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  // ========== Format → RegExp ==========

  static formatToRegex(format: string): RegExp | null {
    const formats: Record<string, RegExp> = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      uri: /^https?:\/\/.+/,
      date: /^\d{4}-\d{2}-\d{2}$/,
      'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
      time: /^\d{2}:\d{2}:\d{2}$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
      ipv6: /^[0-9a-f:]+$/i,
    }
    return formats[format] ?? null
  }

  // ========== Schema merging ==========

  static mergeSchemas(...schemas: JSONSchema[]): JSONSchema {
    const result = createSchemaRecord<unknown>()

    for (const schema of schemas) {
      for (const [key, value] of Object.entries(schema)) {
        if (key === 'properties') {
          setSchemaRecordValue(
            result,
            'properties',
            TypeConverter._mergePropertyMaps(
              (result['properties'] as Record<string, unknown> | undefined) ?? {},
              value as Record<string, unknown>,
            )
          )
        } else if (key === 'required') {
          const existing = (result['required'] as string[]) ?? []
          setSchemaRecordValue(result, 'required', [...new Set([...existing, ...(value as string[])])])
        } else {
          setSchemaRecordValue(result, key, value)
        }
      }
    }

    return result as JSONSchema
  }

  private static _mergePropertyMaps(
    base: Record<string, unknown>,
    extension: Record<string, unknown>
  ): Record<string, unknown> {
    const result = createSchemaRecord<unknown>()
    for (const [key, value] of Object.entries(base)) {
      setSchemaRecordValue(result, key, value)
    }
    for (const [key, value] of Object.entries(extension)) {
      setSchemaRecordValue(result, key, value)
    }
    return result
  }

  // ========== Constraint extraction ==========

  static extractConstraints(schema: JSONSchema): Record<string, unknown> {
    const constraintKeys = [
      'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
      'multipleOf', 'minLength', 'maxLength', 'pattern',
      'minItems', 'maxItems', 'uniqueItems', 'minProperties', 'maxProperties',
      'enum', 'format', 'const',
    ] as const

    const result = createSchemaRecord<unknown>()
    for (const key of constraintKeys) {
      if (key in schema) {
        setSchemaRecordValue(result, key, (schema as Record<string, unknown>)[key])
      }
    }
    return result
  }
}
