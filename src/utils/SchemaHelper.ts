/**
 * SchemaHelper — Schema 辅助函数
 *
 * 提供 Schema 结构操作的常用辅助方法：
 *   isValidSchema、generateSchemaId、cloneSchema、flattenSchema、
 *   getFieldPaths、extractRequiredFields、compareSchemas、simplifySchema、
 *   isValidPropertyName、getSchemaComplexity、summarizeSchema
 */

import type { JSONSchema } from '../types/schema.js'

export class SchemaHelper {
  /**
   * 检查是否为有效的 JSON Schema（至少包含 type/properties/items/$ref 之一）
   */
  static isValidSchema(schema: unknown): schema is JSONSchema {
    if (!schema || typeof schema !== 'object') return false
    const s = schema as Record<string, unknown>
    return !!(s['type'] || s['properties'] || s['items'] || s['$ref'])
  }

  /**
   * 生成 Schema 的基于内容 hash 的唯一 ID
   */
  static generateSchemaId(schema: JSONSchema): string {
    const str = JSON.stringify(schema)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32-bit integer
    }
    return `schema_${Math.abs(hash).toString(36)}`
  }

  /**
   * 深度克隆 Schema（通过 JSON 序列化，不处理 Function/RegExp 字段）
   */
  static cloneSchema(schema: JSONSchema): JSONSchema {
    return JSON.parse(JSON.stringify(schema)) as JSONSchema
  }

  /**
   * 扁平化嵌套 Schema 为点分隔路径形式
   * @param prefix - 属性路径前缀
   */
  static flattenSchema(schema: JSONSchema, prefix = ''): Record<string, JSONSchema> {
    const result: Record<string, JSONSchema> = {}

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (value.type === 'object' && value.properties) {
          Object.assign(result, this.flattenSchema(value, fullKey))
        } else {
          result[fullKey] = value
        }
      }
    }

    return result
  }

  /**
   * 获取 Schema 中所有字段路径（含嵌套 object 和 array 路径）
   */
  static getFieldPaths(schema: JSONSchema): string[] {
    const paths: string[] = []

    function traverse(obj: JSONSchema, currentPath = ''): void {
      if (obj.properties) {
        for (const [key, value] of Object.entries(obj.properties)) {
          const path = currentPath ? `${currentPath}.${key}` : key
          paths.push(path)
          if (value.type === 'object') {
            traverse(value, path)
          } else if (value.type === 'array' && value.items) {
            traverse(value.items as JSONSchema, `${path}[]`)
          }
        }
      }
    }

    traverse(schema)
    return paths
  }

  /**
   * 提取 Schema 中所有 required 字段（含嵌套路径）
   */
  static extractRequiredFields(schema: JSONSchema): string[] {
    const required: string[] = []

    function traverse(obj: JSONSchema, prefix = ''): void {
      if (obj.required && Array.isArray(obj.required)) {
        for (const field of obj.required) {
          required.push(prefix ? `${prefix}.${field}` : field)
        }
      }
      if (obj.properties) {
        for (const [key, value] of Object.entries(obj.properties)) {
          if (value.type === 'object') {
            traverse(value, prefix ? `${prefix}.${key}` : key)
          }
        }
      }
    }

    traverse(schema)
    return required
  }

  /**
   * 浅比较两个 Schema 是否相等（JSON 序列化比较）
   */
  static compareSchemas(schema1: JSONSchema, schema2: JSONSchema): boolean {
    return JSON.stringify(schema1) === JSON.stringify(schema2)
  }

  /**
   * 简化 Schema（移除 $schema、空 properties、空 required）
   */
  static simplifySchema(schema: JSONSchema): JSONSchema {
    const simplified = this.cloneSchema(schema) as Record<string, unknown>

    delete simplified['$schema']

    const props = simplified['properties'] as Record<string, unknown> | undefined
    if (props && Object.keys(props).length === 0) {
      delete simplified['properties']
    }

    const req = simplified['required'] as unknown[] | undefined
    if (req && req.length === 0) {
      delete simplified['required']
    }

    return simplified as JSONSchema
  }

  /**
   * 验证属性名是否合法（字母/数字/下划线/连字符，字母或下划线开头）
   */
  static isValidPropertyName(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name)
  }

  /**
   * 获取 Schema 的最大嵌套深度（复杂度）
   */
  static getSchemaComplexity(schema: JSONSchema): number {
    let maxDepth = 0

    function traverse(obj: JSONSchema, depth: number): void {
      maxDepth = Math.max(maxDepth, depth)
      if (obj.properties) {
        for (const value of Object.values(obj.properties)) {
          if (value.type === 'object') {
            traverse(value, depth + 1)
          } else if (value.type === 'array' && value.items) {
            traverse(value.items as JSONSchema, depth + 1)
          }
        }
      }
    }

    traverse(schema, 0)
    return maxDepth
  }

  /**
   * 生成 Schema 摘要信息
   */
  static summarizeSchema(schema: JSONSchema): {
    type: string
    fieldCount: number
    requiredCount: number
    complexity: number
    hasNested: boolean
    fields: string[]
  } {
    const fields = this.getFieldPaths(schema)
    const requiredFields = this.extractRequiredFields(schema)
    const complexity = this.getSchemaComplexity(schema)

    return {
      type: (schema.type as string) ?? 'unknown',
      fieldCount: fields.length,
      requiredCount: requiredFields.length,
      complexity,
      hasNested: complexity > 0,
      fields,
    }
  }
}
