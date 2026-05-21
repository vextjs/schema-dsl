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
    // For anyOf/oneOf without top-level type, resolve the effective type from the first variant
    const effectiveType: string | string[] = schema.type
      ? (schema.type as string | string[])
      : ((schema.anyOf ?? schema.oneOf) as JSONSchema[] | undefined)?.[0]?.type as string ?? 'string'
    const mysqlType = TypeConverter.toMySQLType(effectiveType, schema)

    let def = `${this._quoteIdent(name)} ${mysqlType}`

    def += isRequired ? ' NOT NULL' : ' NULL'

    if (schema.default !== undefined) {
      def += ` DEFAULT ${this._formatDefaultValue(schema.default, schema.type as string)}`
    }

    if (schema.description) {
      def += ` COMMENT '${this._escapeString(schema.description)}'`
    }

    return def
  }

  private _formatDefaultValue(value: unknown, type: string): string {
    if (value === null) return 'NULL'
    if (type === 'string') return `'${this._escapeString(String(value))}'`
    if (type === 'boolean') return value ? '1' : '0'
    return String(value)
  }
}
