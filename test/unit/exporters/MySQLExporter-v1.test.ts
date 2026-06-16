/**
 * MySQLExporter tests — v2 migration (v1 MySQLExporter.test.js)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MySQLExporter, dsl } from '../../../src/index.js'

describe('MySQLExporter', () => {
  let exporter: InstanceType<typeof MySQLExporter>

  beforeEach(() => {
    exporter = new MySQLExporter()
  })

  describe('constructor', () => {
    it('should create a MySQLExporter instance', () => {
      expect(exporter).toBeInstanceOf(MySQLExporter)
    })

    it('should use default options', () => {
      expect((exporter as any).options.engine).toBe('InnoDB')
      expect((exporter as any).options.charset).toBe('utf8mb4')
    })

    it('should accept custom options', () => {
      const customExporter = new MySQLExporter({ engine: 'MyISAM', charset: 'utf8' })
      expect((customExporter as any).options.engine).toBe('MyISAM')
      expect((customExporter as any).options.charset).toBe('utf8')
    })
  })

  describe('export()', () => {
    it('should export basic schema', () => {
      const schema = dsl({ name: 'string!', age: 'number' })
      const ddl = exporter.export('users', schema)

      expect(ddl).toContain('CREATE TABLE `users`')
      expect(ddl).toContain('`name` VARCHAR(255) NOT NULL')
      expect(ddl).toContain('`age` DOUBLE')
      expect(ddl).toContain('ENGINE=InnoDB')
    })

    it('should handle primary key (id)', () => {
      const schema = dsl({ id: 'number!', name: 'string' })
      const ddl = exporter.export('users', schema)
      expect(ddl).toContain('PRIMARY KEY (`id`)')
    })

    it('should handle primary key (_id)', () => {
      const schema = dsl({ _id: 'string!', name: 'string' })
      const ddl = exporter.export('users', schema)
      expect(ddl).toContain('PRIMARY KEY (`_id`)')
    })

    it('should convert string constraints (maxLength→TEXT / VARCHAR)', () => {
      // v2: string:-1000 = maxLength 1000, string:-10 = maxLength 10
      const schema = dsl({ bio: 'string:-1000', code: 'string:-10' })
      const ddl = exporter.export('profiles', schema)

      expect(ddl).toContain('`bio` TEXT')      // > 255 → TEXT
      expect(ddl).toContain('`code` VARCHAR(10)')
    })

    it('should convert numeric constraints', () => {
      const schema = dsl({ count: 'integer', score: 'number' })
      const ddl = exporter.export('stats', schema)

      expect(ddl).toContain('`count` BIGINT')
      expect(ddl).toContain('`score` DOUBLE')
    })

    it('should promote integer columns to INT when minimum exceeds SMALLINT range', () => {
      const schema = {
        type: 'object',
        properties: {
          count: { type: 'integer', minimum: -40000, maximum: 100 },
        },
      } as any
      const ddl = exporter.export('stats', schema)

      expect(ddl).toContain('`count` INT')
      expect(ddl).not.toContain('`count` SMALLINT')
    })

    it('should convert booleans', () => {
      const schema = dsl({ active: 'boolean!' })
      const ddl = exporter.export('flags', schema)
      // v2: boolean → BOOLEAN
      expect(ddl).toContain('`active` BOOLEAN NOT NULL')
    })

    it('should convert dates', () => {
      const schema = dsl({ created_at: 'date!' })
      const ddl = exporter.export('logs', schema)
      // v2: date DSL → JSON Schema {type:'string',format:'date'} → DATETIME
      expect(ddl).toContain('`created_at` DATETIME NOT NULL')
    })

    it('should convert objects to JSON', () => {
      const schema = dsl({ meta: 'object' })
      const ddl = exporter.export('data', schema)
      expect(ddl).toContain('`meta` JSON')
    })

    it('should convert arrays to JSON (v2: array type → JSON)', () => {
      // v2 does not support array<string> syntax, use type:array schema directly
      const schema = { type: 'object', properties: { tags: { type: 'array' } } } as any
      const ddl = exporter.export('posts', schema)
      expect(ddl).toContain('`tags` JSON')
    })

    it('should handle enum values (v2: enum string → ENUM type)', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      } as any
      const ddl = exporter.export('users', schema)
      // v2: TypeConverter.toMySQLType detects enum array → ENUM(...)
      expect(ddl).toContain("`status` ENUM('active', 'inactive')")
    })

    it('should allow anyOf when all variants resolve to the same MySQL type', () => {
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

      expect(ddl).toContain('`ip` VARCHAR(255) NULL')
    })

    it('should escape MySQL comment strings with backslashes and control characters', () => {
      const schema = {
        type: 'object',
        properties: {
          note: {
            type: 'string',
            description: "line\nbreak\rcut\x1azero\0quote'backslash\\",
          },
        },
      } as any

      const ddl = exporter.export('notes', schema)

      expect(ddl).toContain("COMMENT 'line\\nbreak\\rcut\\Zzero\\0quote''backslash\\\\'")
    })

    it('should reject unsafe MySQL table options', () => {
      const unsafeExporter = new MySQLExporter({
        engine: 'InnoDB; DROP TABLE secrets; --',
      } as any)
      const schema = { type: 'object', properties: { id: { type: 'integer' } } } as any

      expect(() => unsafeExporter.export('users', schema)).toThrow('Invalid MySQL engine')
    })

    it('should reject non-finite numeric defaults', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'integer', default: '0); DROP TABLE users; --' },
        },
      } as any

      expect(() => exporter.export('users', schema)).toThrow('MySQL numeric default must be a finite number')
    })

    it('should reject object defaults for numeric columns', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'integer', default: { raw: '0); DROP TABLE users; --' } },
        },
      } as any

      expect(() => exporter.export('users', schema)).toThrow('MySQL numeric default must be a finite number')
    })

    it('should throw for anyOf when variants resolve to different MySQL types', () => {
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
        'MySQL exporter cannot safely map anyOf for column "value" to a single SQL type'
      )
    })

    it('should throw for oneOf when variants resolve to different MySQL types', () => {
      const schema = {
        type: 'object',
        properties: {
          value: {
            oneOf: [
              { type: 'string' },
              { type: 'integer' },
            ],
          },
        },
      } as any

      expect(() => exporter.export('mixed_values', schema)).toThrow(
        'MySQL exporter cannot safely map oneOf for column "value" to a single SQL type'
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
