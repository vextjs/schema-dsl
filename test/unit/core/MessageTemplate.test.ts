/**
 * MessageTemplate Tests — v2 Migration (v1 MessageTemplate.test.js)
 *
 * v2 changes:
 * - MessageTemplate class is not directly exported
 * - Test the exported renderTemplate function instead (equivalent static method)
 */

import { describe, it, expect } from 'vitest'
import { renderTemplate } from '../../../src/index.js'

describe('MessageTemplate (via renderTemplate)', () => {
  describe('Single Variable Substitution', () => {
    it('should replace a single variable', () => {
      const result = renderTemplate('Hello {{#name}}', { name: 'John' })
      expect(result).toBe('Hello John')
    })

    it('should replace multiple variables', () => {
      const result = renderTemplate('{{#label}}长度不能少于{{#limit}}个字符', {
        label: '用户名',
        limit: 3,
      })
      expect(result).toBe('用户名长度不能少于3个字符')
    })

    it('should preserve placeholder for unfound variable', () => {
      const result = renderTemplate('{{#label}} is {{#missing}}', { label: 'Username' })
      expect(result).toBe('Username is {{#missing}}')
    })
  })

  describe('Special Value Handling', () => {
    it('should handle numeric values', () => {
      const result = renderTemplate('不能少于{{#limit}}个字符', { limit: 5 })
      expect(result).toBe('不能少于5个字符')
    })

    it('should handle array values (joined as string)', () => {
      const result = renderTemplate('Must be one of: {{#valids}}', { valids: ['A', 'B', 'C'] })
      expect(result).toBe('Must be one of: A, B, C')
    })

    it('should handle RegExp values', () => {
      const result = renderTemplate('Must match {{#pattern}}', { pattern: /^[a-z]+$/ })
      expect(result).toBe('Must match /^[a-z]+$/')
    })

    it('should handle Date values', () => {
      const date = new Date('2025-01-01')
      const result = renderTemplate('Must be after {{#limit}}', { limit: date })
      expect(result).toContain('2025-01-01')
    })

    it('v2: null values render as string "null" (v2 behavior: null → "null", not preserved placeholder)', () => {
      // v2 TemplateEngine renders null values as 'null' string
      const result = renderTemplate('{{#label}} {{#missing}}', { label: null })
      expect(result).toBe('null {{#missing}}')
    })
  })

  describe('Template Reuse', () => {
    it('should render quickly (static function)', () => {
      const result = renderTemplate('{{#label}}不能少于{{#limit}}', {
        label: '密码',
        limit: 8,
      })
      expect(result).toBe('密码不能少于8')
    })

    it('should support successive calls', () => {
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

  describe('Empty Template', () => {
    it('should handle empty string template', () => {
      const result = renderTemplate('', { name: 'John' })
      expect(result).toBe('')
    })

    it('should handle template with no variables', () => {
      const result = renderTemplate('固定消息', {})
      expect(result).toBe('固定消息')
    })
  })
})
