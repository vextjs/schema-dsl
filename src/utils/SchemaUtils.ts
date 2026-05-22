/**
 * SchemaUtils — Advanced schema operations (reuse, merge, extend, performance monitoring)
 *
 * v2 note: v1's extend/validateBatch used require('../adapters/DslAdapter'),
 *          v2 uses dynamic import or accepts pre-compiled schema directly (avoids circular deps)
 */

import type { JSONSchema } from '../types/schema.js'
import { DslAdapter } from '../adapters/DslAdapter.js'

// Internal: chainable schema wrapper type
interface ChainableSchema extends JSONSchema {
  _isChainable: true
  partial(fields?: string[]): ChainableSchema
  pick(fields: string[]): ChainableSchema
  omit(fields: string[]): ChainableSchema
  extend(extensions: Record<string, unknown>): ChainableSchema
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
    const result: Record<string, unknown> = {
      type: 'object',
      properties: {} as Record<string, unknown>,
      required: [] as string[],
    }

    // Copy base schema
    if (baseSchema.properties) {
      result['properties'] = this._mergeProperties(
        result['properties'] as Record<string, unknown>,
        baseSchema.properties as Record<string, unknown>,
      )
    }
    if (baseSchema.required) {
      result['required'] = [...baseSchema.required]
    }

    // Detect flat DSL definition: if no 'properties' key but has string values, treat as DSL
    let extSchema: JSONSchema
    if (!('properties' in extensions) && Object.values(extensions).some(v => typeof v === 'string')) {
      extSchema = DslAdapter.parseObject(extensions as Record<string, string>).toSchema()
    } else {
      extSchema = extensions as JSONSchema
    }

    // Merge extension schema (deep-merge same-name nested objects instead of replacing)
    if (extSchema.properties) {
      result['properties'] = this._mergeProperties(
        result['properties'] as Record<string, unknown>,
        extSchema.properties as Record<string, unknown>,
      )
    }
    if (extSchema.required) {
      result['required'] = [...new Set([
        ...(result['required'] as string[]),
        ...extSchema.required,
      ])]
    }

    return this._makeChainable(result as JSONSchema)
  }

  /**
   * Pick a subset of fields from a schema.
   */
  static pick(schema: JSONSchema, fields: string[]): ChainableSchema {
    const result: Record<string, unknown> = {
      type: 'object',
      properties: {} as Record<string, unknown>,
      required: [] as string[],
    }

    for (const field of fields) {
      if (schema.properties?.[field]) {
        (result['properties'] as Record<string, unknown>)[field] = this._clone(schema.properties[field] as JSONSchema)
        if (schema.required?.includes(field)) {
          (result['required'] as string[]).push(field)
        }
      }
    }

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

    return this._makeChainable(result as JSONSchema)
  }

  /**
   * Make all fields optional (removes required).
   * @param fields - optional; only process these fields (others remain unchanged)
   */
  static partial(schema: JSONSchema, fields?: string[] | null): ChainableSchema {
    let raw: Record<string, unknown>

    if (fields) {
      const picked = this.pick(schema, fields)
      raw = this._extractSchema(picked)
    } else {
      raw = this._clone(schema)
    }

    this._deleteRequired(raw)

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
    let md = `# ${title}\n\n`

    if (schema.properties) {
      md += '## Fields\n\n'
      md += '| Field | Type | Required | Description |\n'
      md += '|-------|------|----------|-------------|\n'

      for (const [key, prop] of Object.entries(schema.properties)) {
        const required = schema.required?.includes(key) ? '✅' : '❌'
        const type = SchemaUtils._escapeMdCell((prop.type as string) ?? 'any')
        const p = prop as Record<string, unknown>
        const label = SchemaUtils._escapeMdCell((p['_label'] as string) ?? key)
        const escapedKey = SchemaUtils._escapeMdCell(key)

        md += `| ${escapedKey} | ${type} | ${required} | ${label} |\n`

        const constraints: string[] = []
        if (prop.minLength) constraints.push(`minLength: ${prop.minLength}`)
        if (prop.maxLength) constraints.push(`maxLength: ${prop.maxLength}`)
        if (prop.minimum !== undefined) constraints.push(`minimum: ${prop.minimum}`)
        if (prop.maximum !== undefined) constraints.push(`maximum: ${prop.maximum}`)
        if (prop.pattern) constraints.push(`pattern: \`${SchemaUtils._escapeMdCell(String(prop.pattern))}\``)
        if (prop.enum) constraints.push(`enum: ${(prop.enum as unknown[]).join(', ')}`)

        if (constraints.length > 0) {
          md += `| | | | ${SchemaUtils._escapeMdCell(constraints.join('; '))} |\n`
        }
      }
    }

    return md
  }

  static clone(schema: JSONSchema): JSONSchema {
    return JSON.parse(JSON.stringify(schema)) as JSONSchema
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
      html += '<tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>\n'

      for (const [key, prop] of Object.entries(schema.properties)) {
        const required = schema.required?.includes(key) ? '✅' : '❌'
        const type = SchemaUtils._escapeHtml((prop.type as string) ?? 'any')
        const p = prop as Record<string, unknown>
        const label = SchemaUtils._escapeHtml((p['_label'] as string) ?? key)

        html += `<tr><td>${SchemaUtils._escapeHtml(key)}</td><td>${type}</td><td>${required}</td><td>${label}</td></tr>\n`
      }

      html += '</table>\n'
    }

    html += '</body>\n</html>'
    return html
  }

  // ==================== Private Utilities ====================

  private static _escapeMdCell(str: string): string {
    return str.replace(/\|/g, '\\|').replace(/\r\n|\r|\n/g, '<br>')
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
    const result = { ...base }
    for (const [key, extVal] of Object.entries(ext)) {
      const baseVal = result[key]
      if (
        baseVal && extVal &&
        typeof baseVal === 'object' && typeof extVal === 'object' &&
        !Array.isArray(baseVal) && !Array.isArray(extVal)
      ) {
        result[key] = SchemaUtils._mergeProperties(
          baseVal as Record<string, unknown>,
          extVal as Record<string, unknown>,
        )
      } else {
        result[key] = extVal
      }
    }
    return result
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

  private static _clone(schema: JSONSchema | ChainableSchema): Record<string, unknown> {
    const raw = '_isChainable' in schema ? this._extractSchema(schema as ChainableSchema) : schema
    return JSON.parse(JSON.stringify(raw)) as Record<string, unknown>
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
