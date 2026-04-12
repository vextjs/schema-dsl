/**
 * SchemaUtils — Schema 高级操作工具（复用、合并、扩展、性能监控）
 *
 * v2 注意：v1 的 extend/validateBatch 中使用了 require('../adapters/DslAdapter')，
 *          v2 使用动态 import 或直接接受已编译 schema（避免循环依赖）
 */

import type { JSONSchema } from '../types/schema.js'
import { DslAdapter } from '../adapters/DslAdapter.js'

// SchemaUtils 内部：支持链式调用的 Schema 包装类型
interface ChainableSchema extends JSONSchema {
  _isChainable: true
  partial(fields?: string[]): ChainableSchema
  pick(fields: string[]): ChainableSchema
  omit(fields: string[]): ChainableSchema
  extend(extensions: Record<string, unknown>): ChainableSchema
}

// ==================== SchemaUtils ====================

export class SchemaUtils {
  // ========== Schema 复用 ==========

  /**
   * 创建可复用的 Schema 工厂
   * @example const emailField = SchemaUtils.reusable(() => dsl('email!').label('邮箱'))
   */
  static reusable<T>(factory: () => T): () => T {
    return factory
  }

  /**
   * 创建 Schema 片段库
   * @example const fields = SchemaUtils.createLibrary({ email: () => dsl('email!') })
   */
  static createLibrary<T extends Record<string, () => unknown>>(fragments: T): T {
    return fragments
  }

  // ========== Schema 复用和扩展 ==========

  /**
   * 扩展 Schema（类似继承）—— 将 extensions 中的字段合并进 baseSchema
   */
  static extend(baseSchema: JSONSchema, extensions: JSONSchema | Record<string, unknown>): ChainableSchema {
    const result: Record<string, unknown> = {
      type: 'object',
      properties: {} as Record<string, unknown>,
      required: [] as string[],
    }

    // 复制 base schema
    if (baseSchema.properties) {
      Object.assign(result['properties'] as Record<string, unknown>, baseSchema.properties)
    }
    if (baseSchema.required) {
      result['required'] = [...baseSchema.required]
    }

    // Detect flat DSL definition: if no 'properties' key but has string values, treat as DSL
    let extSchema: JSONSchema
    if (!('properties' in extensions) && Object.values(extensions).some(v => typeof v === 'string')) {
      extSchema = DslAdapter.parseObject(extensions as Record<string, string>)
    } else {
      extSchema = extensions as JSONSchema
    }

    // 合并扩展 schema
    if (extSchema.properties) {
      Object.assign(result['properties'] as Record<string, unknown>, extSchema.properties)
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
   * 挑选 Schema 中的部分字段
   */
  static pick(schema: JSONSchema, fields: string[]): ChainableSchema {
    const result: Record<string, unknown> = {
      type: 'object',
      properties: {} as Record<string, unknown>,
      required: [] as string[],
    }

    for (const field of fields) {
      if (schema.properties?.[field]) {
        (result['properties'] as Record<string, unknown>)[field] = schema.properties[field]
        if (schema.required?.includes(field)) {
          (result['required'] as string[]).push(field)
        }
      }
    }

    return this._makeChainable(result as JSONSchema)
  }

  /**
   * 排除 Schema 中的部分字段
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

    // 清理空 required
    if (Array.isArray(result['required']) && (result['required'] as string[]).length === 0) {
      delete result['required']
    }

    return this._makeChainable(result as JSONSchema)
  }

  /**
   * 使所有字段可选（移除 required）
   * @param fields - 可选，只处理这些字段（其余字段保留）
   */
  static partial(schema: JSONSchema, fields?: string[] | null): ChainableSchema {
    let raw: Record<string, unknown>

    if (fields) {
      const picked = this.pick(schema, fields)
      raw = this._extractSchema(picked)
    } else {
      raw = this._clone(schema)
    }

    delete raw['required']

    // 递归移除嵌套 required
    if (raw['properties']) {
      for (const prop of Object.values(raw['properties'] as Record<string, Record<string, unknown>>)) {
        if (prop && prop['type'] === 'object' && prop['required']) {
          delete prop['required']
        }
      }
    }

    return this._makeChainable(raw as JSONSchema)
  }

  // ========== 性能监控 ==========

  /**
   * 为 Validator 实例添加性能监控包装
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
   * 批量验证（复用已编译的 Ajv validate 函数）
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

  // ========== Schema 导出 ==========

  static toMarkdown(schema: JSONSchema, options: { title?: string } = {}): string {
    const { title = 'Schema文档' } = options
    let md = `# ${title}\n\n`

    if (schema.properties) {
      md += '## 字段列表\n\n'
      md += '| 字段 | 类型 | 必填 | 说明 |\n'
      md += '|------|------|------|------|\n'

      for (const [key, prop] of Object.entries(schema.properties)) {
        const required = schema.required?.includes(key) ? '✅' : '❌'
        const type = (prop.type as string) ?? 'any'
        const p = prop as Record<string, unknown>
        const label = (p['_label'] as string) ?? key

        md += `| ${key} | ${type} | ${required} | ${label} |\n`

        const constraints: string[] = []
        if (prop.minLength) constraints.push(`最小长度: ${prop.minLength}`)
        if (prop.maxLength) constraints.push(`最大长度: ${prop.maxLength}`)
        if (prop.minimum !== undefined) constraints.push(`最小值: ${prop.minimum}`)
        if (prop.maximum !== undefined) constraints.push(`最大值: ${prop.maximum}`)
        if (prop.pattern) constraints.push(`格式: \`${prop.pattern}\``)
        if (prop.enum) constraints.push(`可选值: ${(prop.enum as unknown[]).join(', ')}`)

        if (constraints.length > 0) {
          md += `| | | | ${constraints.join('; ')} |\n`
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
    const { title = 'Schema文档' } = options
    let html = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>${title}</title></head>\n<body>\n<h1>${title}</h1>\n`

    if (schema.properties) {
      html += '<table border="1" cellpadding="4">\n'
      html += '<tr><th>字段</th><th>类型</th><th>必填</th><th>说明</th></tr>\n'

      for (const [key, prop] of Object.entries(schema.properties)) {
        const required = schema.required?.includes(key) ? '✅' : '❌'
        const type = (prop.type as string) ?? 'any'
        const p = prop as Record<string, unknown>
        const label = (p['_label'] as string) ?? key

        html += `<tr><td>${key}</td><td>${type}</td><td>${required}</td><td>${label}</td></tr>\n`
      }

      html += '</table>\n'
    }

    html += '</body>\n</html>'
    return html
  }

  // ==================== 私有工具方法 ====================

  private static _clone(schema: JSONSchema | ChainableSchema): Record<string, unknown> {
    const raw = '_isChainable' in schema ? this._extractSchema(schema as ChainableSchema) : schema
    return JSON.parse(JSON.stringify(raw)) as Record<string, unknown>
  }

  private static _makeChainable(schema: JSONSchema): ChainableSchema {
    const self = this
    const chainable = Object.assign({}, schema) as Record<string, unknown>

    Object.defineProperty(chainable, '_isChainable', {
      value: true, enumerable: false, configurable: false,
    })

    const methods = ['partial', 'pick', 'omit', 'extend'] as const
    for (const method of methods) {
      Object.defineProperty(chainable, method, {
        value: (...args: unknown[]) => {
          const rawSchema = self._extractSchema(chainable as ChainableSchema)
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
