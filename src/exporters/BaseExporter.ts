/**
 * BaseExporter — 所有导出器的基础接口与抽象类
 *
 * 提供统一的 export() 抽象方法签名，各导出器继承后实现。
 */

import type { JSONSchema } from '../types/schema.js'

// ==================== 公共选项类型 ====================

export interface ExporterOptions {
  [key: string]: unknown
}

// ==================== BaseExporter ====================

export abstract class BaseExporter<TOptions extends ExporterOptions = ExporterOptions> {
  protected options: TOptions

  constructor(options: Partial<TOptions> = {}) {
    this.options = options as TOptions
  }

  /**
   * 导出 JSON Schema 为目标格式
   * 各子类必须实现此方法
   */
  abstract export(...args: unknown[]): unknown

  /**
   * 验证输入的 JSON Schema 是否为有效对象类型 Schema
   * @throws Error if invalid
   */
  protected _assertObjectSchema(jsonSchema: unknown, label = 'JSON Schema'): asserts jsonSchema is JSONSchema & { type: 'object' } {
    if (!jsonSchema || typeof jsonSchema !== 'object') {
      throw new Error(`[schema-dsl] ${label} must be an object`)
    }
    const s = jsonSchema as JSONSchema
    if (s.type !== 'object') {
      throw new Error(`[schema-dsl] ${label} must be an object type (got "${String(s.type)}")`)
    }
  }

  /**
   * 转义 SQL 单引号（通用）
   */
  protected _escapeString(str: string): string {
    return str.replace(/'/g, "''")
  }

  /**
   * 检测 Schema 中的主键列名（id / _id 优先）
   */
  protected _detectPrimaryKey(schema: JSONSchema): string | null {
    if (!schema.properties) return null
    if (schema.properties['id']) return 'id'
    if (schema.properties['_id']) return '_id'
    return null
  }
}
