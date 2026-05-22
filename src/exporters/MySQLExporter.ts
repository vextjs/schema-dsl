/**
 * MySQLExporter — Export JSON Schema as a MySQL CREATE TABLE DDL statement.
 *
 * v2 fixes:
 *   _escapeString uses standard SQL single-quote escaping (`'` → `''`)
 *   _convertColumn passes the full schema object to TypeConverter.toMySQLType (includes maxLength etc.)
 */

import type { JSONSchema } from '../types/schema.js'
import { BaseExporter, type ExporterOptions } from './BaseExporter.js'
import { TypeConverter } from '../utils/TypeConverter.js'

// ==================== Type definitions ====================

export interface MySQLExporterOptions extends ExporterOptions {
  engine: string
  charset: string
  collate: string
}

export interface GenerateIndexOptions {
  name?: string
  unique?: boolean
}

// ==================== MySQLExporter ====================

export class MySQLExporter extends BaseExporter<MySQLExporterOptions> {
  constructor(options: Partial<MySQLExporterOptions> = {}) {
    super({
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      ...options,
    })
  }

  /**
   * Export as a MySQL CREATE TABLE statement.
   */
  export(tableName: string, jsonSchema: JSONSchema): string {
    if (!tableName || typeof tableName !== 'string') {
      throw new Error('[schema-dsl] Table name is required')
    }
    this._assertObjectSchema(jsonSchema)

    const columns = this._convertProperties(jsonSchema)
    const primaryKey = this._detectPrimaryKey(jsonSchema)

    let ddl = `CREATE TABLE ${this._quoteIdent(tableName)} (\n`
    ddl += columns.map(col => `  ${col}`).join(',\n')

    if (primaryKey) {
      ddl += `,\n  PRIMARY KEY (${this._quoteIdent(primaryKey)})`
    }

    ddl += `\n)`
    ddl += ` ENGINE=${this.options.engine}`
    ddl += ` DEFAULT CHARSET=${this.options.charset}`
    ddl += ` COLLATE=${this.options.collate};`

    return ddl
  }

  /**
   * Generate a CREATE INDEX statement.
   */
  generateIndex(tableName: string, columnName: string, options: GenerateIndexOptions = {}): string {
    const indexName = options.name ?? `idx_${tableName}_${columnName}`
    const unique = options.unique ? 'UNIQUE ' : ''
    return `CREATE ${unique}INDEX ${this._quoteIdent(indexName)} ON ${this._quoteIdent(tableName)} (${this._quoteIdent(columnName)});`
  }

  /**
   * Static quick-export shorthand.
   */
  static export(tableName: string, jsonSchema: JSONSchema): string {
    return new MySQLExporter().export(tableName, jsonSchema)
  }

  // ==================== Private methods ====================

  private _quoteIdent(name: string): string {
    return '`' + name.replace(/`/g, '``') + '`'
  }

  private _convertProperties(schema: JSONSchema): string[] {
    if (!schema.properties) return []

    const required = schema.required ?? []
    const columns: string[] = []

    for (const [name, propSchema] of Object.entries(schema.properties)) {
      columns.push(this._convertColumn(name, propSchema, required.includes(name)))
    }

    return columns
  }

  private _convertColumn(name: string, schema: JSONSchema, isRequired: boolean): string {
    const { jsonType, sqlType } = this._resolveColumnType(name, schema)

    let def = `${this._quoteIdent(name)} ${sqlType}`

    def += isRequired ? ' NOT NULL' : ' NULL'

    if (schema.default !== undefined) {
      def += ` DEFAULT ${this._formatDefaultValue(schema.default, jsonType)}`
    }

    if (schema.description) {
      def += ` COMMENT '${this._escapeString(schema.description)}'`
    }

    return def
  }

  private _resolveColumnType(name: string, schema: JSONSchema): { jsonType: string; sqlType: string } {
    if (schema.type) {
      return {
        jsonType: String(schema.type),
        sqlType: TypeConverter.toMySQLType(schema.type as string | string[], schema),
      }
    }

    const variants = (schema.anyOf ?? schema.oneOf) as JSONSchema[] | undefined
    if (!variants?.length) {
      return {
        jsonType: 'string',
        sqlType: TypeConverter.toMySQLType('string', schema),
      }
    }

    const sqlTypes = new Set(
      variants.map(variant => TypeConverter.toMySQLType((variant.type as string | string[] | undefined) ?? 'string', variant))
    )

    if (sqlTypes.size !== 1) {
      const unionKind = schema.anyOf ? 'anyOf' : 'oneOf'
      throw new Error(`[schema-dsl] MySQL exporter cannot safely map ${unionKind} for column "${name}" to a single SQL type`)
    }

    return {
      jsonType: String(variants[0]?.type ?? 'string'),
      sqlType: [...sqlTypes][0],
    }
  }

  private _formatDefaultValue(value: unknown, type: string): string {
    if (value === null) return 'NULL'
    if (type === 'string') return `'${this._escapeString(String(value))}'`
    if (type === 'boolean') return value ? '1' : '0'
    if (typeof value === 'object' && value !== null) return `'${this._escapeString(JSON.stringify(value))}'`
    return String(value)
  }
}
