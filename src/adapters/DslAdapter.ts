/**
 * DslAdapter — DSL 解析适配器（薄封装层）
 *
 * v2 变化：
 *   - 所有解析逻辑委托给 DslParser（替代 v1 DslAdapter._parseType 重复实现）
 *   - 修复 DA-01/DA-02/DA-03（由 DslParser 流水线统一修复）
 *   - parseObject 委托 DslParser.parseObject（替代 JSONSchemaCore）
 */

import type { JSONSchema } from '../types/schema.js'
import type { DslDefinition } from '../types/dsl.js'
import { DslParser } from '../parser/DslParser.js'

export const DslAdapter = {
  /**
   * 解析 DSL 字符串为 JSON Schema
   * 等效于 v1 DslAdapter.parseString()，但委托给统一的 DslParser
   */
  parseString(dslString: string): JSONSchema {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('[schema-dsl] DslAdapter.parseString: DSL must be a string')
    }
    return DslParser.parseString(dslString)
  },

  /**
   * parse() — parseString 别名（向后兼容 v1）
   */
  parse(dslString: string): JSONSchema {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('[schema-dsl] DslAdapter.parse: DSL must be a string')
    }
    const schema = DslParser.parseString(dslString)
    // v1 compat: always set _required (false if not set)
    if ((schema as Record<string, unknown>)['_required'] === undefined) {
      (schema as Record<string, unknown>)['_required'] = false
    }
    return schema
  },

  /**
   * 解析对象形式的 DSL 定义 → JSONSchema（type: object + properties + required[]）
   * 等效于 v1 JSONSchemaCore.buildSchema()
   */
  parseObject(dslObj: DslDefinition): JSONSchema {
    return DslParser.parseObject(dslObj)
  },
  /**
   * toCore() — v1 compat: returns { schema } wrapper
   */
  toCore(dslInput: string | DslDefinition): { schema: JSONSchema } {
    let schema: JSONSchema
    if (typeof dslInput === 'string') {
      schema = this.parse(dslInput)
    } else {
      schema = this.parseObject(dslInput)
    }
    return { schema }
  },
}

export type DslAdapterType = typeof DslAdapter
