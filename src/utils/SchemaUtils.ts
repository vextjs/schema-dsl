/**
 * SchemaUtils — Advanced schema operations (reuse, merge, extend, performance monitoring)
 *
 * v2 note: v1's extend/validateBatch used require('../adapters/DslAdapter'),
 *          v2 uses dynamic import or accepts pre-compiled schema directly (avoids circular deps)
 */

import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'
import { DslAdapter } from '../adapters/DslAdapter.js'
import { cloneSchemaValue } from './schemaClone.js'
import { isRawJsonSchemaLike } from './schemaInput.js'

// Internal: chainable schema wrapper type
interface ChainableSchema extends JSONSchema {
  _isChainable: true
  partial(fields?: string[]): ChainableSchema
  pick(fields: string[]): ChainableSchema
  omit(fields: string[]): ChainableSchema
  extend(extensions: Record<string, unknown>): ChainableSchema
}

function isObjectSchema(value: JSONSchemaInput): value is JSONSchema {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

// ==================== SchemaUtils ====================

export class SchemaUtils {
  // ========== Schema Reuse ==========

  /**
   * Create a reusable schema factory.
   * @example const emailField = SchemaUtils.reusable(() => dsl('email!').label('email'))
   */
  static reusable<T>(factory: () => T): () => T {
    return factory
  }

  /**
   * Create a schema fragment library.
   * @example const fields = SchemaUtils.createLibrary({ email: () => dsl('email!') })
   */
  static createLibrary<T extends Record<string, () => unknown>>(fragments: T): T {
    return fragments
  }

  // ========== Schema Reuse & Extension ==========

  /**
   * Extend a schema (like inheritance) — merges extension fields into the base schema.
   */
  static extend(baseSchema: JSONSchema, extensions: JSONSchema | Record<string, unknown>): ChainableSchema {
    const result = this._clone(baseSchema)

    // Detect flat DSL definition without stealing legitimate JSON Schema metadata.
    let extSchema: JSONSchema
    if (!isRawJsonSchemaLike(extensions) && Object.values(extensions).some(v => typeof v === 'string')) {
      extSchema = DslAdapter.parseObject(extensions as Record<string, string>).toSchema()
    } else {
      extSchema = extensions as JSONSchema
    }

    for (const [key, value] of Object.entries(extSchema)) {
      if (key !== 'properties' && key !== 'required') {
        result[key] = cloneSchemaValue(value)
      }
    }

    // Merge extension schema (deep-merge same-name nested objects instead of replacing)
    if (extSchema.properties) {
      result['properties'] = this._mergeProperties(
        (result['properties'] as Record<string, unknown> | undefined) ?? {},
        extSchema.properties as Record<string, unknown>,
      )
    }
    if (extSchema.required) {
      result['required'] = [...new Set([
        ...(Array.isArray(result['required']) ? result['required'] as string[] : []),
        ...extSchema.required,
      ])]
    }
    if (Array.isArray(result['required']) && result['required'].length === 0) {
      delete result['required']
    }

    return this._makeChainable(result as JSONSchema)
  }

  /**
   * Pick a subset of fields from a schema.
   */
  static pick(schema: JSONSchema, fields: string[]): ChainableSchema {
    const result = this._clone(schema)
    result['type'] = 'object'
    result['properties'] = {} as Record<string, unknown>
    result['required'] = [] as string[]

    for (const field of fields) {
      if (schema.properties && Object.prototype.hasOwnProperty.call(schema.properties, field)) {
        const propertySchema = schema.properties[field]
        ;(result['properties'] as Record<string, unknown>)[field] = isObjectSchema(propertySchema)
          ? this._clone(propertySchema)
          : cloneSchemaValue(propertySchema)
        if (schema.required?.includes(field)) {
          (result['required'] as string[]).push(field)
        }
      }
    }

    if ((result['required'] as string[]).length === 0) {
      delete result['required']
    }
    this._prunePickedFieldConstraints(result, fields)

    return this._makeChainable(result as JSONSchema)
  }

  /**
   * Omit fields from a schema.
   */
  static omit(schema: JSONSchema, fields: string[]): ChainableSchema {
    const result = this._clone(schema)

    for (const field of fields) {
      if (result['properties']) {
        delete (result['properties'] as Record<string, unknown>)[field]
      }
      if (Array.isArray(result['required'])) {
        result['required'] = (result['required'] as string[]).filter((f: string) => f !== field)
      }
    }

    // Remove empty required array
    if (Array.isArray(result['required']) && (result['required'] as string[]).length === 0) {
      delete result['required']
    }
    const keptFields = Object.keys((result['properties'] as Record<string, unknown> | undefined) ?? {})
    this._prunePickedFieldConstraints(result, keptFields)

    return this._makeChainable(result as JSONSchema)
  }

  /**
   * Make all fields optional (removes required).
   * @param fields - optional; only process these fields (others remain unchanged)
   */
  static partial(schema: JSONSchema, fields?: string[] | null): ChainableSchema {
    const raw = this._clone(schema)

    if (Array.isArray(fields)) {
      this._deleteRequiredFields(raw, fields)
    } else {
      this._deleteRequired(raw)
    }

    return this._makeChainable(raw as JSONSchema)
  }

  // ========== Performance Monitoring ==========

  /**
   * Wrap a Validator instance with performance monitoring.
   */
  static withPerformance<V extends { validate: (...args: unknown[]) => unknown }>(validator: V): V {
    const originalValidate = validator.validate.bind(validator)
    validator.validate = (...args: unknown[]) => {
      const startTime = Date.now()
      const result = originalValidate(...args) as Record<string, unknown>
      result['performance'] = { duration: Date.now() - startTime, timestamp: new Date().toISOString() }
      return result
    }
    return validator
  }

  /**
   * Batch validate using a pre-compiled Ajv validate function.
   *
   * Note: the schema is compiled once per call but not cached between calls.
   * For repeated batch validation of the same schema, prefer `Validator.validateBatch()`
   * which benefits from the built-in compile cache and returns typed `ValidationResult[]`.
   */
  static validateBatch(
    schema: JSONSchema,
    dataArray: unknown[],
    ajvInstance: { compile: (schema: JSONSchema) => (data: unknown) => boolean } & { errors?: unknown },
  ): {
    results: Array<{ index: number; valid: boolean; errors: unknown; data: unknown }>
    summary: { total: number; valid: number; invalid: number; duration: number; averageTime: number }
  } {
    const startTime = Date.now()
    const compiledValidate = ajvInstance.compile(schema)

    const results = dataArray.map((data, index) => {
      const valid = compiledValidate(data)
      return {
        index,
        valid,
        errors: valid ? null : (compiledValidate as unknown as { errors: unknown }).errors,
        data: valid ? data : null,
      }
    })

    const duration = Date.now() - startTime
    return {
      results,
      summary: {
        total: dataArray.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        duration,
        averageTime: dataArray.length > 0 ? duration / dataArray.length : 0,
      },
    }
  }

  // ========== Schema Export ==========

  static toMarkdown(schema: JSONSchema, options: { title?: string } = {}): string {
    const { title = 'Schema Documentation' } = options
    let md = `# ${SchemaUtils._escapeMarkdownText(title)}\n\n`

    if (schema.properties) {
      md += '## Fields\n\n'
      md += '| Field | Type | Required | Constraints | Description |\n'
      md += '|-------|------|----------|-------------|-------------|\n'

      for (const row of SchemaUtils._collectMarkdownRows(schema)) {
        md += `| ${row.field} | ${row.type} | ${row.required} | ${row.constraints} | ${row.description} |\n`
      }
    }

    return md
  }

  static clone(schema: JSONSchema): JSONSchema {
    return cloneSchemaValue(schema)
  }

  /**
   * toHTML — v1 compat: export schema as HTML document
   */
  static toHTML(schema: JSONSchema, options: { title?: string } = {}): string {
    const { title = 'Schema Documentation' } = options
    const safeTitle = SchemaUtils._escapeHtml(title)
    let html = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>${safeTitle}</title></head>\n<body>\n<h1>${safeTitle}</h1>\n`

    if (schema.properties) {
      html += '<table border="1" cellpadding="4">\n'
      html += '<tr><th>Field</th><th>Type</th><th>Required</th><th>Constraints</th><th>Description</th></tr>\n'

      for (const [key, prop] of Object.entries(schema.properties)) {
        const required = schema.required?.includes(key) ? '✅' : '❌'
        const type = SchemaUtils._escapeHtml(SchemaUtils._formatExportType(prop))
        const description = SchemaUtils._escapeHtml(SchemaUtils._getDisplayDescription(prop))
        const constraints = SchemaUtils._escapeHtml(SchemaUtils._formatExportConstraints(prop))

        html += `<tr><td>${SchemaUtils._escapeHtml(key)}</td><td>${type}</td><td>${required}</td><td>${constraints}</td><td>${description}</td></tr>\n`
      }

      html += '</table>\n'
    }

    html += '</body>\n</html>'
    return html
  }

  // ==================== Private Utilities ====================

  private static _getDisplayDescription(prop: JSONSchemaInput): string {
    if (!isObjectSchema(prop)) return '-'
    const p = prop as Record<string, unknown>
    const label = typeof p['_label'] === 'string' && p['_label'].length > 0
      ? p['_label']
      : undefined
    const description = typeof prop.description === 'string' && prop.description.length > 0
      ? prop.description
      : undefined

    if (description && label && label !== description) return `${label} - ${description}`
    return description ?? label ?? '-'
  }

  private static _collectMarkdownRows(schema: JSONSchema, prefix = ''): Array<{
    field: string
    type: string
    required: string
    constraints: string
    description: string
  }> {
    const rows: Array<{
      field: string
      type: string
      required: string
      constraints: string
      description: string
    }> = []

    if (!schema.properties) return rows

    for (const [key, prop] of Object.entries(schema.properties)) {
      const path = prefix ? `${prefix}.${key}` : key
      rows.push({
        field: SchemaUtils._escapeMdCell(path),
        type: SchemaUtils._escapeMdCell(SchemaUtils._formatExportType(prop)),
        required: schema.required?.includes(key) ? '✅' : '❌',
        constraints: SchemaUtils._escapeMdCell(SchemaUtils._formatExportConstraints(prop)),
        description: SchemaUtils._escapeMdCell(SchemaUtils._getDisplayDescription(prop)),
      })

      if (isObjectSchema(prop) && prop.properties) {
        rows.push(...SchemaUtils._collectMarkdownRows(prop, path))
      }
    }

    return rows
  }

  private static _formatExportType(prop: JSONSchemaInput): string {
    if (!isObjectSchema(prop)) return prop ? 'any' : 'never'
    if (typeof prop.format === 'string' && prop.format.length > 0) return prop.format
    return String(prop.type ?? 'any')
  }

  private static _formatExportConstraints(prop: JSONSchemaInput): string {
    if (!isObjectSchema(prop)) return '-'
    const constraints: string[] = []
    if (prop.minLength !== undefined && prop.maxLength !== undefined) {
      constraints.push(`length: ${prop.minLength}-${prop.maxLength}`)
    } else if (prop.minLength !== undefined) {
      constraints.push(`minLength: ${prop.minLength}`)
    } else if (prop.maxLength !== undefined) {
      constraints.push(`maxLength: ${prop.maxLength}`)
    }
    if (prop.minimum !== undefined && prop.maximum !== undefined) {
      constraints.push(`range: ${prop.minimum}-${prop.maximum}`)
    } else if (prop.minimum !== undefined) {
      constraints.push(`minimum: ${prop.minimum}`)
    } else if (prop.maximum !== undefined) {
      constraints.push(`maximum: ${prop.maximum}`)
    }
    if (prop.pattern) constraints.push(`pattern: ${SchemaUtils._formatInlineCode(prop.pattern)}`)
    if (prop.enum) constraints.push(`enum: ${(prop.enum as unknown[]).map(v => SchemaUtils._formatInlineCode(v)).join(', ')}`)
    return constraints.length > 0 ? constraints.join('; ') : '-'
  }

  private static _escapeMdCell(str: string): string {
    return SchemaUtils._escapeHtml(str).replace(/\|/g, '\\|').replace(/\r\n|\r|\n/g, '<br>')
  }

  private static _escapeMarkdownText(str: string): string {
    return SchemaUtils._escapeHtml(str).replace(/\r\n|\r|\n/g, '\n')
  }

  private static _formatInlineCode(value: unknown): string {
    const text = String(value)
    const runs = text.match(/`+/g) ?? []
    const fence = '`'.repeat(Math.max(1, ...runs.map(run => run.length)) + 1)
    const needsPadding = text.startsWith('`') || text.endsWith('`')
    return needsPadding ? `${fence} ${text} ${fence}` : `${fence}${text}${fence}`
  }

  private static _escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  private static _mergeProperties(
    base: Record<string, unknown>,
    ext: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = cloneSchemaValue(base)
    for (const [key, extVal] of Object.entries(ext)) {
      const baseVal = result[key]
      result[key] = SchemaUtils._mergeSchemaValue(baseVal, extVal)
    }
    return result
  }

  private static _mergeSchemaValue(baseVal: unknown, extVal: unknown): unknown {
    if (!SchemaUtils._isPlainRecord(baseVal) || !SchemaUtils._isPlainRecord(extVal)) {
      return cloneSchemaValue(extVal)
    }

    const baseType = baseVal['type']
    const extType = extVal['type']
    if (baseType !== undefined && extType !== undefined && JSON.stringify(baseType) !== JSON.stringify(extType)) {
      return cloneSchemaValue(extVal)
    }

    const result = cloneSchemaValue(baseVal)
    for (const [key, value] of Object.entries(extVal)) {
      if (key === 'properties' && SchemaUtils._isPlainRecord(result[key]) && SchemaUtils._isPlainRecord(value)) {
        result[key] = SchemaUtils._mergeProperties(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        )
      } else if (key === 'required' && Array.isArray(result[key]) && Array.isArray(value)) {
        result[key] = [...new Set([...(result[key] as unknown[]), ...value])]
      } else {
        result[key] = cloneSchemaValue(value)
      }
    }
    return result
  }

  private static _isPlainRecord(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
  }

  private static _deleteRequired(obj: Record<string, unknown>): void {
    delete obj['required']
    const props = obj['properties']
    if (props && typeof props === 'object') {
      for (const prop of Object.values(props as Record<string, unknown>)) {
        if (prop && typeof prop === 'object') {
          this._deleteRequired(prop as Record<string, unknown>)
        }
      }
    }
  }

  private static _deleteRequiredFields(obj: Record<string, unknown>, fields: string[]): void {
    if (!Array.isArray(obj['required'])) return
    const optional = new Set(fields)
    obj['required'] = (obj['required'] as string[]).filter(field => !optional.has(field))
    if ((obj['required'] as string[]).length === 0) {
      delete obj['required']
    }
  }

  private static _prunePickedFieldConstraints(schema: Record<string, unknown>, fields: string[]): void {
    const fieldSet = new Set(fields)

    const dependentRequired = schema['dependentRequired']
    if (this._isPlainRecord(dependentRequired)) {
      const next: Record<string, string[]> = {}
      for (const [field, dependencies] of Object.entries(dependentRequired)) {
        if (!fieldSet.has(field) || !Array.isArray(dependencies)) continue
        const kept = dependencies.map(String).filter(dependency => fieldSet.has(dependency))
        if (kept.length > 0) next[field] = kept
      }
      if (Object.keys(next).length > 0) {
        schema['dependentRequired'] = next
      } else {
        delete schema['dependentRequired']
      }
    }

    delete schema['dependentSchemas']

    const dependencies = schema['dependencies']
    if (this._isPlainRecord(dependencies)) {
      const next: Record<string, unknown> = {}
      for (const [field, dependency] of Object.entries(dependencies)) {
        if (!fieldSet.has(field) || !Array.isArray(dependency)) continue
        const kept = dependency.map(String).filter(dependentField => fieldSet.has(dependentField))
        if (kept.length > 0) next[field] = kept
      }
      if (Object.keys(next).length > 0) {
        schema['dependencies'] = next
      } else {
        delete schema['dependencies']
      }
    }
  }

  private static _clone(schema: JSONSchema | ChainableSchema): Record<string, unknown> {
    const raw = '_isChainable' in schema ? this._extractSchema(schema as ChainableSchema) : schema
    return cloneSchemaValue(raw) as Record<string, unknown>
  }

  private static _makeChainable(schema: JSONSchema): ChainableSchema {
    const chainable = Object.assign({}, schema) as Record<string, unknown>

    Object.defineProperty(chainable, '_isChainable', {
      value: true, enumerable: false, configurable: false,
    })

    const methods = ['partial', 'pick', 'omit', 'extend'] as const
    for (const method of methods) {
      Object.defineProperty(chainable, method, {
        value: (...args: unknown[]) => {
          const rawSchema = SchemaUtils._extractSchema(chainable as ChainableSchema)
          return (SchemaUtils[method] as (...args: unknown[]) => unknown)(rawSchema, ...args)
        },
        enumerable: false,
        configurable: false,
      })
    }

    return chainable as ChainableSchema
  }

  private static _extractSchema(chainable: ChainableSchema | Record<string, unknown>): Record<string, unknown> {
    const schema: Record<string, unknown> = {}
    for (const key of Object.keys(chainable)) {
      if (key !== '_isChainable') {
        schema[key] = chainable[key]
      }
    }
    return schema
  }
}
