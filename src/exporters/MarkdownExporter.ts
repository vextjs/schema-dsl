/**
 * MarkdownExporter — Export JSON Schema as human-readable Markdown documentation.
 *
 * v2 fix:
 *   EX-01: required check prefers prop._required, then falls back to schema.required?.includes(key)
 *          (v1 already had this logic; v2 preserves it with stronger type safety)
 *
 * @version 2.0.0
 */

import type { JSONSchema } from '../types/schema.js'
import { BaseExporter, type ExporterOptions } from './BaseExporter.js'

// ==================== Type definitions ====================

export interface MarkdownExporterOptions extends ExporterOptions {
  title?: string
  locale?: 'zh-CN' | 'en-US' | 'ja-JP'
  includeExample?: boolean
  includeDescription?: boolean
}

type Locale = 'zh-CN' | 'en-US' | 'ja-JP'

// ==================== MarkdownExporter ====================

export class MarkdownExporter extends BaseExporter<MarkdownExporterOptions> {
  constructor(options: Partial<MarkdownExporterOptions> = {}) {
    super({
      title: 'Schema Documentation',
      locale: 'zh-CN',
      includeExample: true,
      includeDescription: true,
      ...options,
    })
  }

  /**
   * Export as a Markdown document.
   */
  export(schema: JSONSchema, options?: Partial<MarkdownExporterOptions>): string {
    return MarkdownExporter.export(schema, { ...this.options, ...options })
  }

  /**
   * Static method: export directly without instantiation.
   */
  static export(schema: JSONSchema, options: Partial<MarkdownExporterOptions> = {}): string {
    const {
      title = 'Schema Documentation',
      locale = 'zh-CN',
      includeExample = true,
      includeDescription = true,
    } = options

    let markdown = `# ${title}\n\n`

    if (includeDescription && schema.description) {
      markdown += `${schema.description}\n\n`
    }

    markdown += this._generateFieldsTable(schema, locale)

    if (includeExample) {
      markdown += '\n' + this._generateExample(schema, locale)
    }

    markdown += '\n' + this._generateConstraintsSection(schema, locale)

    return markdown
  }

  // ==================== Private static methods ====================

  private static _i18nFields = {
    'zh-CN': { fields: '字段列表', name: '字段名', type: '类型', required: '必填', constraints: '约束', description: '说明' },
    'en-US': { fields: 'Fields', name: 'Field', type: 'Type', required: 'Required', constraints: 'Constraints', description: 'Description' },
    'ja-JP': { fields: 'フィールド一覧', name: 'フィールド名', type: 'タイプ', required: '必須', constraints: '制約', description: '説明' },
  }

  private static _i18nTypes: Record<Locale, Record<string, string>> = {
    'zh-CN': { string: '字符串', number: '数字', integer: '整数', boolean: '布尔值', array: '数组', object: '对象', email: '邮箱', url: '网址', date: '日期', uuid: 'UUID' },
    'en-US': { string: 'String', number: 'Number', integer: 'Integer', boolean: 'Boolean', array: 'Array', object: 'Object', email: 'Email', url: 'URL', date: 'Date', uuid: 'UUID' },
    'ja-JP': { string: '文字列', number: '数値', integer: '整数', boolean: 'ブール値', array: '配列', object: 'オブジェクト', email: 'メールアドレス', url: 'URL', date: '日付', uuid: 'UUID' },
  }

  private static _i18nConstraints: Record<Locale, Record<string, string>> = {
    'zh-CN': { length: '长度', range: '范围', pattern: '正则', enum: '枚举', items: '元素数' },
    'en-US': { length: 'Length', range: 'Range', pattern: 'Pattern', enum: 'Enum', items: 'Items' },
    'ja-JP': { length: '長さ', range: '範囲', pattern: '正規表現', enum: '列挙', items: '要素数' },
  }

  private static _i18nRules: Record<Locale, Record<string, string>> = {
    'zh-CN': { rules: '约束规则', required: '必填字段', optional: '可选字段' },
    'en-US': { rules: 'Validation Rules', required: 'Required Fields', optional: 'Optional Fields' },
    'ja-JP': { rules: '検証ルール', required: '必須フィールド', optional: 'オプションフィールド' },
  }

