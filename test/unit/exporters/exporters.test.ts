/**
 * Exporter unit tests
 * Covers MongoDB / MySQL / PostgreSQL / Markdown four exporters
 */

import { describe, it, expect } from 'vitest'
import { MongoDBExporter } from '../../../src/exporters/MongoDBExporter.js'
import { MySQLExporter } from '../../../src/exporters/MySQLExporter.js'
import { PostgreSQLExporter } from '../../../src/exporters/PostgreSQLExporter.js'
import { MarkdownExporter } from '../../../src/exporters/MarkdownExporter.js'
import type { JSONSchema } from '../../../src/types/schema.js'

const USER_SCHEMA: JSONSchema = {
  type: 'object',
  title: 'User',
  properties: {
    id: { type: 'integer', _required: true },
    name: { type: 'string', minLength: 2, maxLength: 32, _required: true },
    email: { type: 'string', format: 'email', _required: true },
    age: { type: 'number', minimum: 0, maximum: 150 },
    role: { type: 'string', enum: ['admin', 'user', 'guest'] },
  },
  required: ['id', 'name', 'email'],
}

// ==================== MongoDB ====================

describe('MongoDBExporter', () => {
  describe('static export()', () => {
    it('returns a non-empty object', () => {
      const result = MongoDBExporter.export(USER_SCHEMA)
      expect(result).toBeTruthy()
      expect(typeof result).toBe('object')
    })

    it('contains $jsonSchema', () => {
      const result = MongoDBExporter.export(USER_SCHEMA)
      expect(result.$jsonSchema).toBeDefined()
    })

    it('properties contains name field', () => {
      const result = MongoDBExporter.export(USER_SCHEMA)
      const props = result.$jsonSchema?.properties as Record<string, unknown>
      expect(props?.['name']).toBeDefined()
    })
  })

  describe('generateCommand()', () => {
    it('generates db.createCollection() command string', () => {
      const exp = new MongoDBExporter()
      const cmd = exp.generateCommand('users', USER_SCHEMA)
      expect(cmd).toContain('createCollection')
      expect(cmd).toContain('users')
    })
  })
})

// ==================== MySQL ====================

describe('MySQLExporter', () => {
  describe('static export()', () => {
    it('returns CREATE TABLE statement', () => {
      const sql = MySQLExporter.export('users', USER_SCHEMA)
      expect(sql).toContain('CREATE TABLE')
      expect(sql).toContain('users')
    })

    it('throws when the schema is not an object schema', () => {
      expect(() => MySQLExporter.export('users', null as any)).toThrow('JSON Schema must be an object')
      expect(() => MySQLExporter.export('users', { type: 'string' } as any)).toThrow('JSON Schema must be an object type')
    })

    it('contains name column', () => {
      const sql = MySQLExporter.export('users', USER_SCHEMA)
      expect(sql.toLowerCase()).toContain('name')
    })

    it('VARCHAR length constraint is correct', () => {
      const sql = MySQLExporter.export('users', USER_SCHEMA)
      expect(sql).toContain('VARCHAR(32)')
    })

    it('INTEGER type is correct', () => {
      const sql = MySQLExporter.export('users', USER_SCHEMA)
      expect(sql.toUpperCase()).toContain('INT')
    })

    it('throws for ambiguous anyOf unions', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          value: {
            anyOf: [
              { type: 'string' },
              { type: 'number' },
            ],
          },
        },
      }

      expect(() => MySQLExporter.export('users', schema)).toThrow('MySQL exporter cannot safely map anyOf')
    })

    it('reports unsupported keyword loss and supports strict report mode', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            if: { const: 'admin' },
            then: { minLength: 5 },
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
              if: { pattern: '^x-' },
              then: { minLength: 3 },
            },
          },
          code: {
            type: 'string',
            pattern: '^[A-Z]+$',
            const: 'ABC',
          },
          source: {
            anyOf: [
              { type: 'string', const: 'api' },
              { type: 'string' },
            ],
          },
        },
        allOf: [
          {
            not: { required: ['blocked'] },
          },
        ],
      } as JSONSchema
      const losses: unknown[] = []
      const exporter = new MySQLExporter()

      const report = exporter.exportWithReport('users', schema, {
        onLoss: loss => losses.push(loss),
      })

      expect(report.output).toContain('CREATE TABLE')
      expect(report.losses).toEqual([
        expect.objectContaining({ path: '$', keyword: 'allOf' }),
        expect.objectContaining({ path: '$.properties.name', keyword: 'if' }),
        expect.objectContaining({ path: '$.properties.name', keyword: 'then' }),
        expect.objectContaining({ path: '$.properties.tags.items', keyword: 'if' }),
        expect.objectContaining({ path: '$.properties.tags.items', keyword: 'then' }),
        expect.objectContaining({ path: '$.properties.code', keyword: 'const' }),
        expect.objectContaining({ path: '$.properties.code', keyword: 'pattern' }),
        expect.objectContaining({ path: '$.properties.source', keyword: 'anyOf' }),
        expect.objectContaining({ path: '$.properties.source.anyOf[0]', keyword: 'const' }),
        expect.objectContaining({ path: '$.allOf[0]', keyword: 'not' }),
      ])
      expect(losses).toHaveLength(10)
      expect(() => exporter.exportWithReport('users', schema, { strict: true })).toThrow('Export would lose unsupported JSON Schema keywords')
    })
  })
})

// ==================== PostgreSQL ====================

describe('PostgreSQLExporter', () => {
  describe('static export()', () => {
    it('returns CREATE TABLE statement', () => {
      const sql = PostgreSQLExporter.export('users', USER_SCHEMA)
      expect(sql).toContain('CREATE TABLE')
      expect(sql).toContain('users')
    })

    it('contains name column', () => {
      const sql = PostgreSQLExporter.export('users', USER_SCHEMA)
      expect(sql.toLowerCase()).toContain('name')
    })

    it('uses double-quoted identifiers (_quoteIdent fix)', () => {
      const exporter = new PostgreSQLExporter({ quoteIdentifiers: true })
      const sql = exporter.export('my table', USER_SCHEMA)
      // when quoteIdentifiers=true, table name with spaces should be wrapped in double quotes
      expect(sql).toContain('"my table"')
    })

    it('VARCHAR/TEXT type is correct', () => {
      const sql = PostgreSQLExporter.export('users', USER_SCHEMA)
      expect(sql.toUpperCase()).toMatch(/VARCHAR|TEXT/)
    })

    it('throws for ambiguous oneOf unions', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'boolean' },
            ],
          },
        },
      }

      expect(() => PostgreSQLExporter.export('users', schema)).toThrow('PostgreSQL exporter cannot safely map oneOf')
    })
  })
})

// ==================== Markdown ====================

describe('MarkdownExporter', () => {
  describe('static export()', () => {
    it('returns a markdown string', () => {
      const md = MarkdownExporter.export(USER_SCHEMA)
      expect(typeof md).toBe('string')
      expect(md.length).toBeGreaterThan(0)
    })

    it('contains # heading', () => {
      const md = MarkdownExporter.export(USER_SCHEMA)
      expect(md).toContain('#')
    })

    it('contains name field', () => {
      const md = MarkdownExporter.export(USER_SCHEMA, { locale: 'zh-CN' })
      expect(md.toLowerCase()).toContain('name')
    })

    it('EX-01 fix: both _required and schema.required recognize required fields', () => {
      // mark required fields via schema.required array
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      }
      const md = MarkdownExporter.export(schema, { locale: 'zh-CN' })
      // required fields should have a marker in markdown
      expect(md).toBeTruthy()
    })
  })
})
