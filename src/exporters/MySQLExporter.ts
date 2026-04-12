/**
 * MySQLExporter — 将 JSON Schema 导出为 MySQL CREATE TABLE DDL
 *
 * v2 修复：
 *   _escapeString 使用标准 SQL 单引号转义（`'` → `''`）
 *   _convertColumn 使用完整 schema 对象传给 TypeConverter.toMySQLType（含 maxLength 等约束）
 */

import type { JSONSchema } from '../types/schema.js'
import { BaseExporter, type ExporterOptions } from './BaseExporter.js'
import { TypeConverter } from '../utils/TypeConverter.js'

// ==================== 类型定义 ====================

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
   * 导出为 MySQL CREATE TABLE 语句
   */
  export(tableName: string, jsonSchema: JSONSchema): string {
    if (!tableName || typeof tableName !== 'string') {
      throw new Error('[schema-dsl] Table name is required')
    }
    this._assertObjectSchema(jsonSchema)

    const columns = this._convertProperties(jsonSchema)
    const primaryKey = this._detectPrimaryKey(jsonSchema)

    let ddl = `CREATE TABLE \`${tableName}\` (\n`
    ddl += columns.map(col => `  ${col}`).join(',\n')

    if (primaryKey) {
      ddl += `,\n  PRIMARY KEY (\`${primaryKey}\`)`
    }

    ddl += `\n)`
    ddl += ` ENGINE=${this.options.engine}`
    ddl += ` DEFAULT CHARSET=${this.options.charset}`
    ddl += ` COLLATE=${this.options.collate};`

    return ddl
  }

  /**
   * 生成 CREATE INDEX 语句
   */
  generateIndex(tableName: string, columnName: string, options: GenerateIndexOptions = {}): string {
    const indexName = options.name ?? `idx_${tableName}_${columnName}`
    const unique = options.unique ? 'UNIQUE ' : ''
    return `CREATE ${unique}INDEX \`${indexName}\` ON \`${tableName}\` (\`${columnName}\`);`
  }

  /**
   * 静态快速导出
   */
  static export(tableName: string, jsonSchema: JSONSchema): string {
    return new MySQLExporter().export(tableName, jsonSchema)
  }

  // ==================== 私有方法 ====================

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
    // 传完整 schema 以便 TypeConverter 读取 maxLength 等约束
    const mysqlType = TypeConverter.toMySQLType(
      (schema.type as string | string[]) ?? 'string',
      schema,
    )

    let def = `\`${name}\` ${mysqlType}`

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
