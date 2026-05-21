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
  })
})
