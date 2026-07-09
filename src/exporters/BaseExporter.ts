/**
 * BaseExporter — Base interface and abstract class for all exporters.
 *
 * Provides a unified abstract export() method signature; each exporter subclass implements it.
 */

import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'
import { createExporterLossProjection } from '../core/ir/ExporterProjection.js'

// ==================== Common options type ====================

export interface ExporterOptions {
  [key: string]: unknown
}

export interface ExportLossItem {
  path: string
  keyword: string
  severity: 'warning' | 'error'
  message: string
}

export interface ExportReport<TOutput> {
  output: TOutput
  losses: ExportLossItem[]
}

export interface ExportReportOptions {
  strict?: boolean
  onLoss?: (loss: ExportLossItem) => void
}

type ExportReportTarget = 'mysql' | 'postgresql' | 'mongodb' | 'markdown'

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

  protected _createExportReport<TOutput>(
    output: TOutput,
    schema: JSONSchemaInput,
    options: ExportReportOptions | undefined,
    unsupportedKeywords: readonly string[],
    target: ExportReportTarget,
  ): ExportReport<TOutput> {
    const losses = createExporterLossProjection(schema, target, unsupportedKeywords)
      .lossMetadata
      .map(loss => ({
        path: loss.path,
        keyword: loss.keyword,
        severity: 'warning' as const,
        message: `Keyword "${loss.keyword}" is not represented by this exporter.`,
      }))
    for (const loss of losses) options?.onLoss?.(loss)
    if (options?.strict && losses.length > 0) {
      throw new Error(`[schema-dsl] Export would lose unsupported JSON Schema keywords: ${losses.map(loss => `${loss.path}:${loss.keyword}`).join(', ')}`)
    }
    return { output, losses }
  }
}
