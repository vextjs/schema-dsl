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
    ddl += this._formatTableOptions()

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

  protected override _escapeString(str: string): string {
    return str.replace(/[\0\n\r\x1a\\']/g, char => {
      switch (char) {
        case '\0':
          return '\\0'
        case '\n':
          return '\\n'
        case '\r':
          return '\\r'
        case '\x1a':
          return '\\Z'
        case '\\':
          return '\\\\'
        case '\'':
          return "''"
        default:
          return char
      }
    })
  }

  private _assertOptionIdent(kind: string, value: unknown): string {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_]+$/.test(value)) {
      throw new Error(`[schema-dsl] Invalid MySQL ${kind}: ${value}`)
    }
    return value
  }

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
      const jsonType = TypeConverter.primaryJSONType(schema.type as string | string[]) ?? String(schema.type)
      return {
        jsonType,
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
      jsonType: TypeConverter.primaryJSONType((variants[0]?.type as string | string[] | undefined) ?? 'string') ?? 'string',
      sqlType: [...sqlTypes][0],
    }
  }

  private _formatDefaultValue(value: unknown, type: string): string {
    if (value === null) return 'NULL'
    if (type === 'string') return `'${this._escapeString(String(value))}'`
    if (type === 'boolean') return value ? '1' : '0'
    if (type === 'number' || type === 'integer') {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`[schema-dsl] MySQL numeric default must be a finite number (got ${String(value)})`)
      }
    }
    if (typeof value === 'object' && value !== null) return `'${this._escapeString(JSON.stringify(value))}'`
    return String(value)
  }

  private _formatTableOptions(): string {
    const engine = this._assertOptionIdent('engine', this.options.engine)
    const charset = this._assertOptionIdent('charset', this.options.charset)
    const collate = this._assertOptionIdent('collate', this.options.collate)
    return ` ENGINE=${engine} DEFAULT CHARSET=${charset} COLLATE=${collate};`
  }
}
