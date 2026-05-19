/**
 * MongoDBExporter — Export JSON Schema as a MongoDB $jsonSchema validation schema.
 */

import type { JSONSchema } from '../types/schema.js'
import { BaseExporter, type ExporterOptions } from './BaseExporter.js'
import { TypeConverter } from '../utils/TypeConverter.js'

// ==================== Type definitions ====================

export interface MongoDBExporterOptions extends ExporterOptions {
  /** Whether to use strict mode (validationLevel: 'strict' vs 'moderate'). */
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
   * Convert a JSON Schema to a MongoDB $jsonSchema validation schema.
   */
  export(jsonSchema: unknown): MongoDBValidationSchema {
    if (!jsonSchema || typeof jsonSchema !== 'object') {
      throw new Error('[schema-dsl] Invalid JSON Schema')
    }
    const mongoSchema = this._convertSchema(jsonSchema as JSONSchema)
    return { $jsonSchema: mongoSchema }
  }

  /**
   * Generate a db.createCollection() command object.
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
   * Generate an executable MongoDB command string.
   */
  generateCommand(collectionName: string, jsonSchema: JSONSchema): string {
    const command = this.generateCreateCommand(collectionName, jsonSchema)
    return `db.createCollection("${command.collectionName}", ${JSON.stringify(command.options, null, 2)})`
  }

  /**
   * Static quick-export shorthand.
   */
  static export(jsonSchema: JSONSchema): MongoDBValidationSchema {
    return new MongoDBExporter().export(jsonSchema)
  }

  // ==================== Private methods ====================

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

    // String constraints
    if (schema.minLength !== undefined) result['minLength'] = schema.minLength
    if (schema.maxLength !== undefined) result['maxLength'] = schema.maxLength
    if (schema.pattern) result['pattern'] = schema.pattern

    // Numeric constraints
    if (schema.minimum !== undefined) result['minimum'] = schema.minimum
    if (schema.maximum !== undefined) result['maximum'] = schema.maximum

    // Array constraints
    if (schema.minItems !== undefined) result['minItems'] = schema.minItems
    if (schema.maxItems !== undefined) result['maxItems'] = schema.maxItems

    // Enum
    if (schema.enum) result['enum'] = schema.enum

    // Description
    if (schema.description) result['description'] = schema.description

    return result
  }
}