  private static _generateFieldsTable(schema: JSONSchema, locale: Locale): string {
    const t = this._i18nFields[locale] ?? this._i18nFields['en-US']

    let table = `## ${t.fields}\n\n`
    table += `| ${t.name} | ${t.type} | ${t.required} | ${t.constraints} | ${t.description} |\n`
    table += `|--------|------|------|------|------|\n`

    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const type = this._escapeTableCell(this._formatType(prop, locale))
        // EX-01 fix: prefer _required flag, then fall back to schema.required
        const isRequired = !!(
          (prop as Record<string, unknown>)['_required'] === true ||
          schema.required?.includes(key)
        )
        const required = isRequired ? '✅' : '❌'
        const constraints = this._escapeTableCell(this._formatConstraints(prop, locale))
        const description = this._escapeTableCell(this._getDescription(prop, locale))
        const fieldName = this._escapeTableCell(key)

        table += `| ${fieldName} | ${type} | ${required} | ${constraints} | ${description} |\n`
      }
    }

    return table
  }

  private static _escapeTableCell(value: string): string {
    return value
      .replace(/\|/g, '\\|')
      .replace(/\r\n|\r|\n/g, '<br>')
  }

  private static _formatType(prop: JSONSchema, locale: Locale): string {
    const t = this._i18nTypes[locale] ?? this._i18nTypes['en-US']

    if (prop.format) {
      return t[prop.format] ?? prop.format
    }

    if (prop.type === 'array' && prop.items) {
      const itemType = this._formatType(prop.items as JSONSchema, locale)
      return `${t['array'] ?? 'array'}<${itemType}>`
    }

    return t[prop.type as string] ?? String(prop.type ?? 'any')
  }

  private static _formatConstraints(prop: JSONSchema, locale: Locale): string {
    const constraints: string[] = []
    const t = this._i18nConstraints[locale] ?? this._i18nConstraints['en-US']

    if (prop.minLength !== undefined || prop.maxLength !== undefined) {
      if (prop.minLength !== undefined && prop.maxLength !== undefined) {
        constraints.push(`${t['length']}: ${prop.minLength}-${prop.maxLength}`)
      } else if (prop.minLength !== undefined) {
        constraints.push(`${t['length']}: ≥${prop.minLength}`)
      } else if (prop.maxLength !== undefined) {
        constraints.push(`${t['length']}: ≤${prop.maxLength}`)
      }
    }

    if (prop.minimum !== undefined || prop.maximum !== undefined) {
      if (prop.minimum !== undefined && prop.maximum !== undefined) {
        constraints.push(`${t['range']}: ${prop.minimum}-${prop.maximum}`)
      } else if (prop.minimum !== undefined) {
        constraints.push(`${t['range']}: ≥${prop.minimum}`)
      } else if (prop.maximum !== undefined) {
        constraints.push(`${t['range']}: ≤${prop.maximum}`)
      }
    }

    if (prop.minItems !== undefined || prop.maxItems !== undefined) {
      if (prop.minItems !== undefined && prop.maxItems !== undefined) {
        constraints.push(`${t['items']}: ${prop.minItems}-${prop.maxItems}`)
      } else if (prop.minItems !== undefined) {
        constraints.push(`${t['items']}: ≥${prop.minItems}`)
      } else if (prop.maxItems !== undefined) {
        constraints.push(`${t['items']}: ≤${prop.maxItems}`)
      }
    }

    if (prop.pattern) {
      constraints.push(`${t['pattern']}: \`${prop.pattern}\``)
    }

    if (prop.enum) {
      const enumStr = (prop.enum as unknown[]).map(v => `\`${String(v)}\``).join(', ')
      constraints.push(`${t['enum']}: ${enumStr}`)
    }

    return constraints.length > 0 ? constraints.join('<br>') : '-'
  }

  private static _getDescription(prop: JSONSchema, locale: Locale): string {
    const p = prop as Record<string, unknown>

    if (p['_labelI18n'] && typeof p['_labelI18n'] === 'object') {
      const i18n = p['_labelI18n'] as Record<string, string>
      if (i18n[locale]) return i18n[locale]
    }

    if (p['_label']) return p['_label'] as string
    if (prop.description) return prop.description

    return '-'
  }

  private static _generateExample(schema: JSONSchema, locale: Locale): string {
    const i18n: Record<Locale, { example: string }> = {
      'zh-CN': { example: '示例数据' },
      'en-US': { example: 'Example Data' },
      'ja-JP': { example: 'サンプルデータ' },
    }
    const t = i18n[locale] ?? i18n['en-US']

    let example = `## ${t.example}\n\n\`\`\`json\n`
    example += JSON.stringify(this._buildExample(schema), null, 2)
    example += '\n```\n'
    return example
  }

  private static _buildExample(schema: JSONSchema): unknown {
    if (schema.properties) {
      const obj: Record<string, unknown> = {}
      for (const [key, prop] of Object.entries(schema.properties)) {
        const isRequired = !!(
          (prop as Record<string, unknown>)['_required'] === true ||
          schema.required?.includes(key)
        )
        if (isRequired) {
          obj[key] = this._getExampleValue(prop)
        }
      }
      return obj
    }
    return null
  }

  private static _getExampleValue(prop: JSONSchema): unknown {
    if (prop.default !== undefined) return prop.default
    if (prop.enum) return (prop.enum as unknown[])[0]

    switch (prop.type) {
      case 'string':
        if (prop.format === 'email') return 'user@example.com'
        if (prop.format === 'uri' || prop.format === 'url') return 'https://example.com'
        if (prop.format === 'date') return '2025-12-29'
        if (prop.format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000'
        return 'example'
      case 'number':
      case 'integer':
        if (prop.minimum !== undefined) return prop.minimum
        if (prop.maximum !== undefined) return Math.floor(prop.maximum / 2)
        return 0
      case 'boolean':
        return true
      case 'array':
        if (prop.items) return [this._getExampleValue(prop.items as JSONSchema)]
        return []
      case 'object':
        if (prop.properties) return this._buildExample(prop)
        return {}
      default:
        return null
    }
  }

  private static _generateConstraintsSection(schema: JSONSchema, locale: Locale): string {
    if (!schema.properties) return ''

    const t = this._i18nRules[locale] ?? this._i18nRules['en-US']
    const requiredFields: string[] = []
    const optionalFields: string[] = []

    for (const [key, prop] of Object.entries(schema.properties)) {
      const isRequired = !!(
        (prop as Record<string, unknown>)['_required'] === true ||
        schema.required?.includes(key)
      )
      if (isRequired) requiredFields.push(key)
      else optionalFields.push(key)
    }

    let section = `## ${t['rules']}\n\n`

    if (requiredFields.length > 0) {
      section += `**${t['required']}**: ${requiredFields.map(f => `\`${f}\``).join(', ')}\n\n`
    }

    if (optionalFields.length > 0) {
      section += `**${t['optional']}**: ${optionalFields.map(f => `\`${f}\``).join(', ')}\n`
    }

    return section
  }
}
