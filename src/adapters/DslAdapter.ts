
/**
 * DslAdapter — DSL parsing adapter (thin wrapper layer).
 *
 * v2 changes:
 *   - All parsing logic delegated to DslParser (replaces v1 DslAdapter._parseType duplication)
 *   - Fixes DA-01/DA-02/DA-03 (handled uniformly by the DslParser pipeline)
 *   - parseObject delegates to DslParser.parseObject (replaces JSONSchemaCore)
 *   - BC-2 fix: parseObject() returns ObjectDslBuilder (supports chain .strict()/.requireAll())
 *   - BC-4 fix: typeMap getter exposes all registered types; registerType() convenience entry point
 */

import type { JSONSchema } from '../types/schema.js'
import type { DslDefinition } from '../types/dsl.js'
import { DslParser } from '../parser/DslParser.js'
import { TypeRegistry } from '../parser/TypeRegistry.js'
import { ObjectDslBuilder } from '../core/ObjectDslBuilder.js'

type DslMarker = Record<string, unknown>

export const DslAdapter = {
  /**
   * Parse a DSL string into a JSON Schema.
   * Equivalent to v1 DslAdapter.parseString(), but delegates to the unified DslParser.
   */
  parseString(dslString: string): JSONSchema {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('[schema-dsl] DslAdapter.parseString: DSL must be a string')
    }
    return DslParser.parseString(dslString)
  },

  /**
   * parse() — alias for parseString() (backwards compat with v1).
   */
  parse(dslString: string): JSONSchema {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('[schema-dsl] DslAdapter.parse: DSL must be a string')
    }
    const schema = DslParser.parseString(dslString)
    // v1 compat: always set _required (false if not set)
    if ((schema as Record<string, unknown>)['_required'] === undefined) {
      (schema as Record<string, unknown>)['_required'] = false
    }
    return schema
  },

  /**
   * Parse an object-form DSL definition → ObjectDslBuilder (BC-2 fix).
   * v1: parseObject() returned a chainable builder (.strict()/.requireAll()).
   * v2 fix: returns ObjectDslBuilder wrapping the compiled JSONSchema.
   */
  parseObject(dslObj: DslDefinition): ObjectDslBuilder {
    const schema = DslParser.parseObject(dslObj)
    return new ObjectDslBuilder(schema)
  },

  /**
   * Create a Match marker (v1 compat). The actual JSON Schema is built per target field in parseObject.
   */
  match(field: string, map: Record<string, unknown>): DslMarker {
    return { _isMatch: true, field, map }
  },

  /**
   * Create an If marker (v1 compat). The actual JSON Schema is built per target field in parseObject.
   */
  if(condition: string, thenSchema: unknown, elseSchema?: unknown): DslMarker {
    return { _isIf: true, condition, then: thenSchema, else: elseSchema }
  },

  /**
   * toCore() — v1 compat: returns { schema } wrapper
   */
  toCore(dslInput: string | DslDefinition): { schema: JSONSchema } {
    let schema: JSONSchema
    if (typeof dslInput === 'string') {
      schema = this.parse(dslInput)
    } else {
      schema = DslParser.parseObject(dslInput)
    }
    return { schema }
  },

  /**
   * typeMap getter — v1 compat: DslAdapter.typeMap exposes all registered types (BC-4 fix).
   * Assigning typeMap[name] = schema is equivalent to calling TypeRegistry.register(name, schema).
   */
  get typeMap(): Record<string, JSONSchema> {
    const map: Record<string, JSONSchema> = {}
    for (const [name, def] of TypeRegistry.entries()) {
      map[name] = def.baseSchema as JSONSchema
    }
    return new Proxy(map, {
      set(_target: Record<string, JSONSchema>, key: string, value: JSONSchema) {
        TypeRegistry.register(key, { baseSchema: value })
        return true
      },
    })
  },

  /**
   * registerType() — v1 compat: register a custom type into TypeRegistry (BC-4 fix).
   */
  registerType(name: string, schema: JSONSchema): void {
    TypeRegistry.register(name, { baseSchema: schema })
  },
}

export type DslAdapterType = typeof DslAdapter

