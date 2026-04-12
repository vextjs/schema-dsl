/**
 * PostgreSQLExporter — 将 JSON Schema 导出为 PostgreSQL CREATE TABLE DDL
 *
 * v2 修复：
 *   标识符使用双引号转义（`"identifier"` → `"${name}"` 格式），而非 v1 的无转义原始标识符
 *   列注释中使用 `"schema"."table"."column"` 完全限定格式
 */

import type { JSONSchema } from '../types/schema.js'
import { BaseExporter, type ExporterOptions } from './BaseExporter.js'
import { TypeConverter } from '../utils/TypeConverter.js'

// ==================== 类型定义 ====================

export interface PostgreSQLExporterOptions extends ExporterOptions {
  /** PostgreSQL schema 名称（默认 public）*/
  schema: string
  /** 是否使用双引号包裹标识符（默认 false，兼容 v1 行为）*/
  quoteIdentifiers?: boolean
}

export interface GeneratePgIndexOptions {
  name?: string
  unique?: boolean
  method?: 'btree' | 'hash' | 'gin' | 'gist'
}

// ==================== PostgreSQLExporter ====================

export class PostgreSQLExporter extends BaseExporter<PostgreSQLExporterOptions> {
  constructor(options: Partial<PostgreSQLExporterOptions> = {}) {
    super({ schema: 'public', ...options })
  }

  /**
   * 导出为 PostgreSQL CREATE TABLE 语句
   */
  export(tableName: string, jsonSchema: JSONSchema): string {
    if (!tableName || typeof tableName !== 'string') {
      throw new Error('[schema-dsl] Table name is required')
    }
    this._assertObjectSchema(jsonSchema)

    // 修复：使用双引号包裹标识符（避免保留字冲突）
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

  /**
   * 生成 CREATE INDEX 语句
   */
  generateIndex(tableName: string, columnName: string, options: GeneratePgIndexOptions = {}): string {
    const fullTableName = `${this._quoteIdent(this.options.schema)}.${this._quoteIdent(tableName)}`
    const indexName = options.name ?? `idx_${tableName}_${columnName}`
    const unique = options.unique ? 'UNIQUE ' : ''
    const method = options.method ?? 'btree'
    return `CREATE ${unique}INDEX ${this._quoteIdent(indexName)} ON ${fullTableName} USING ${method} (${this._quoteIdent(columnName)});`
  }

  /**
   * 静态快速导出
   */
  static export(tableName: string, jsonSchema: JSONSchema): string {
    return new PostgreSQLExporter().export(tableName, jsonSchema)
  }

  // ==================== 私有方法 ====================

  /** 条件性包裹 PG 标识符（quoteIdentifiers=true 时使用双引号）*/
  private _quoteIdent(name: string): string {
    if (this.options.quoteIdentifiers) {
      return `"${name.replace(/"/g, '""')}"`
    }
    return name
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
    const pgType = TypeConverter.toPostgreSQLType(
      (schema.type as string | string[]) ?? 'string',
      schema,
    )

    let def = `${this._quoteIdent(name)} ${pgType}`

    if (isRequired) def += ' NOT NULL'

    if (schema.default !== undefined) {
      def += ` DEFAULT ${this._formatDefaultValue(schema.default, schema.type as string)}`
    }

    const checkConstraints = this._generateCheckConstraints(name, schema)
    if (checkConstraints.length > 0) {
      def += ' ' + checkConstraints.join(' ')
    }

    return def
  }

  private _generateCheckConstraints(columnName: string, schema: JSONSchema): string[] {
    const checks: string[] = []
    const col = this._quoteIdent(columnName)

    if (schema.minLength !== undefined || schema.maxLength !== undefined) {
      if (schema.minLength !== undefined && schema.maxLength !== undefined) {
        checks.push(`CHECK (LENGTH(${col}) BETWEEN ${schema.minLength} AND ${schema.maxLength})`)
      } else if (schema.minLength !== undefined) {
        checks.push(`CHECK (LENGTH(${col}) >= ${schema.minLength})`)
      } else if (schema.maxLength !== undefined) {
        checks.push(`CHECK (LENGTH(${col}) <= ${schema.maxLength})`)
      }
    }

    if (schema.minimum !== undefined || schema.maximum !== undefined) {
      if (schema.minimum !== undefined && schema.maximum !== undefined) {
        checks.push(`CHECK (${col} BETWEEN ${schema.minimum} AND ${schema.maximum})`)
      } else if (schema.minimum !== undefined) {
        checks.push(`CHECK (${col} >= ${schema.minimum})`)
      } else if (schema.maximum !== undefined) {
        checks.push(`CHECK (${col} <= ${schema.maximum})`)
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
    if (type === 'object' || type === 'array') return `'${JSON.stringify(value)}'::JSONB`
    return String(value)
  }

  private _generateColumnComments(_fullTableName: string, tableName: string, schema: JSONSchema): string[] {
    if (!schema.properties) return []

    const comments: string[] = []
    for (const [name, propSchema] of Object.entries(schema.properties)) {
      if (propSchema.description) {
        // 使用 fullTableName 已经是带引号的格式，column 单独引用
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
