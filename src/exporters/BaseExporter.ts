/**
 * BaseExporter — Base interface and abstract class for all exporters.
 *
 * Provides a unified abstract export() method signature; each exporter subclass implements it.
 */

import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'

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
  ): ExportReport<TOutput> {
    const losses = this._collectUnsupportedKeywordLosses(schema, unsupportedKeywords)
    for (const loss of losses) options?.onLoss?.(loss)
    if (options?.strict && losses.length > 0) {
      throw new Error(`[schema-dsl] Export would lose unsupported JSON Schema keywords: ${losses.map(loss => `${loss.path}:${loss.keyword}`).join(', ')}`)
    }
    return { output, losses }
  }

  private _collectUnsupportedKeywordLosses(
    schema: JSONSchemaInput,
    unsupportedKeywords: readonly string[],
    path = '$',
    rootSchema: JSONSchemaInput = schema,
    seen = new WeakSet<object>(),
    seenRefs = new Set<string>(),
  ): ExportLossItem[] {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return []

    const schemaObject = schema as object
    if (seen.has(schemaObject)) return []
    seen.add(schemaObject)

    const unsupported = new Set(unsupportedKeywords)
    const losses: ExportLossItem[] = []
    const record = schema as Record<string, unknown>

    try {
      for (const keyword of unsupported) {
        if (record[keyword] !== undefined) {
          losses.push({
            path,
            keyword,
            severity: 'warning',
            message: `Keyword "${keyword}" is not represented by this exporter.`,
          })
        }
      }

      const ref = record['$ref']
      if (typeof ref === 'string' && !seenRefs.has(ref)) {
        const resolved = this._resolveLocalRef(rootSchema, ref)
        if (resolved !== undefined && resolved !== schema) {
          seenRefs.add(ref)
          losses.push(...this._collectUnsupportedKeywordLosses(
            resolved as JSONSchemaInput,
            unsupportedKeywords,
            `${path}.$ref(${ref})`,
            rootSchema,
            seen,
            seenRefs,
          ))
          seenRefs.delete(ref)
        }
      }

      for (const key of ['properties', 'patternProperties', 'dependentSchemas', 'dependencies', 'definitions', '$defs']) {
        const children = record[key]
        if (!children || typeof children !== 'object' || Array.isArray(children)) continue
        for (const [childKey, child] of Object.entries(children as Record<string, unknown>)) {
          if (Array.isArray(child)) continue
          losses.push(...this._collectUnsupportedKeywordLosses(child as JSONSchemaInput, unsupportedKeywords, `${path}.${key}.${childKey}`, rootSchema, seen, seenRefs))
        }
      }

      for (const key of ['items', 'prefixItems']) {
        const children = record[key]
        if (Array.isArray(children)) {
          children.forEach((child, index) => {
            losses.push(...this._collectUnsupportedKeywordLosses(child as JSONSchemaInput, unsupportedKeywords, `${path}.${key}[${index}]`, rootSchema, seen, seenRefs))
          })
        } else if (children !== undefined) {
          losses.push(...this._collectUnsupportedKeywordLosses(children as JSONSchemaInput, unsupportedKeywords, `${path}.${key}`, rootSchema, seen, seenRefs))
        }
      }

      for (const key of ['allOf', 'anyOf', 'oneOf']) {
        const children = record[key]
        if (Array.isArray(children)) {
          children.forEach((child, index) => {
            losses.push(...this._collectUnsupportedKeywordLosses(child as JSONSchemaInput, unsupportedKeywords, `${path}.${key}[${index}]`, rootSchema, seen, seenRefs))
          })
        }
      }

      for (const key of ['additionalProperties', 'propertyNames', 'contains', 'not', 'if', 'then', 'else', 'unevaluatedItems', 'unevaluatedProperties']) {
        const child = record[key]
        if (child !== undefined) {
          losses.push(...this._collectUnsupportedKeywordLosses(child as JSONSchemaInput, unsupportedKeywords, `${path}.${key}`, rootSchema, seen, seenRefs))
        }
      }

      return losses
    } finally {
      seen.delete(schemaObject)
    }
  }

  private _resolveLocalRef(rootSchema: unknown, ref: string): unknown {
    if (!ref.startsWith('#')) return undefined
    if (ref === '#') return rootSchema
    if (!ref.startsWith('#/')) return undefined

    let current = rootSchema
    for (const rawSegment of ref.slice(2).split('/')) {
      if (!current || typeof current !== 'object') return undefined
      const segment = this._decodeJsonPointerSegment(rawSegment)
      current = (current as Record<string, unknown>)[segment]
    }
    return current
  }

  private _decodeJsonPointerSegment(segment: string): string {
    let decoded = segment
    try {
      decoded = decodeURIComponent(segment)
    } catch {
      decoded = segment
    }
    return decoded.replace(/~1/g, '/').replace(/~0/g, '~')
  }
}
