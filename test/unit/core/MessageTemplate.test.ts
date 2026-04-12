/**
 * MessageTemplate 测试 — v2 迁移（v1 MessageTemplate.test.js）
 *
 * v2 变更：
 * - MessageTemplate 类不直接导出
 * - 改为测试导出的 renderTemplate 函数（等价的静态方法）
 */

import { describe, it, expect } from 'vitest'
import { renderTemplate } from '../../../src/index.js'

describe('MessageTemplate（通过 renderTemplate）', () => {
  describe('单变量替换', () => {
    it('应该替换单个变量', () => {
      const result = renderTemplate('Hello {{#name}}', { name: 'John' })
      expect(result).toBe('Hello John')
    })

    it('应该替换多个变量', () => {
      const result = renderTemplate('{{#label}}长度不能少于{{#limit}}个字符', {
        label: '用户名',
        limit: 3,
      })
      expect(result).toBe('用户名长度不能少于3个字符')
    })

    it('应该保留未找到的变量占位符', () => {
      const result = renderTemplate('{{#label}} is {{#missing}}', { label: 'Username' })
      expect(result).toBe('Username is {{#missing}}')
    })
  })

  describe('特殊值处理', () => {
    it('应该处理数值', () => {
      const result = renderTemplate('不能少于{{#limit}}个字符', { limit: 5 })
      expect(result).toBe('不能少于5个字符')
    })

    it('应该处理数组值（join 为字符串）', () => {
      const result = renderTemplate('Must be one of: {{#valids}}', { valids: ['A', 'B', 'C'] })
      expect(result).toBe('Must be one of: A, B, C')
    })

    it('应该处理 RegExp 值', () => {
      const result = renderTemplate('Must match {{#pattern}}', { pattern: /^[a-z]+$/ })
      expect(result).toBe('Must match /^[a-z]+$/')
    })

    it('应该处理 Date 值', () => {
      const date = new Date('2025-01-01')
      const result = renderTemplate('Must be after {{#limit}}', { limit: date })
      expect(result).toContain('2025-01-01')
    })

    it('v2: null 值渲染为字符串 "null"（v2 实现：null → "null"，非保留占位符）', () => {
      // v2 TemplateEngine 对 null 值渲染为 'null' 字符串
      const result = renderTemplate('{{#label}} {{#missing}}', { label: null })
      expect(result).toBe('null {{#missing}}')
    })
  })

  describe('模板复用', () => {
    it('应该快速渲染（静态函数）', () => {
      const result = renderTemplate('{{#label}}不能少于{{#limit}}', {
        label: '密码',
        limit: 8,
      })
      expect(result).toBe('密码不能少于8')
    })

    it('应该支持连续调用', () => {
      const templates = {
        'string.min': '{{#label}}太短',
        'string.max': '{{#label}}太长',
      }
      const context = { label: '用户名' }
      const results = Object.fromEntries(
        Object.entries(templates).map(([k, v]) => [k, renderTemplate(v, context)])
      )

      expect(results['string.min']).toBe('用户名太短')
      expect(results['string.max']).toBe('用户名太长')
    })
  })

  describe('空模板', () => {
    it('应该处理空字符串模板', () => {
      const result = renderTemplate('', { name: 'John' })
      expect(result).toBe('')
    })

    it('应该处理无变量的模板', () => {
      const result = renderTemplate('固定消息', {})
      expect(result).toBe('固定消息')
    })
  })
})
