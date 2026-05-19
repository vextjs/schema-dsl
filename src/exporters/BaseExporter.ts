/**
 * BaseExporter — Base interface and abstract class for all exporters.
 *
 * Provides a unified abstract export() method signature; each exporter subclass implements it.
 */

import type { JSONSchema } from '../types/schema.js'

// ==================== Common options type ====================

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
   * Export a JSON Schema to the target format.
   * Each subclass must implement this method.
   */
  abstract export(...args: unknown[]): unknown

  /**
   * Assert that the input JSON Schema is a valid object-type schema.
   * @throws Error if invalid.
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
   * Escape SQL single quotes (generic utility).
   */
  protected _escapeString(str: string): string {
    return str.replace(/'/g, "''")
  }

  /**
   * Detect the primary key column name in a schema (id / _id preferred).
   */
  protected _detectPrimaryKey(schema: JSONSchema): string | null {
    if (!schema.properties) return null
    if (schema.properties['id']) return 'id'
    if (schema.properties['_id']) return '_id'
    return null
  }
}
