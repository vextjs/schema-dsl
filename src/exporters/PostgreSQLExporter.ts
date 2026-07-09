/**
 * PostgreSQLExporter — Export JSON Schema as a PostgreSQL CREATE TABLE DDL statement.
 *
 * v2 fixes:
 *   Identifiers are escaped with double quotes (`"identifier"` format) instead of v1's unescaped raw identifiers.
 *   Column comments use the fully-qualified `"schema"."table"."column"` format.
 */

import type { JSONSchema } from '../types/schema.js'
import { BaseExporter, type ExporterOptions, type ExportReport, type ExportReportOptions } from './BaseExporter.js'
import { TypeConverter } from '../utils/TypeConverter.js'

// ==================== Type definitions ====================

export interface PostgreSQLExporterOptions extends ExporterOptions {
  /** PostgreSQL schema name (default: public). */
  schema: string
  /** Whether to wrap identifiers in double quotes (default true). Unsafe raw identifiers throw when false. */
  quoteIdentifiers?: boolean
}

export interface GeneratePgIndexOptions {
  name?: string
  unique?: boolean
  method?: 'btree' | 'hash' | 'gin' | 'gist' | string
}

const POSTGRESQL_INDEX_METHODS = new Set(['btree', 'hash', 'gin', 'gist'])
const POSTGRESQL_UNSUPPORTED_REPORT_KEYWORDS = [
  '$ref',
  '$defs',
  'definitions',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
  'const',
  'format',
  'pattern',
  'multipleOf',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
  'additionalProperties',
  'patternProperties',
  'propertyNames',
  'dependentRequired',
  'dependencies',
  'dependentSchemas',
  'contains',
  'prefixItems',
  'unevaluatedItems',
  'unevaluatedProperties',
] as const

