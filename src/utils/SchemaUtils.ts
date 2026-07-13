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
import { createSchemaRecord, setSchemaRecordValue } from './schemaRecord.js'
import { SCHEMA_DSL_CACHE_KEY } from '../core/SchemaCacheKey.js'
import {
  SCHEMA_ARRAY_POSITION_KEYS,
  SCHEMA_DEPENDENCY_MAP_POSITION_KEYS,
  SCHEMA_DIRECT_POSITION_KEYS,
  SCHEMA_MAP_POSITION_KEYS,
} from './schemaApplicators.js'

// Internal: chainable schema wrapper type
interface ChainableSchema extends JSONSchema {
  _isChainable: true
  partial(fields?: string[]): ChainableSchema
  pick(fields: string[]): ChainableSchema
  omit(fields: string[]): ChainableSchema
  extend(extensions: Record<string, unknown>): ChainableSchema
}

type ValidateMethod = (...args: never[]) => unknown
type PerformanceMetadata = { duration: number; timestamp: string }
type WithPerformanceResult<T> = T extends object ? T & { performance: PerformanceMetadata } : T
type WithPerformanceValidator<T extends { validate: ValidateMethod }> = Omit<T, 'validate'> & {
  validate: (...args: Parameters<T['validate']>) => WithPerformanceResult<ReturnType<T['validate']>>
} & T

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
        setSchemaRecordValue(result, key, cloneSchemaValue(value))
      }
    }

    // Merge extension schema (deep-merge same-name nested objects instead of replacing)
    if (extSchema.properties) {
      setSchemaRecordValue(
        result,
        'properties',
        this._mergeProperties(
          (result['properties'] as Record<string, unknown> | undefined) ?? {},
          extSchema.properties as Record<string, unknown>,
        )
      )
    }
    if (extSchema.required) {
      setSchemaRecordValue(
        result,
        'required',
        [...new Set([
          ...(Array.isArray(result['required']) ? result['required'] as string[] : []),
          ...extSchema.required,
        ])]
      )
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
    result['properties'] = createSchemaRecord<unknown>()
    result['required'] = [] as string[]

    for (const field of fields) {
      if (schema.properties && Object.prototype.hasOwnProperty.call(schema.properties, field)) {
        const propertySchema = schema.properties[field]
        setSchemaRecordValue(
          result['properties'] as Record<string, unknown>,
          field,
          isObjectSchema(propertySchema) ? this._clone(propertySchema) : cloneSchemaValue(propertySchema)
        )
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
    const omittedFields = new Set(fields)
    const keptFields = [...this._collectObjectLevelFieldReferences(result, new WeakSet<object>())]
      .filter(field => !omittedFields.has(field))
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
  static withPerformance<V extends { validate: ValidateMethod }>(validator: V): WithPerformanceValidator<V> {
    const originalValidate = validator.validate.bind(validator) as (...args: Parameters<V['validate']>) => ReturnType<V['validate']>
    const monitoredValidate = (...args: Parameters<V['validate']>): WithPerformanceResult<ReturnType<V['validate']>> => {
      const startTime = Date.now()
      const result = originalValidate(...args)
      if (result && typeof result === 'object') {
        ;(result as Record<string, unknown>)['performance'] = {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        }
      }
      return result as WithPerformanceResult<ReturnType<V['validate']>>
    }
    validator.validate = monitoredValidate as V['validate']
    return validator as WithPerformanceValidator<V>
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
    const cloned = cloneSchemaValue(schema)
    delete (cloned as Record<symbol, unknown>)[SCHEMA_DSL_CACHE_KEY]
    return cloned
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
    const result = createSchemaRecord<unknown>()
    for (const [key, baseVal] of Object.entries(base)) {
      setSchemaRecordValue(result, key, cloneSchemaValue(baseVal))
    }
    for (const [key, extVal] of Object.entries(ext)) {
      const baseVal = result[key]
      setSchemaRecordValue(result, key, SchemaUtils._mergeSchemaValue(baseVal, extVal))
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
        setSchemaRecordValue(
          result,
          key,
          SchemaUtils._mergeProperties(result[key] as Record<string, unknown>, value as Record<string, unknown>)
        )
      } else if (key === 'required' && Array.isArray(result[key]) && Array.isArray(value)) {
        setSchemaRecordValue(result, key, [...new Set([...(result[key] as unknown[]), ...value])])
      } else {
        setSchemaRecordValue(result, key, cloneSchemaValue(value))
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
    this._deleteRequiredRecursive(obj, new WeakSet<object>())
  }

  private static _deleteRequiredRecursive(obj: Record<string, unknown>, seen: WeakSet<object>): void {
    if (seen.has(obj)) return
    seen.add(obj)
    delete obj['required']

    for (const key of [...SCHEMA_MAP_POSITION_KEYS, ...SCHEMA_DEPENDENCY_MAP_POSITION_KEYS]) {
      const children = obj[key]
      if (!this._isPlainRecord(children)) continue
      for (const child of Object.values(children)) {
        if (this._isPlainRecord(child)) this._deleteRequiredRecursive(child, seen)
      }
    }

    for (const key of ['items', ...SCHEMA_DIRECT_POSITION_KEYS] as const) {
      const child = obj[key]
      if (Array.isArray(child)) {
        for (const entry of child) {
          if (this._isPlainRecord(entry)) this._deleteRequiredRecursive(entry, seen)
        }
      } else if (this._isPlainRecord(child)) {
        this._deleteRequiredRecursive(child, seen)
      }
    }

    for (const key of SCHEMA_ARRAY_POSITION_KEYS) {
      const children = obj[key]
      if (!Array.isArray(children)) continue
      for (const child of children) {
        if (this._isPlainRecord(child)) this._deleteRequiredRecursive(child, seen)
      }
    }
  }

  private static _deleteRequiredFields(obj: Record<string, unknown>, fields: string[]): void {
    const optional = new Set(fields)
    this._deleteRequiredFieldsAtObjectLevel(obj, optional, new WeakSet<object>())
  }

  private static _prunePickedFieldConstraints(schema: Record<string, unknown>, fields: string[]): void {
    const fieldSet = new Set(fields)
    this._projectObjectLevelFields(schema, fieldSet, new WeakSet<object>(), true)
  }

  private static _deleteRequiredFieldsAtObjectLevel(
    schema: Record<string, unknown>,
    optional: Set<string>,
    seen: WeakSet<object>,
  ): void {
    if (seen.has(schema)) return
    seen.add(schema)

    if (Array.isArray(schema['required'])) {
      schema['required'] = (schema['required'] as string[]).filter(field => !optional.has(field))
      if ((schema['required'] as string[]).length === 0) delete schema['required']
    }

    for (const key of ['allOf', 'anyOf', 'oneOf']) {
      const branches = schema[key]
      if (!Array.isArray(branches)) continue
      for (const branch of branches) {
        if (this._isPlainRecord(branch)) this._deleteRequiredFieldsAtObjectLevel(branch, optional, seen)
      }
    }

    for (const key of ['if', 'then', 'else', 'not']) {
      const branch = schema[key]
      if (this._isPlainRecord(branch)) this._deleteRequiredFieldsAtObjectLevel(branch, optional, seen)
    }

    for (const key of ['dependentSchemas', 'dependencies']) {
      const dependencies = schema[key]
      if (!this._isPlainRecord(dependencies)) continue
      for (const dependency of Object.values(dependencies)) {
        if (this._isPlainRecord(dependency)) this._deleteRequiredFieldsAtObjectLevel(dependency, optional, seen)
      }
    }
  }

  private static _projectObjectLevelFields(
    schema: Record<string, unknown>,
    fields: Set<string>,
    seen: WeakSet<object>,
    preserveEmptyProperties = false,
  ): void {
    if (seen.has(schema)) return
    seen.add(schema)

    if (typeof schema['$ref'] === 'string') {
      throw new Error('[schema-dsl] SchemaUtils cannot safely project schemas that use $ref at the projected object level')
    }

    const properties = schema['properties']
    if (this._isPlainRecord(properties)) {
      for (const key of Object.keys(properties)) {
        if (!fields.has(key)) delete properties[key]
      }
      if (!preserveEmptyProperties && Object.keys(properties).length === 0) delete schema['properties']
    }

    if (Array.isArray(schema['required'])) {
      schema['required'] = (schema['required'] as string[]).filter(field => fields.has(field))
      if ((schema['required'] as string[]).length === 0) delete schema['required']
    }

    const dependentRequired = schema['dependentRequired']
    if (this._isPlainRecord(dependentRequired)) {
      const next = createSchemaRecord<string[]>()
      for (const [field, dependencies] of Object.entries(dependentRequired)) {
        if (!fields.has(field) || !Array.isArray(dependencies)) continue
        const kept = dependencies.map(String).filter(dependency => fields.has(dependency))
        if (kept.length > 0) setSchemaRecordValue(next, field, kept)
      }
      if (Object.keys(next).length > 0) {
        schema['dependentRequired'] = next
      } else {
        delete schema['dependentRequired']
      }
    }

    const dependentSchemas = schema['dependentSchemas']
    if (this._isPlainRecord(dependentSchemas)) {
      const next = createSchemaRecord<unknown>()
      for (const [field, dependency] of Object.entries(dependentSchemas)) {
        if (!fields.has(field) || !this._isPlainRecord(dependency)) continue
        this._projectObjectLevelFields(dependency, fields, seen)
        if (this._hasEffectiveProjectionConstraint(dependency)) {
          setSchemaRecordValue(next, field, dependency)
        }
      }
      if (Object.keys(next).length > 0) schema['dependentSchemas'] = next
      else delete schema['dependentSchemas']
    }

    const dependencies = schema['dependencies']
    if (this._isPlainRecord(dependencies)) {
      const next = createSchemaRecord<unknown>()
      for (const [field, dependency] of Object.entries(dependencies)) {
        if (!fields.has(field)) continue
        if (Array.isArray(dependency)) {
          const kept = dependency.map(String).filter(dependentField => fields.has(dependentField))
          if (kept.length > 0) setSchemaRecordValue(next, field, kept)
          continue
        }
        if (this._isPlainRecord(dependency)) {
          this._projectObjectLevelFields(dependency, fields, seen)
          if (this._hasEffectiveProjectionConstraint(dependency)) {
            setSchemaRecordValue(next, field, dependency)
          }
        }
      }
      if (Object.keys(next).length > 0) {
        schema['dependencies'] = next
      } else {
        delete schema['dependencies']
      }
    }

    const allOf = schema['allOf']
    if (Array.isArray(allOf)) {
      for (const branch of allOf) {
        if (this._isPlainRecord(branch)) this._projectObjectLevelFields(branch, fields, seen)
      }
    }

    for (const key of ['anyOf', 'oneOf'] as const) {
      const branches = schema[key]
      if (!Array.isArray(branches)) continue
      for (const branch of branches) {
        if (!this._isPlainRecord(branch)) continue
        this._assertNonMonotonicProjectionIsClosed(branch, fields, key)
        this._projectObjectLevelFields(branch, fields, seen)
      }
    }

    for (const key of ['if', 'then', 'else', 'not'] as const) {
      const branch = schema[key]
      if (!this._isPlainRecord(branch)) continue
      this._assertNonMonotonicProjectionIsClosed(branch, fields, key)
      this._projectObjectLevelFields(branch, fields, seen)
    }
  }

  private static _assertNonMonotonicProjectionIsClosed(
    schema: Record<string, unknown>,
    fields: Set<string>,
    keyword: string,
  ): void {
    for (const field of this._collectObjectLevelFieldReferences(schema, new WeakSet<object>())) {
      if (!fields.has(field)) {
        throw new Error(`[schema-dsl] SchemaUtils cannot safely project ${keyword} because it references omitted field "${field}"`)
      }
    }
  }

  private static _collectObjectLevelFieldReferences(
    schema: Record<string, unknown>,
    seen: WeakSet<object>,
  ): Set<string> {
    const fields = new Set<string>()
    if (seen.has(schema)) return fields
    seen.add(schema)

    if (this._isPlainRecord(schema['properties'])) {
      for (const key of Object.keys(schema['properties'] as Record<string, unknown>)) fields.add(key)
    }
    if (Array.isArray(schema['required'])) {
      for (const field of schema['required'] as unknown[]) fields.add(String(field))
    }
    for (const key of ['dependentRequired', 'dependentSchemas', 'dependencies']) {
      const dependencies = schema[key]
      if (!this._isPlainRecord(dependencies)) continue
      for (const [field, dependency] of Object.entries(dependencies)) {
        fields.add(field)
        if (Array.isArray(dependency)) {
          for (const dependentField of dependency) fields.add(String(dependentField))
        } else if (this._isPlainRecord(dependency)) {
          for (const dependentField of this._collectObjectLevelFieldReferences(dependency, seen)) {
            fields.add(dependentField)
          }
        }
      }
    }
    for (const key of ['allOf', 'anyOf', 'oneOf']) {
      const branches = schema[key]
      if (!Array.isArray(branches)) continue
      for (const branch of branches) {
        if (!this._isPlainRecord(branch)) continue
        for (const field of this._collectObjectLevelFieldReferences(branch, seen)) fields.add(field)
      }
    }
    for (const key of ['if', 'then', 'else', 'not']) {
      const branch = schema[key]
      if (!this._isPlainRecord(branch)) continue
      for (const field of this._collectObjectLevelFieldReferences(branch, seen)) fields.add(field)
    }
    return fields
  }

  private static _hasEffectiveProjectionConstraint(schema: Record<string, unknown>): boolean {
    return Object.entries(schema).some(([key, value]) => {
      if (key === 'properties' && this._isPlainRecord(value) && Object.keys(value).length === 0) return false
      if (key === 'required' && Array.isArray(value) && value.length === 0) return false
      return key !== 'title' && key !== 'description' && key !== '$comment'
    })
  }

  private static _clone(schema: JSONSchema | ChainableSchema): Record<string, unknown> {
    const raw = '_isChainable' in schema ? this._extractSchema(schema as ChainableSchema) : schema
    return cloneSchemaValue(raw) as Record<string, unknown>
  }

  private static _makeChainable(schema: JSONSchema): ChainableSchema {
    const chainable = createSchemaRecord<unknown>()
    for (const [key, value] of Object.entries(schema)) {
      setSchemaRecordValue(chainable, key, value)
    }

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
    const schema = createSchemaRecord<unknown>()
    for (const key of Object.keys(chainable)) {
      if (key !== '_isChainable') {
        setSchemaRecordValue(schema, key, chainable[key])
      }
    }
    return schema
  }
}
