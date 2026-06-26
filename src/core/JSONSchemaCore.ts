import type { JSONSchema } from '../types/schema.js'
import { Validator } from './Validator.js'
import { createSchemaRecord, setSchemaRecordValue } from '../utils/schemaRecord.js'

/**
 * JSONSchemaCore — v1 compatibility facade.
 *
 * The v2 internals have been split into DslParser / SchemaCompiler / Validator; this class
 * restores the commonly-used chainable entry points from the v1 public API so that users
 * who import from the main entry point do not encounter errors.
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
    if (!this.schema.properties) this.schema.properties = createSchemaRecord<JSONSchema>()
    setSchemaRecordValue(this.schema.properties, name, schema)
    return this
  }

  properties(properties: Record<string, JSONSchema>): this {
    const next = createSchemaRecord<JSONSchema>()
    for (const [key, value] of Object.entries(this.schema.properties ?? {})) {
      setSchemaRecordValue(next, key, value)
    }
    for (const [key, value] of Object.entries(properties)) {
      setSchemaRecordValue(next, key, value)
    }
    this.schema.properties = next
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