function isObjectSchema(value: unknown): value is JSONSchema {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

// ==================== PostgreSQLExporter ====================

export class PostgreSQLExporter extends BaseExporter<PostgreSQLExporterOptions> {
  constructor(options: Partial<PostgreSQLExporterOptions> = {}) {
    super({ schema: 'public', quoteIdentifiers: true, ...options })
  }

  /**
   * Export as a PostgreSQL CREATE TABLE statement.
   */
  export(tableName: string, jsonSchema: JSONSchema): string {
    if (!tableName || typeof tableName !== 'string') {
      throw new Error('[schema-dsl] Table name is required')
    }
    this._assertObjectSchema(jsonSchema)

    // Fix: wrap identifiers in double quotes to avoid reserved-word conflicts
    const schemaIdent = this._quoteIdent(this.options.schema)
    const tableIdent = this._quoteIdent(tableName)
    const fullTableName = `${schemaIdent}.${tableIdent}`

    const columns = this._convertProperties(jsonSchema)
    const primaryKey = this._detectPrimaryKey(jsonSchema)

    let ddl = `CREATE TABLE ${fullTableName} (\n`
    ddl += columns.map(col => `  ${col}`).join(',\n')

    if (primaryKey) {
      ddl += `,\n  PRIMARY KEY (${this._quoteIdent(primaryKey)})`
    }

    ddl += `\n);`

    if (jsonSchema.description) {
      ddl += `\n\nCOMMENT ON TABLE ${fullTableName} IS '${this._escapeString(jsonSchema.description)}';`
    }

    const commentDdls = this._generateColumnComments(fullTableName, tableName, jsonSchema)
    if (commentDdls.length > 0) {
      ddl += '\n\n' + commentDdls.join('\n')
    }

    return ddl
  }

  exportWithReport(tableName: string, jsonSchema: JSONSchema, options: ExportReportOptions = {}): ExportReport<string> {
    return this._createExportReport(this.export(tableName, jsonSchema), jsonSchema, options, POSTGRESQL_UNSUPPORTED_REPORT_KEYWORDS, 'postgresql')
  }

  /**
   * Generate a CREATE INDEX statement.
   */
  generateIndex(tableName: string, columnName: string, options: GeneratePgIndexOptions = {}): string {
    const fullTableName = `${this._quoteIdent(this.options.schema)}.${this._quoteIdent(tableName)}`
    const indexName = options.name ?? `idx_${tableName}_${columnName}`
    const unique = options.unique ? 'UNIQUE ' : ''
    const method = this._normalizeIndexMethod(options.method ?? 'btree')
    return `CREATE ${unique}INDEX ${this._quoteIdent(indexName)} ON ${fullTableName} USING ${method} (${this._quoteIdent(columnName)});`
  }

  /**
   * Static quick-export shorthand.
   */
  static export(tableName: string, jsonSchema: JSONSchema): string {
    return new PostgreSQLExporter().export(tableName, jsonSchema)
  }

  // ==================== Private methods ====================

  /** Conditionally wrap a PG identifier in double quotes (default); raw mode only accepts safe identifiers. */
  private _quoteIdent(name: string): string {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error(`[schema-dsl] PostgreSQL identifier must be a non-empty string (got ${String(name)})`)
    }
    if (this.options.quoteIdentifiers) {
      return `"${name.replace(/"/g, '""')}"`
    }
    if (!/^[A-Za-z_][A-Za-z0-9_$]*$/.test(name)) {
      throw new Error(`[schema-dsl] Unsafe PostgreSQL identifier requires quoteIdentifiers=true: ${name}`)
    }
    return name
  }

  private _normalizeIndexMethod(method: string): string {
    const normalized = method.toLowerCase()
    if (!POSTGRESQL_INDEX_METHODS.has(normalized)) {
      throw new Error(`[schema-dsl] Unsupported PostgreSQL index method: ${method}`)
    }
    return normalized
  }

  private _convertProperties(schema: JSONSchema): string[] {
    if (!schema.properties) return []

    const required = schema.required ?? []
    const columns: string[] = []

    for (const [name, propSchema] of Object.entries(schema.properties)) {
      columns.push(this._convertColumn(name, isObjectSchema(propSchema) ? propSchema : {}, required.includes(name)))
    }

    return columns
  }

  private _convertColumn(name: string, schema: JSONSchema, isRequired: boolean): string {
    const { jsonType, sqlType } = this._resolveColumnType(name, schema)

    let def = `${this._quoteIdent(name)} ${sqlType}`

    if (isRequired) def += ' NOT NULL'

    if (schema.default !== undefined) {
      def += ` DEFAULT ${this._formatDefaultValue(schema.default, jsonType)}`
    }

    const checkConstraints = this._generateCheckConstraints(name, schema)
    if (checkConstraints.length > 0) {
      def += ' ' + checkConstraints.join(' ')
    }

    return def
  }

  private _resolveColumnType(name: string, schema: JSONSchema): { jsonType: string; sqlType: string } {
    if (schema.type) {
      const jsonType = TypeConverter.primaryJSONType(schema.type as string | string[]) ?? String(schema.type)
      return {
        jsonType,
        sqlType: TypeConverter.toPostgreSQLType(schema.type as string | string[], schema),
      }
    }

    const variants = (schema.anyOf ?? schema.oneOf)?.filter(isObjectSchema) as JSONSchema[] | undefined
    if (!variants?.length) {
      return {
        jsonType: 'string',
        sqlType: TypeConverter.toPostgreSQLType('string', schema),
      }
    }

    const sqlTypes = new Set(
      variants.map(variant => TypeConverter.toPostgreSQLType((variant.type as string | string[] | undefined) ?? 'string', variant))
    )

    if (sqlTypes.size !== 1) {
      const unionKind = schema.anyOf ? 'anyOf' : 'oneOf'
      throw new Error(`[schema-dsl] PostgreSQL exporter cannot safely map ${unionKind} for column "${name}" to a single SQL type`)
    }

    return {
      jsonType: TypeConverter.primaryJSONType((variants[0]?.type as string | string[] | undefined) ?? 'string') ?? 'string',
      sqlType: [...sqlTypes][0],
    }
  }

  private _generateCheckConstraints(columnName: string, schema: JSONSchema): string[] {
    const checks: string[] = []
    const col = this._quoteIdent(columnName)

    if (schema.minLength !== undefined || schema.maxLength !== undefined) {
      if (schema.minLength !== undefined && schema.maxLength !== undefined) {
        checks.push(`CHECK (LENGTH(${col}) BETWEEN ${this._formatFiniteNumber(schema.minLength, 'minLength')} AND ${this._formatFiniteNumber(schema.maxLength, 'maxLength')})`)
      } else if (schema.minLength !== undefined) {
        checks.push(`CHECK (LENGTH(${col}) >= ${this._formatFiniteNumber(schema.minLength, 'minLength')})`)
      } else if (schema.maxLength !== undefined) {
        checks.push(`CHECK (LENGTH(${col}) <= ${this._formatFiniteNumber(schema.maxLength, 'maxLength')})`)
      }
    }

    if (schema.minimum !== undefined || schema.maximum !== undefined) {
      if (schema.minimum !== undefined && schema.maximum !== undefined) {
        checks.push(`CHECK (${col} BETWEEN ${this._formatFiniteNumber(schema.minimum, 'minimum')} AND ${this._formatFiniteNumber(schema.maximum, 'maximum')})`)
      } else if (schema.minimum !== undefined) {
        checks.push(`CHECK (${col} >= ${this._formatFiniteNumber(schema.minimum, 'minimum')})`)
      } else if (schema.maximum !== undefined) {
        checks.push(`CHECK (${col} <= ${this._formatFiniteNumber(schema.maximum, 'maximum')})`)
      }
    }

    if (schema.enum) {
      const values = (schema.enum as unknown[]).map(v => `'${this._escapeString(String(v))}'`).join(', ')
      checks.push(`CHECK (${col} IN (${values}))`)
    }

    return checks
  }

  private _formatDefaultValue(value: unknown, type: string): string {
    if (value === null) return 'NULL'
    if (type === 'string') return `'${this._escapeString(String(value))}'`
    if (type === 'boolean') return value ? 'TRUE' : 'FALSE'
    if (type === 'object' || type === 'array') return `'${this._escapeString(JSON.stringify(value))}'::JSONB`
    if (type === 'number' || type === 'integer') return this._formatFiniteNumber(value, 'default')
    return String(value)
  }

  private _formatFiniteNumber(value: unknown, label: string): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`[schema-dsl] PostgreSQL ${label} must be a finite number (got ${String(value)})`)
    }
    return String(value)
  }

  private _generateColumnComments(_fullTableName: string, tableName: string, schema: JSONSchema): string[] {
    if (!schema.properties) return []

    const comments: string[] = []
    for (const [name, propSchema] of Object.entries(schema.properties)) {
      if (isObjectSchema(propSchema) && propSchema.description) {
        // fullTableName is already quoted; quote the column identifier separately
        const schemaIdent = this._quoteIdent(this.options.schema)
        const tableIdent = this._quoteIdent(tableName)
        const colIdent = this._quoteIdent(name)
        comments.push(
          `COMMENT ON COLUMN ${schemaIdent}.${tableIdent}.${colIdent} IS '${this._escapeString(propSchema.description)}';`,
        )
      }
    }

    return comments
  }
}
