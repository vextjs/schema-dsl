import type { JSONSchema } from '../types/schema.js'
import { Validator } from './Validator.js'

/**
 * JSONSchemaCore — v1 compatibility facade.
 *
 * v2 的内部实现已拆分为 DslParser / SchemaCompiler / Validator；该类仅恢复
 * v1 公开 API 的常用链式构建入口，避免老用户从主入口导入时报错。
 */
export class JSONSchemaCore {
  schema: JSONSchema

  constructor(schema: JSONSchema = {}) {
    this.schema = { ...schema }
  }

  type(typeName: string): this {
    this.schema.type = typeName
    return this
  }

  property(name: string, schema: JSONSchema): this {
    if (!this.schema.properties) this.schema.properties = {}
    this.schema.properties[name] = schema
    return this
  }

  properties(properties: Record<string, JSONSchema>): this {
    this.schema.properties = { ...(this.schema.properties ?? {}), ...properties }
    return this
  }

  required(fields: string[] | string): this {
    this.schema.required = Array.isArray(fields) ? fields : [fields]
    return this
  }

  format(formatName: string): this {
    this.schema.format = formatName
    return this
  }

  pattern(pattern: RegExp | string): this {
    this.schema.pattern = pattern instanceof RegExp ? pattern.source : pattern
    return this
  }

  items(schema: JSONSchema): this {
    this.schema.items = schema
    return this
  }

  toSchema(): JSONSchema {
    return this.schema
  }

  getSchema(): JSONSchema {
    return this.toSchema()
  }

  validate(data: unknown): ReturnType<Validator['validate']> {
    return new Validator().validate(this.schema, data)
  }
}
