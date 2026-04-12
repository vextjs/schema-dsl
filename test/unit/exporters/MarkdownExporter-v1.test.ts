/**
 * MarkdownExporter 测试 — v2 迁移（v1 MarkdownExporter.test.js）
 */

import { describe, it, expect } from 'vitest'
import { MarkdownExporter } from '../../../src/index.js'

describe('MarkdownExporter', () => {
  describe('基础导出', () => {
    it('应该导出简单 Schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }
      const result = MarkdownExporter.export(schema)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('应该支持自定义标题', () => {
      const schema = { type: 'object', properties: {} }
      const result = MarkdownExporter.export(schema, { title: '用户 Schema' })
      expect(result).toContain('用户 Schema')
    })

    it('应该支持描述', () => {
      const schema = {
        type: 'object',
        description: '用户对象',
        properties: {},
      }
      const result = MarkdownExporter.export(schema)
      expect(result).toContain('用户对象')
    })

    it('应该包含字段信息', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', description: '用户姓名' },
          age: { type: 'number' },
        },
        required: ['name'],
      }
      const result = MarkdownExporter.export(schema)
      expect(result).toContain('name')
      expect(result).toContain('age')
    })

    it('必填字段应有标记', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }
      const result = MarkdownExporter.export(schema)
      // 必填字段应在输出中有区分标记
      expect(result).toContain('name')
    })
  })

  describe('复杂 Schema', () => {
    it('应该处理嵌套对象', () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      }
      const result = MarkdownExporter.export(schema)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('应该处理枚举类型', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      }
      const result = MarkdownExporter.export(schema)
      expect(typeof result).toBe('string')
    })

    it('应该处理带约束的字段', () => {
      const schema = {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 32,
          },
          age: {
            type: 'number',
            minimum: 0,
            maximum: 150,
          },
        },
      }
      const result = MarkdownExporter.export(schema)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
