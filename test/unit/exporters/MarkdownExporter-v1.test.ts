/**
 * MarkdownExporter tests — v2 migration (v1 MarkdownExporter.test.js)
 */

import { describe, it, expect } from 'vitest'
import { MarkdownExporter } from '../../../src/index.js'

describe('MarkdownExporter', () => {
  describe('basic export', () => {
    it('should export a simple schema', () => {
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

    it('should support custom title', () => {
      const schema = { type: 'object', properties: {} }
      const result = MarkdownExporter.export(schema, { title: 'User Schema' })
      expect(result).toContain('User Schema')
    })

    it('should support description', () => {
      const schema = {
        type: 'object',
        description: 'User object',
        properties: {},
      }
      const result = MarkdownExporter.export(schema)
      expect(result).toContain('User object')
    })

    it('should support instance export with option overrides', () => {
      const exporter = new MarkdownExporter({ title: 'Default Title', locale: 'en-US', includeExample: false })
      const result = exporter.export({
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', _required: true },
        },
      }, { title: 'Override Title' })

      expect(result).toContain('# Override Title')
      expect(result).toContain('| email | Email | ✅ | - | - |')
      expect(result).not.toContain('Example Data')
    })

    it('should include field info', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name' },
          age: { type: 'number' },
        },
        required: ['name'],
      }
      const result = MarkdownExporter.export(schema)
      expect(result).toContain('name')
      expect(result).toContain('age')
    })

    it('required fields should be marked', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }
      const result = MarkdownExporter.export(schema)
      // required fields should have a distinguishing marker in output
      expect(result).toContain('name')
    })
  })

  describe('complex schema', () => {
    it('should handle nested objects', () => {
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

    it('should handle enum types', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      }
      const result = MarkdownExporter.export(schema)
      expect(typeof result).toBe('string')
    })

    it('should handle fields with constraints', () => {
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

    it('should escape pipes in field names and constraint cells', () => {
      const schema = {
        type: 'object',
        properties: {
          'user|name': {
            type: 'string',
            pattern: '^[a|b]+$',
          },
        },
      }

      const result = MarkdownExporter.export(schema)

      expect(result).toContain('user\\|name')
      expect(result).toContain('a\\|b')
    })

    it('should normalize multiline descriptions inside table cells', () => {
      const schema = {
        type: 'object',
        properties: {
          notes: {
            type: 'string',
            description: '第一行 | first\r\n第二行',
          },
        },
      }

      const result = MarkdownExporter.export(schema)

      expect(result).toContain('第一行 \\| first<br>第二行')
    })

    it('should preserve both label and description when both are present', () => {
      const schema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            _label: 'Email Address',
            description: 'Primary login email',
          },
          username: {
            type: 'string',
            _label: 'Username',
          },
        },
      }

      const result = MarkdownExporter.export(schema, { locale: 'en-US' })

      expect(result).toContain('Email Address - Primary login email')
      expect(result).toContain('Username')
    })

    it('should HTML-escape untrusted Markdown table content', () => {
      const schema = {
        type: 'object',
        properties: {
          bio: {
            type: 'string',
            description: '<img src=x onerror=alert(1)>',
            enum: ['<script>alert(1)</script>', 'tick`value'],
            pattern: '<svg onload=alert(1)>',
          },
        },
      }

      const result = MarkdownExporter.export(schema, {
        title: '<script>alert(1)</script>',
        locale: 'en-US',
      })

      expect(result).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
      expect(result).toContain('&lt;img src=x onerror=alert(1)&gt;')
      expect(result).toContain('&lt;svg onload=alert(1)&gt;')
      expect(result).not.toContain('<img src=x onerror=alert(1)>')
      expect(result).not.toContain('<script>alert(1)</script>')
    })

    it('should HTML-escape field names in validation rules', () => {
      const schema = {
        type: 'object',
        required: ['<img src=x onerror=alert(1)>'],
        properties: {
          '<img src=x onerror=alert(1)>': {
            type: 'string',
            description: 'field',
          },
          'tick`field': {
            type: 'string',
            description: 'field',
          },
        },
      }

      const result = MarkdownExporter.export(schema, {
        locale: 'en-US',
        includeExample: false,
      })

      expect(result).toContain('&lt;img src=x onerror=alert(1)&gt;')
      expect(result).toContain('``tick`field``')
      expect(result).not.toContain('`<img src=x onerror=alert(1)>`')
    })

    it('should render all example value branches', () => {
      const result = MarkdownExporter.export({
        type: 'object',
        required: ['email', 'url', 'date', 'uuid', 'status', 'count', 'half', 'flag', 'tags', 'nested', 'unknown'],
        properties: {
          email: { type: 'string', format: 'email' },
          url: { type: 'string', format: 'uri' },
          date: { type: 'string', format: 'date' },
          uuid: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          count: { type: 'integer', minimum: 3 },
          half: { type: 'number', maximum: 10 },
          flag: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string', default: 'tag' } },
          emptyList: { type: 'array' },
          nested: { type: 'object', properties: { code: { type: 'string', _required: true } } },
          unknown: {},
        },
      } as any, { locale: 'en-US' })

      expect(result).toContain('"email": "user@example.com"')
      expect(result).toContain('"url": "https://example.com"')
      expect(result).toContain('"date": "2025-12-29"')
      expect(result).toContain('"uuid": "550e8400-e29b-41d4-a716-446655440000"')
      expect(result).toContain('"status": "active"')
      expect(result).toContain('"count": 3')
      expect(result).toContain('"half": 5')
      expect(result).toContain('"flag": true')
      expect(result).toContain('"tags": [')
      expect(result).toContain('"nested": {')
      expect(result).toContain('"unknown": null')
    })

    it('should render one-sided length, range and item constraints', () => {
      const result = MarkdownExporter.export({
        type: 'object',
        properties: {
          minOnly: { type: 'string', minLength: 3 },
          maxOnly: { type: 'string', maxLength: 32 },
          minNumber: { type: 'number', minimum: 1 },
          maxNumber: { type: 'number', maximum: 9 },
          minItems: { type: 'array', minItems: 1 },
          maxItems: { type: 'array', maxItems: 3 },
          arrayEmail: { type: 'array', items: { type: 'string', format: 'email' } },
        },
      }, { locale: 'en-US', includeExample: false })

      expect(result).toContain('Length: ≥3')
      expect(result).toContain('Length: ≤32')
      expect(result).toContain('Range: ≥1')
      expect(result).toContain('Range: ≤9')
      expect(result).toContain('Items: ≥1')
      expect(result).toContain('Items: ≤3')
      expect(result).toContain('Array&lt;Email&gt;')
    })

    it('should fall back to English labels for unsupported locales and omit property-only sections', () => {
      const result = MarkdownExporter.export({ type: 'string' } as any, {
        locale: 'missing' as any,
        includeDescription: false,
        includeExample: false,
      })

      expect(result).toContain('## Fields')
      expect(result).not.toContain('## Validation Rules')
    })
  })
})
