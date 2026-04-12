/**
 * MongoDBExporter — 将 JSON Schema 导出为 MongoDB $jsonSchema 验证 Schema
 */

import type { JSONSchema } from '../types/schema.js'
import { BaseExporter, type ExporterOptions } from './BaseExporter.js'
import { TypeConverter } from '../utils/TypeConverter.js'

// ==================== 类型定义 ====================

export interface MongoDBExporterOptions extends ExporterOptions {
  /** 是否严格模式（validationLevel: 'strict' vs 'moderate'） */
  strict: boolean
}

export interface MongoDBValidationSchema {
  $jsonSchema: Record<string, unknown>
}

export interface MongoDBCreateCommand {
  collectionName: string
  options: {
    validator: MongoDBValidationSchema
    validationLevel: 'strict' | 'moderate'
    validationAction: 'error' | 'warn'
  }
}

// ==================== MongoDBExporter ====================

export class MongoDBExporter extends BaseExporter<MongoDBExporterOptions> {
  constructor(options: Partial<MongoDBExporterOptions> = {}) {
    super({ strict: false, ...options })
  }

  /**
   * 将 JSON Schema 转换为 MongoDB $jsonSchema 验证 Schema
   */
  export(jsonSchema: unknown): MongoDBValidationSchema {
    if (!jsonSchema || typeof jsonSchema !== 'object') {
      throw new Error('[schema-dsl] Invalid JSON Schema')
    }
    const mongoSchema = this._convertSchema(jsonSchema as JSONSchema)
    return { $jsonSchema: mongoSchema }
  }

  /**
   * 生成 db.createCollection() 命令对象
   */
  generateCreateCommand(collectionName: string, jsonSchema: JSONSchema): MongoDBCreateCommand {
    const validationSchema = this.export(jsonSchema)
    return {
      collectionName,
      options: {
        validator: validationSchema,
        validationLevel: this.options.strict ? 'strict' : 'moderate',
        validationAction: 'error',
      },
    }
  }

  /**
   * 生成可执行的 MongoDB 命令字符串
   */
  generateCommand(collectionName: string, jsonSchema: JSONSchema): string {
    const command = this.generateCreateCommand(collectionName, jsonSchema)
    return `db.createCollection("${command.collectionName}", ${JSON.stringify(command.options, null, 2)})`
  }

  /**
   * 静态快速导出
   */
  static export(jsonSchema: JSONSchema): MongoDBValidationSchema {
    return new MongoDBExporter().export(jsonSchema)
  }

  // ==================== 私有方法 ====================

  private _convertSchema(schema: JSONSchema): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    if (schema.type) {
      result['bsonType'] = TypeConverter.toMongoDBType(schema.type as string | string[])
    }

    if (schema.properties) {
      result['properties'] = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        ;(result['properties'] as Record<string, unknown>)[key] = this._convertSchema(value)
      }
    }

    if (schema.required && Array.isArray(schema.required)) {
      result['required'] = schema.required
    }

    if (schema.items) {
      result['items'] = this._convertSchema(schema.items as JSONSchema)
    }

    // 字符串约束
    if (schema.minLength !== undefined) result['minLength'] = schema.minLength
    if (schema.maxLength !== undefined) result['maxLength'] = schema.maxLength
    if (schema.pattern) result['pattern'] = schema.pattern

    // 数值约束
    if (schema.minimum !== undefined) result['minimum'] = schema.minimum
    if (schema.maximum !== undefined) result['maximum'] = schema.maximum

    // 数组约束
    if (schema.minItems !== undefined) result['minItems'] = schema.minItems
    if (schema.maxItems !== undefined) result['maxItems'] = schema.maxItems

    // 枚举
    if (schema.enum) result['enum'] = schema.enum

    // 描述
    if (schema.description) result['description'] = schema.description

    return result
  }
}
