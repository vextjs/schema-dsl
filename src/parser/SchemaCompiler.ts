import type { JSONSchema } from '../types/schema.js'
import type { TypeDefinition } from './TypeRegistry.js'
import { createSchemaRecord, setSchemaRecordValue } from '../utils/schemaRecord.js'

/** Callback type for the afterCompile hook (synchronous only). */
export type AfterCompileHook = (schema: JSONSchema) => void

/**
 * SchemaCompiler — assembles TypeDefinition + constraints into the final JSONSchema.
 *
 * Responsibilities:
 *   1. Merge baseSchema + constraints (constraints take priority)
 *   2. Inject _label / _customMessages / _required (from TypeDefinition or caller)
 *   3. Fire afterCompile hooks
 */
export const SchemaCompiler = {
  /**
   * Compile and return a JSONSchema (including internal keys; stripped by toJsonSchema).
   */
  compile(
    typeDef: TypeDefinition,
    constraints: Partial<JSONSchema>,
    meta?: {
      label?: string
      required?: boolean
      afterCompileHook?: AfterCompileHook
    }
  ): JSONSchema {
    // Merge baseSchema + constraints (constraints fields override baseSchema fields)
    const schema: JSONSchema = {
      ...typeDef.baseSchema,
      ...constraints,
    }

    // Inject type-level _customMessages (e.g., phone, idCard types)
    if (typeDef.customMessages) {
      schema['_customMessages'] = {
        ...(schema['_customMessages'] as Record<string, string> | undefined),
        ...typeDef.customMessages,
      }
    }

    // Inject meta
    if (meta?.label) schema['_label'] = meta.label
    if (meta?.required) schema['_required'] = true

    // Fire afterCompile hook (synchronous)
    if (meta?.afterCompileHook) {
      meta.afterCompileHook(schema)
    }

    return schema
  },

  /**
   * Strip internal keys and return a clean JSON Schema (used by toJsonSchema() output).
   */
  toJsonSchema(schema: JSONSchema, internalKeys: ReadonlySet<string>): JSONSchema {
    const result = createSchemaRecord<unknown>()
    for (const [k, v] of Object.entries(schema)) {
      if (!internalKeys.has(k)) {
        setSchemaRecordValue(result, k, v)
      }
    }
    return result as JSONSchema
  },
}
