/**
 * PostgreSQLExporter tests — v2 migration (v1 PostgreSQLExporter.test.js)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PostgreSQLExporter, dsl } from '../../../src/index.js'

describe('PostgreSQLExporter', () => {
  let exporter: InstanceType<typeof PostgreSQLExporter>

  beforeEach(() => {
    exporter = new PostgreSQLExporter({ quoteIdentifiers: true })
  })

  describe('constructor', () => {
    it('should create a PostgreSQLExporter instance', () => {
      expect(exporter).toBeInstanceOf(PostgreSQLExporter)
    })

    it('should use default options', () => {
      expect((exporter as any).options.schema).toBe('public')
    })

    it('should accept custom options', () => {
      const customExporter = new PostgreSQLExporter({ schema: 'app' })
      expect((customExporter as any).options.schema).toBe('app')
    })

    it('should quote identifiers by default', () => {
      const defaultExporter = new PostgreSQLExporter()
      const schema = { type: 'object', properties: { id: { type: 'integer' } } } as any

      const ddl = defaultExporter.export('users"; DROP TABLE secrets; --', schema)

      expect(ddl).toContain('CREATE TABLE "public"."users""; DROP TABLE secrets; --"')
    })
  })

  describe('export()', () => {
    it('should export basic schema', () => {
      const schema = dsl({ name: 'string!', age: 'number' })
      const ddl = exporter.export('users', schema)

      // v2: when quoteIdentifiers=true, identifiers use double quotes; string with no maxLength → VARCHAR(255)
      expect(ddl).toContain('CREATE TABLE "public"."users"')
      expect(ddl).toContain('"name" VARCHAR(255) NOT NULL')
      expect(ddl).toContain('"age" DOUBLE PRECISION')
    })

    it('should handle primary key (id)', () => {
      const schema = dsl({ id: 'number!', name: 'string' })
      const ddl = exporter.export('users', schema)
      // v2: primary key identifiers also use double quotes
      expect(ddl).toContain('PRIMARY KEY ("id")')
    })

    it('should convert string constraints', () => {
      const schema = dsl({ bio: 'string:-1000', code: 'string:-10' })
      const ddl = exporter.export('profiles', schema)

      // v2: maxLength > 255 → TEXT, maxLength ≤ 255 → VARCHAR(N)
      expect(ddl).toContain('"bio" TEXT')
      expect(ddl).toContain('"code" VARCHAR(10)')
    })

    it('should convert numeric constraints', () => {
      const schema = dsl({ count: 'integer', score: 'number' })
      const ddl = exporter.export('stats', schema)

      // v2: integer → BIGINT
      expect(ddl).toContain('"count" BIGINT')
      expect(ddl).toContain('"score" DOUBLE PRECISION')
    })

    it('should convert booleans', () => {
      const schema = dsl({ active: 'boolean!' })
      const ddl = exporter.export('flags', schema)
      expect(ddl).toContain('"active" BOOLEAN NOT NULL')
    })

    it('should convert dates', () => {
      const schema = dsl({ created_at: 'date!' })
      const ddl = exporter.export('logs', schema)
      // v2: date DSL → {type:'string',format:'date'} → DATE
      expect(ddl).toContain('"created_at" DATE NOT NULL')
    })

    it('should convert objects to JSONB', () => {
      const schema = dsl({ meta: 'object' })
      const ddl = exporter.export('data', schema)
      expect(ddl).toContain('"meta" JSONB')
    })

    it('should convert arrays to JSONB (v2: array type → JSONB)', () => {
      const schema = { type: 'object', properties: { tags: { type: 'array' } } } as any
      const ddl = exporter.export('posts', schema)
      expect(ddl).toContain('"tags" JSONB')
    })

    it('should add table comment', () => {
      const schema = dsl({ name: 'string' }) as any
      schema.description = 'User table'
      const ddl = exporter.export('users', schema)
      // v2: use quoted identifiers
      expect(ddl).toContain(`COMMENT ON TABLE "public"."users" IS 'User table'`)
    })

    it('should add column comment', () => {
      const schema = dsl({ name: 'string' }) as any
      schema.properties.name.description = 'User name'
      const ddl = exporter.export('users', schema)
      // v2: use quoted three-part schema.table.column
      expect(ddl).toContain(`COMMENT ON COLUMN "public"."users"."name" IS 'User name'`)
    })

    it('should allow anyOf when all variants resolve to the same PostgreSQL type', () => {
      const schema = {
        type: 'object',
        properties: {
          ip: {
            anyOf: [
              { type: 'string', format: 'ipv4' },
              { type: 'string', format: 'ipv6' },
            ],
          },
        },
      } as any
      const ddl = exporter.export('hosts', schema)

      expect(ddl).toContain('"ip" VARCHAR(255)')
    })

    it('should reject unsafe identifiers when raw identifier mode is requested', () => {
      const rawExporter = new PostgreSQLExporter({ quoteIdentifiers: false })
      const schema = { type: 'object', properties: { id: { type: 'integer' } } } as any

      expect(() => rawExporter.export('users"; DROP TABLE secrets; --', schema)).toThrow(
        'Unsafe PostgreSQL identifier requires quoteIdentifiers=true'
      )
    })

    it('should reject non-finite numeric constraints', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'integer', minimum: '0) OR 1=1; --' },
        },
      } as any

      expect(() => exporter.export('users', schema)).toThrow('PostgreSQL minimum must be a finite number')
    })

    it('should reject non-finite numeric defaults', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'integer', default: '0); DROP TABLE users; --' },
        },
      } as any

      expect(() => exporter.export('users', schema)).toThrow('PostgreSQL default must be a finite number')
    })

    it('should throw for anyOf when variants resolve to different PostgreSQL types', () => {
      const schema = {
        type: 'object',
        properties: {
          value: {
            anyOf: [
              { type: 'string' },
              { type: 'number' },
            ],
          },
        },
      } as any

      expect(() => exporter.export('mixed_values', schema)).toThrow(
        'PostgreSQL exporter cannot safely map anyOf for column "value" to a single SQL type'
      )
    })

    it('should throw for oneOf when variants resolve to different PostgreSQL types', () => {
      const schema = {
        type: 'object',
        properties: {
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'boolean' },
            ],
          },
        },
      } as any

      expect(() => exporter.export('mixed_values', schema)).toThrow(
        'PostgreSQL exporter cannot safely map oneOf for column "value" to a single SQL type'
      )
    })

    it('should throw error when table name is missing', () => {
      expect(() => exporter.export(null as any, {})).toThrow('Table name is required')
    })

    it('should throw error when schema is not an object type', () => {
      expect(() => exporter.export('users', { type: 'string' } as any)).toThrow(
        'JSON Schema must be an object type'
      )
    })
  })
})
