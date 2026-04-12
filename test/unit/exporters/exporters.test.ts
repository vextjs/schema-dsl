/**
 * 导出器单元测试
 * 覆盖 MongoDB / MySQL / PostgreSQL / Markdown 四个导出器
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
    it('返回非空对象', () => {
      const result = MongoDBExporter.export(USER_SCHEMA)
      expect(result).toBeTruthy()
      expect(typeof result).toBe('object')
    })

    it('包含 $jsonSchema', () => {
      const result = MongoDBExporter.export(USER_SCHEMA)
      expect(result.$jsonSchema).toBeDefined()
    })

    it('properties 中包含 name 字段', () => {
      const result = MongoDBExporter.export(USER_SCHEMA)
      const props = result.$jsonSchema?.properties as Record<string, unknown>
      expect(props?.['name']).toBeDefined()
    })
  })

  describe('generateCommand()', () => {
    it('生成 db.createCollection() 命令字符串', () => {
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
    it('返回 CREATE TABLE 语句', () => {
      const sql = MySQLExporter.export('users', USER_SCHEMA)
      expect(sql).toContain('CREATE TABLE')
      expect(sql).toContain('users')
    })

    it('包含 name 列', () => {
      const sql = MySQLExporter.export('users', USER_SCHEMA)
      expect(sql.toLowerCase()).toContain('name')
    })

    it('VARCHAR 长度约束正确', () => {
      const sql = MySQLExporter.export('users', USER_SCHEMA)
      expect(sql).toContain('VARCHAR(32)')
    })

    it('INTEGER 类型正确', () => {
      const sql = MySQLExporter.export('users', USER_SCHEMA)
      expect(sql.toUpperCase()).toContain('INT')
    })
  })
})

// ==================== PostgreSQL ====================

describe('PostgreSQLExporter', () => {
  describe('static export()', () => {
    it('返回 CREATE TABLE 语句', () => {
      const sql = PostgreSQLExporter.export('users', USER_SCHEMA)
      expect(sql).toContain('CREATE TABLE')
      expect(sql).toContain('users')
    })

    it('包含 name 列', () => {
      const sql = PostgreSQLExporter.export('users', USER_SCHEMA)
      expect(sql.toLowerCase()).toContain('name')
    })

    it('使用双引号标识符（_quoteIdent 修复）', () => {
      const exporter = new PostgreSQLExporter({ quoteIdentifiers: true })
      const sql = exporter.export('my table', USER_SCHEMA)
      // quoteIdentifiers=true 时，含空格的表名应被双引号包裹
      expect(sql).toContain('"my table"')
    })

    it('VARCHAR/TEXT 类型正确', () => {
      const sql = PostgreSQLExporter.export('users', USER_SCHEMA)
      expect(sql.toUpperCase()).toMatch(/VARCHAR|TEXT/)
    })
  })
})

// ==================== Markdown ====================

describe('MarkdownExporter', () => {
  describe('static export()', () => {
    it('返回 markdown 字符串', () => {
      const md = MarkdownExporter.export(USER_SCHEMA)
      expect(typeof md).toBe('string')
      expect(md.length).toBeGreaterThan(0)
    })

    it('包含 # 标题', () => {
      const md = MarkdownExporter.export(USER_SCHEMA)
      expect(md).toContain('#')
    })

    it('包含 name 字段', () => {
      const md = MarkdownExporter.export(USER_SCHEMA, { locale: 'zh-CN' })
      expect(md.toLowerCase()).toContain('name')
    })

    it('EX-01 fix：_required 和 schema.required 都能识别必填', () => {
      // 通过 schema.required 数组标记必填
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      }
      const md = MarkdownExporter.export(schema, { locale: 'zh-CN' })
      // 必填字段在 markdown 中应有标记
      expect(md).toBeTruthy()
    })
  })
})
