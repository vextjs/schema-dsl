/**
 * ObjectDslBuilder — v1 compat: dsl(object) returns a chainable builder.
 *
 * BC-2 fix: in v1, the schema returned by dsl({...}) / parseObject() supported .strict() /
 * .requireAll() and other chain decorators, and implemented the toSchema() duck-type interface
 * (Validator passes through internal schema). After v2 refactor, parseObject() returned plain
 * JSONSchema, losing all chain API. This class wraps the DslParser.parseObject() result and
 * exposes v1-equivalent chain methods:
 *   - toSchema()     — return internal JSONSchema (Validator duck-type entry point)
 *   - toJsonSchema() — return clean JSON Schema (internal schema-dsl keywords stripped)
 *   - strict()       — disallow extra properties
 *   - requireAll()   — require all defined properties to be present
 *   - toString()     — serialize to JSON string
 */

import type { JSONSchema } from '../types/schema.js'
import { TypeRegistry } from '../parser/TypeRegistry.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'

export class ObjectDslBuilder {
  readonly _isDslBuilder = true as const
  readonly _isObjectDsl = true as const

  private _schema: JSONSchema

  constructor(schema: JSONSchema) {
    this._schema = schema
  }

  // ==================== Output Methods ====================

  /** Return internal JSONSchema (Validator.validate() duck-type entry point). */
  toSchema(): JSONSchema {
    return cloneSchemaValue(this._schema)
  }

  /** Return clean JSON Schema (internal schema-dsl keywords stripped; safe for serialization or external tools). */
  toJsonSchema(): JSONSchema {
    return TypeRegistry.toJsonSchema(this._schema)
  }

  toString(): string {
    return JSON.stringify(this.toJsonSchema())
  }

  // ==================== Chain Decorator Methods ====================

  /**
   * strict() — disallow extra properties (v1 compat).
   * Equivalent to setting strictSchema: true on the compiled schema.
   */
  strict(): this {
    ; (this._schema as Record<string, unknown>)['strictSchema'] = true
    return this
  }

  /**
   * requireAll() — require all defined properties to be present (v1 compat).
   * Equivalent to setting requiredAll: true on the compiled schema.
   */
  requireAll(): this {
    ; (this._schema as Record<string, unknown>)['requiredAll'] = true
    return this
  }
}
